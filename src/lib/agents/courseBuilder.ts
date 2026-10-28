import path from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import Transcript from '@/models/Transcript';
import TranscriptChunk from '@/models/TranscriptChunk';
import Checkpoint from '@/models/Checkpoint';
import BankQuestion from '@/models/BankQuestion';
import StudyKit from '@/models/StudyKit';
import UserModel from '@/models/User';
import { chatJSON, transcribe } from '@/lib/ai/groq';
import { ApiError, fence, shuffleOptions, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { invalidateCourseIndex, lessonChunks } from '@/lib/ai/retrieval';
import { allLessons } from '@/lib/courses';
import { SessionUser, isAdmin } from '@/lib/auth';
import { Course, Lesson } from '@/lib/types';

const WHISPER_MAX_BYTES = Number(process.env.WHISPER_MAX_MB || 25) * 1024 * 1024;
const CHUNK_TARGET_SEC = 75;
const CHUNK_MAX_CHARS = 1100;

/** Instructors may manage their own courses; admins and content managers may manage any. */
export async function canManageCourse(user: SessionUser, course: Course): Promise<boolean> {
  if (isAdmin(user.role)) return true;
  if (user.role !== 'INSTRUCTOR') return false;
  if (course.instructorId === user.userId) return true;
  if (Types.ObjectId.isValid(user.userId)) {
    const dbUser = await UserModel.findById(user.userId).select('name').lean<{ name: string }>();
    if (dbUser?.name && course.instructorName.includes(dbUser.name)) return true;
  }
  return false;
}

async function loadMedia(videoUrl: string): Promise<{ blob: Blob; filename: string }> {
  if (videoUrl.startsWith('/')) {
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.resolve(publicDir, '.' + decodeURIComponent(videoUrl));
    if (!filePath.startsWith(publicDir + path.sep)) throw new ApiError(400, 'Invalid video path.');
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat) throw new ApiError(404, `Video file not found: ${videoUrl}`);
    if (stat.size > WHISPER_MAX_BYTES) {
      throw new ApiError(413, `This video is ${(stat.size / 1048576).toFixed(0)}MB; transcription accepts up to ${WHISPER_MAX_BYTES / 1048576}MB. Upload a compressed or audio-only version.`);
    }
    const buffer = await fs.readFile(filePath);
    return { blob: new Blob([buffer]), filename: path.basename(filePath) };
  }

  if (!/^https?:\/\//i.test(videoUrl)) throw new ApiError(400, 'Unsupported video URL.');
  const res = await fetch(videoUrl, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new ApiError(502, `Could not download the video (${res.status}).`);
  const length = Number(res.headers.get('content-length') || 0);
  if (length > WHISPER_MAX_BYTES) throw new ApiError(413, 'This video is too large to transcribe. Upload a compressed or audio-only version.');
  const blob = await res.blob();
  if (blob.size > WHISPER_MAX_BYTES) throw new ApiError(413, 'This video is too large to transcribe. Upload a compressed or audio-only version.');
  return { blob, filename: videoUrl.split('/').pop()?.split('?')[0] || 'lesson.mp4' };
}

/** Groups Whisper segments into ~75 second passages, breaking only between segments. */
function buildChunks(segments: Array<{ start: number; end: number; text: string }>) {
  const chunks: Array<{ startSec: number; endSec: number; text: string }> = [];
  let current: { startSec: number; endSec: number; text: string } | null = null;
  for (const seg of segments) {
    if (!seg.text) continue;
    if (!current) {
      current = { startSec: seg.start, endSec: seg.end, text: seg.text };
      continue;
    }
    const tooLong = seg.end - current.startSec > CHUNK_TARGET_SEC || current.text.length + seg.text.length > CHUNK_MAX_CHARS;
    if (tooLong) {
      chunks.push(current);
      current = { startSec: seg.start, endSec: seg.end, text: seg.text };
    } else {
      current.endSec = seg.end;
      current.text += ' ' + seg.text;
    }
  }
  if (current) chunks.push(current);
  return chunks.map(c => ({ ...c, startSec: Math.floor(c.startSec), endSec: Math.ceil(c.endSec) }));
}

/** Step 1: transcribe a lesson video (cached per file) and store searchable passages. */
export async function transcribeLesson(course: Course, lesson: Lesson, userKey: string) {
  if (lesson.contentType !== 'VIDEO' || !lesson.videoUrl) {
    throw new ApiError(400, 'Only video lessons can be transcribed.');
  }

  const mediaKey = lesson.videoUrl;
  let transcript = await Transcript.findOne({ mediaKey });
  const cached = Boolean(transcript);
  if (!transcript) {
    const { blob, filename } = await loadMedia(lesson.videoUrl);
    const result = await transcribe(blob, filename, userKey);
    if (!result.segments.length) throw new ApiError(422, 'No speech was detected in this video.');
    transcript = await Transcript.create({
      mediaKey,
      language: result.language,
      durationSec: result.duration,
      segments: result.segments,
      aiModel: process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo'
    });
  }

  const chunks = buildChunks(transcript.segments);

  // Short topic titles make citations readable ("Lens compression, 8:11") and power topic-level reports.
  let titles: string[] = [];
  try {
    const result = await chatJSON<{ titles: string[] }>({
      agent: 'course-builder',
      userKey,
      tier: 'fast',
      maxTokens: 1500,
      schemaName: 'chunk_titles',
      schema: {
        type: 'object',
        properties: { titles: { type: 'array', items: { type: 'string' } } },
        required: ['titles'],
        additionalProperties: false
      },
      messages: [
        {
          role: 'system',
          content: `You label passages of a lesson transcript with short topic titles (3-7 words each, Title Case, no numbering). Return exactly one title per passage, in order. ${UNTRUSTED_DATA_RULE}`
        },
        {
          role: 'user',
          content: `Lesson: ${lesson.title}\nNumber of passages: ${chunks.length}\n\n` +
            fence('transcript', chunks.map((c, i) => `Passage ${i + 1}: ${c.text.slice(0, 500)}`).join('\n\n'))
        }
      ]
    });
    titles = result.titles || [];
  } catch {
    titles = [];
  }

  await TranscriptChunk.deleteMany({ courseSlug: course.slug, lessonId: lesson.id });
  await TranscriptChunk.insertMany(
    chunks.map((c, i) => ({
      courseSlug: course.slug,
      lessonId: lesson.id,
      order: i,
      startSec: c.startSec,
      endSec: c.endSec,
      topic: (titles[i] || lesson.title).slice(0, 80),
      text: c.text
    }))
  );
  invalidateCourseIndex(course.slug);

  return { chunks: chunks.length, cached, durationSec: Math.round(transcript.durationSec) };
}

interface GeneratedContent {
  summary: string;
  keyPoints: string[];
  checkpoints: Array<{
    atSec: number;
    rewatchFromSec: number;
    topic: string;
    questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
  }>;
  flashcards: Array<{ front: string; back: string; timestampSec: number }>;
  examQuestions: Array<{
    type: 'MCQ' | 'SHORT';
    topic: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    rubric: string;
    modelAnswer: string;
    timestampSec: number;
  }>;
}

const MCQ_ITEM = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    options: { type: 'array', items: { type: 'string' } },
    correctIndex: { type: 'integer' },
    explanation: { type: 'string' }
  },
  required: ['question', 'options', 'correctIndex', 'explanation'],
  additionalProperties: false
};

