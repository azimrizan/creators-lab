import { Types } from 'mongoose';
import Checkpoint, { ICheckpointDocument } from '@/models/Checkpoint';
import FollowUpQuestion from '@/models/FollowUpQuestion';
import Attempt from '@/models/Attempt';
import LessonProgress from '@/models/LessonProgress';
import { chatJSON } from '@/lib/ai/groq';
import { ApiError, fence, shuffleOptions, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { lessonChunks } from '@/lib/ai/retrieval';

/** Approved checkpoints for a lesson, without answers, plus which ones this learner already cleared. */
export async function checkpointsForLearner(userId: string | null, courseSlug: string, lessonId: string) {
  const checkpoints = await Checkpoint.find({ courseSlug, lessonId, status: 'APPROVED' }).sort({ atSec: 1 }).lean<ICheckpointDocument[]>();

  let answered = new Set<string>();
  if (userId) {
    const attempts = await Attempt.find({ userId, courseSlug, lessonId, kind: 'CHECKPOINT' }).select('refId').lean<Array<{ refId: string }>>();
    answered = new Set(attempts.map(a => a.refId));
  }

  return checkpoints.map(cp => {
    const id = String(cp._id);
    const questions = cp.questions.map(q => ({ qid: q.qid, question: q.question, options: q.options, answered: answered.has(`${id}:${q.qid}`) }));
    return {
      id,
      atSec: cp.atSec,
      rewatchFromSec: cp.rewatchFromSec,
      topic: cp.topic,
      questions,
      cleared: questions.every(q => q.answered)
    };
  });
}

async function findCheckpoint(checkpointId: string) {
  if (!Types.ObjectId.isValid(checkpointId)) throw new ApiError(400, 'Invalid checkpoint.');
  const cp = await Checkpoint.findOne({ _id: checkpointId, status: 'APPROVED' }).lean<ICheckpointDocument>();
  if (!cp) throw new ApiError(404, 'Checkpoint not found.');
  return cp;
}

/** Grades one checkpoint answer server-side and records it for reports. */
export async function answerCheckpoint(userId: string | null, checkpointId: string, qid: string, choice: number) {
  const cp = await findCheckpoint(checkpointId);
  const question = cp.questions.find(q => q.qid === qid);
  if (!question) throw new ApiError(404, 'Question not found.');
  if (!Number.isInteger(choice) || choice < 0 || choice >= question.options.length) throw new ApiError(400, 'Choose one of the options.');

  const correct = choice === question.correctIndex;
  let cleared = false;

  if (userId) {
    const refId = `${checkpointId}:${qid}`;
    const already = await Attempt.exists({ userId, kind: 'CHECKPOINT', refId });
    if (!already) {
      await Attempt.create({
        userId,
        courseSlug: cp.courseSlug,
        lessonId: cp.lessonId,
        kind: 'CHECKPOINT',
        refId,
        topic: cp.topic,
        question: question.question,
        correct,
        points: correct ? 1 : 0,
        maxPoints: 1,
        timestampSec: cp.rewatchFromSec
      });
    }
    const answeredCount = await Attempt.countDocuments({
      userId,
      kind: 'CHECKPOINT',
      refId: { $in: cp.questions.map(q => `${checkpointId}:${q.qid}`) }
    });
    cleared = answeredCount >= cp.questions.length;
    if (cleared) {
      await LessonProgress.updateOne(
        { userId, courseSlug: cp.courseSlug, lessonId: cp.lessonId },
        { $addToSet: { clearedCheckpointIds: checkpointId } },
        { upsert: true }
      );
    }
  }

  return {
    correct,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    rewatchFromSec: cp.rewatchFromSec,
    cleared
  };
}

/** After a wrong answer, writes a different question on the same idea from the same part of the video. */
export async function createFollowUp(userKey: string, checkpointId: string, qid: string) {
  const cp = await findCheckpoint(checkpointId);
  const original = cp.questions.find(q => q.qid === qid);
  if (!original) throw new ApiError(404, 'Question not found.');

  const recent = await FollowUpQuestion.countDocuments({ userId: userKey, checkpointId, createdAt: { $gt: new Date(Date.now() - 3600_000) } });
  if (recent >= 3) throw new ApiError(429, 'You have tried several follow-ups here. Rewatch this part, then continue.');

  const chunks = (await lessonChunks(cp.courseSlug, cp.lessonId)).filter(
    c => c.endSec > cp.rewatchFromSec - 20 && c.startSec <= cp.atSec + 5
  );
  if (!chunks.length) throw new ApiError(409, 'No transcript is available for this part of the lesson.');

  const generated = await chatJSON<{ question: string; options: string[]; correctIndex: number; explanation: string }>({
    agent: 'checkpoint-quiz',
    userKey,
    tier: 'fast',
    maxTokens: 900,
    temperature: 0.6,
    schemaName: 'follow_up_question',
    schema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        options: { type: 'array', items: { type: 'string' } },
        correctIndex: { type: 'integer' },
        explanation: { type: 'string' }
      },
      required: ['question', 'options', 'correctIndex', 'explanation'],
      additionalProperties: false
    },
    messages: [
      {
        role: 'system',
        content: `You write one multiple-choice question that checks the same concept as a question the learner just missed, but from a different angle (for example a practical scenario). Use only facts from the transcript. Exactly 4 options, one correct, correctIndex 0-3. The explanation should teach the idea in 1-2 sentences. ${UNTRUSTED_DATA_RULE}`
      },
      {
        role: 'user',
        content: `Concept: ${cp.topic}\nQuestion they missed: ${original.question}\n\n${fence('transcript', chunks.map(c => c.text).join('\n'))}`
      }
    ]
  });

  if (!generated.question || generated.options?.length !== 4 || generated.correctIndex < 0 || generated.correctIndex > 3) {
    throw new ApiError(502, 'Could not create a follow-up question. Please continue or rewatch this part.');
  }

  const shuffled = shuffleOptions(generated);
  const doc = await FollowUpQuestion.create({
    userId: userKey,
    courseSlug: cp.courseSlug,
    lessonId: cp.lessonId,
    checkpointId,
    topic: cp.topic,
    question: shuffled.question,
    options: shuffled.options,
    correctIndex: shuffled.correctIndex,
    explanation: shuffled.explanation
  });

  return { followUpId: String(doc._id), question: doc.question, options: doc.options };
}

export async function answerFollowUp(userKey: string, userId: string | null, followUpId: string, choice: number) {
  if (!Types.ObjectId.isValid(followUpId)) throw new ApiError(400, 'Invalid question.');
  const fu = await FollowUpQuestion.findOne({ _id: followUpId, userId: userKey });
  if (!fu) throw new ApiError(404, 'Question not found.');
  if (!Number.isInteger(choice) || choice < 0 || choice >= fu.options.length) throw new ApiError(400, 'Choose one of the options.');

  const correct = choice === fu.correctIndex;
  if (fu.answeredCorrectly === undefined) {
    fu.answeredCorrectly = correct;
    await fu.save();
    if (userId) {
      await Attempt.create({
        userId,
        courseSlug: fu.courseSlug,
        lessonId: fu.lessonId,
        kind: 'FOLLOW_UP',
        refId: followUpId,
        topic: fu.topic,
        question: fu.question,
        correct,
        points: correct ? 1 : 0,
        maxPoints: 1
      });
    }
  }
  return { correct, correctIndex: fu.correctIndex, explanation: fu.explanation };
}