const CONTENT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    keyPoints: { type: 'array', items: { type: 'string' } },
    checkpoints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          atSec: { type: 'integer' },
          rewatchFromSec: { type: 'integer' },
          topic: { type: 'string' },
          questions: { type: 'array', items: MCQ_ITEM }
        },
        required: ['atSec', 'rewatchFromSec', 'topic', 'questions'],
        additionalProperties: false
      }
    },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: { front: { type: 'string' }, back: { type: 'string' }, timestampSec: { type: 'integer' } },
        required: ['front', 'back', 'timestampSec'],
        additionalProperties: false
      }
    },
    examQuestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['MCQ', 'SHORT'] },
          topic: { type: 'string' },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          explanation: { type: 'string' },
          rubric: { type: 'string' },
          modelAnswer: { type: 'string' },
          timestampSec: { type: 'integer' }
        },
        required: ['type', 'topic', 'question', 'options', 'correctIndex', 'explanation', 'rubric', 'modelAnswer', 'timestampSec'],
        additionalProperties: false
      }
    }
  },
  required: ['summary', 'keyPoints', 'checkpoints', 'flashcards', 'examQuestions'],
  additionalProperties: false
};

const validMcq = (q: { options: string[]; correctIndex: number; question: string }) =>
  q.question?.trim() && Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => o?.trim()) &&
  Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4;

/**
 * Step 2: draft the lesson's study material from its transcript. Everything is saved as a
 * DRAFT for the instructor to review; regenerating replaces this lesson's previous content.
 */
export async function generateLessonContent(course: Course, lesson: Lesson, userKey: string) {
  const chunks = await lessonChunks(course.slug, lesson.id);
  if (!chunks.length) throw new ApiError(409, 'Transcribe this lesson first.');

  const durationSec = Math.max(...chunks.map(c => c.endSec));
  const transcriptText = chunks
    .map(c => `[${c.startSec}s-${c.endSec}s | ${c.topic}] ${c.text}`)
    .join('\n')
    .slice(0, 45_000);

  const content = await chatJSON<GeneratedContent>({
    agent: 'course-builder',
    userKey,
    tier: 'reasoning',
    reasoningEffort: 'medium',
    maxTokens: 8000,
    temperature: 0.3,
    schemaName: 'lesson_content',
    schema: CONTENT_SCHEMA,
    messages: [
      {
        role: 'system',
        content: [
          'You are an expert instructional designer for creative-skills video courses (filmmaking, photography, editing, 3D, music, design).',
          'From the lesson transcript, create study material. Every fact must come from the transcript; do not invent content.',
          'Rules:',
          '- summary: 3-5 sentences in plain language. keyPoints: 4-7 short bullet points.',
          `- checkpoints: 2-4 in-video pause points spread through the lesson, each placed at the END of a concept (atSec between 45 and ${Math.max(60, durationSec - 15)}). Never place two within 90 seconds. rewatchFromSec is where that concept starts. Each has 1-2 questions that test understanding or application, not trivia.`,
          '- Multiple-choice questions always have exactly 4 options, one correct (correctIndex 0-3), plausible distractors, and an explanation that teaches why.',
          '- flashcards: 8-12 cards; front is a question or prompt, back is a concise answer. timestampSec points to where it is taught.',
          '- examQuestions: 6-8 MCQ plus 2 SHORT written-answer questions. For SHORT: options [] and correctIndex -1, a rubric listing the 2-3 points a full answer must make (worth 3 points total), and a model answer. For MCQ: rubric and modelAnswer are empty strings.',
          '- topic: a specific skill name (2-5 words, for example "Rule of Thirds", "Lens Compression", "Depth of Field"). Use 3-6 distinct topics per lesson, reusing the exact same wording for items on the same skill so results can be grouped. Never use one broad topic for everything.',
          UNTRUSTED_DATA_RULE
        ].join('\n')
      },
      {
        role: 'user',
        content: `Course: ${course.title}\nLesson: ${lesson.title}\nLesson length: ${durationSec} seconds\n\n${fence('transcript', transcriptText)}`
      }
    ]
  });

  // Validate and clean the model output before saving anything.
  const checkpoints = (content.checkpoints || [])
    .map(cp => ({
      ...cp,
      atSec: Math.min(Math.max(30, Math.round(cp.atSec)), Math.max(31, durationSec - 5)),
      questions: (cp.questions || []).filter(validMcq).slice(0, 2)
    }))
    .filter(cp => cp.questions.length > 0)
    .sort((a, b) => a.atSec - b.atSec)
    .filter((cp, i, arr) => i === 0 || cp.atSec - arr[i - 1].atSec >= 60)
    .slice(0, 4);

  const examQuestions = (content.examQuestions || []).filter(q =>
    q.type === 'MCQ' ? validMcq(q) : Boolean(q.question?.trim() && q.rubric?.trim())
  );

  const flashcards = (content.flashcards || []).filter(f => f.front?.trim() && f.back?.trim()).slice(0, 15);

  await Promise.all([
    Checkpoint.deleteMany({ courseSlug: course.slug, lessonId: lesson.id }),
    BankQuestion.deleteMany({ courseSlug: course.slug, lessonId: lesson.id })
  ]);

  await Checkpoint.insertMany(
    checkpoints.map(cp => ({
      courseSlug: course.slug,
      lessonId: lesson.id,
      atSec: cp.atSec,
      rewatchFromSec: Math.min(Math.max(0, Math.round(cp.rewatchFromSec)), cp.atSec),
      topic: cp.topic.slice(0, 80),
      questions: cp.questions.map(q => ({ ...shuffleOptions(q), qid: randomUUID() })),
      status: 'DRAFT'
    }))
  );

  await BankQuestion.insertMany(
    examQuestions.map(q => (q.type === 'MCQ' ? shuffleOptions(q) : q)).map(q => ({
      courseSlug: course.slug,
      lessonId: lesson.id,
      topic: q.topic.slice(0, 80),
      type: q.type,
      question: q.question,
      options: q.type === 'MCQ' ? q.options : [],
      correctIndex: q.type === 'MCQ' ? q.correctIndex : -1,
      explanation: q.explanation,
      rubric: q.type === 'SHORT' ? q.rubric : '',
      modelAnswer: q.type === 'SHORT' ? q.modelAnswer : '',
      maxPoints: q.type === 'SHORT' ? 3 : 1,
      timestampSec: Math.max(0, Math.round(q.timestampSec || 0)),
      status: 'DRAFT'
    }))
  );

  await StudyKit.findOneAndUpdate(
    { courseSlug: course.slug, lessonId: lesson.id },
    {
      $set: {
        summary: content.summary,
        keyPoints: (content.keyPoints || []).slice(0, 8),
        cards: flashcards.map(f => ({ cardId: randomUUID(), front: f.front, back: f.back, timestampSec: Math.max(0, Math.round(f.timestampSec || 0)) })),
        status: 'DRAFT'
      }
    },
    { upsert: true }
  );

  return {
    checkpoints: checkpoints.length,
    examQuestions: examQuestions.length,
    flashcards: flashcards.length
  };
}

/** Per-lesson processing status for the instructor dashboard. */
export async function courseStatus(course: Course) {
  const slug = course.slug;
  const [chunks, checkpoints, bank, kits] = await Promise.all([
    TranscriptChunk.aggregate([{ $match: { courseSlug: slug } }, { $group: { _id: '$lessonId', count: { $sum: 1 } } }]),
    Checkpoint.aggregate([{ $match: { courseSlug: slug } }, { $group: { _id: { lessonId: '$lessonId', status: '$status' }, count: { $sum: 1 } } }]),
    BankQuestion.aggregate([{ $match: { courseSlug: slug } }, { $group: { _id: { lessonId: '$lessonId', status: '$status', type: '$type' }, count: { $sum: 1 } } }]),
    StudyKit.find({ courseSlug: slug }).select('lessonId status cards').lean()
  ]);

  return allLessons(course).map(lesson => {
    const count = (rows: Array<{ _id: Record<string, string>; count: number }>, match: Record<string, string>) =>
      rows.filter(r => Object.entries(match).every(([k, v]) => r._id[k] === v)).reduce((s, r) => s + r.count, 0);
    const kit = kits.find(k => k.lessonId === lesson.id);
    return {
      lessonId: lesson.id,
      title: lesson.title,
      contentType: lesson.contentType,
      hasVideo: lesson.contentType === 'VIDEO' && Boolean(lesson.videoUrl),
      transcriptChunks: chunks.find(c => c._id === lesson.id)?.count || 0,
      checkpoints: { draft: count(checkpoints, { lessonId: lesson.id, status: 'DRAFT' }), approved: count(checkpoints, { lessonId: lesson.id, status: 'APPROVED' }) },
      examQuestions: {
        draft: count(bank, { lessonId: lesson.id, status: 'DRAFT' }),
        approved: count(bank, { lessonId: lesson.id, status: 'APPROVED' }),
        short: count(bank, { lessonId: lesson.id, type: 'SHORT' })
      },
      studyKit: kit ? { status: kit.status, cards: kit.cards?.length || 0 } : null
    };
  });
}

/** Full generated content of a lesson (with answers) for instructor review. */
export async function lessonReview(courseSlug: string, lessonId: string) {
  const [checkpoints, bank, kit] = await Promise.all([
    Checkpoint.find({ courseSlug, lessonId }).sort({ atSec: 1 }).lean(),
    BankQuestion.find({ courseSlug, lessonId }).sort({ type: 1, createdAt: 1 }).lean(),
    StudyKit.findOne({ courseSlug, lessonId }).lean()
  ]);
  return {
    checkpoints: checkpoints.map(c => ({ ...c, _id: String(c._id) })),
    examQuestions: bank.map(q => ({ ...q, _id: String(q._id) })),
    studyKit: kit ? { ...kit, _id: String(kit._id) } : null
  };
}

export async function approveLesson(courseSlug: string, lessonId: string) {
  const filter = { courseSlug, lessonId, status: 'DRAFT' };
  const [cp, bq, kit] = await Promise.all([
    Checkpoint.updateMany(filter, { $set: { status: 'APPROVED' } }),
    BankQuestion.updateMany(filter, { $set: { status: 'APPROVED' } }),
    StudyKit.updateMany(filter, { $set: { status: 'APPROVED' } })
  ]);
  return { checkpoints: cp.modifiedCount, examQuestions: bq.modifiedCount, studyKit: kit.modifiedCount };
}

export async function deleteGeneratedItem(courseSlug: string, kind: 'checkpoint' | 'question', id: string) {
  if (!Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid id.');
  const model = kind === 'checkpoint' ? Checkpoint : BankQuestion;
  const result = await model.deleteOne({ _id: id, courseSlug });
  return { deleted: result.deletedCount };
}
