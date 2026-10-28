import LessonProgress, { ILessonProgressDocument } from '@/models/LessonProgress';
import Attempt, { IAttemptDocument } from '@/models/Attempt';
import ExamSession from '@/models/ExamSession';
import AgentThread from '@/models/AgentThread';
import Report from '@/models/Report';
import { chatJSON, modelFor } from '@/lib/ai/groq';
import { ApiError, fence, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { allLessons, formatTimestamp } from '@/lib/courses';
import { Course } from '@/lib/types';

export interface ReportInsights {
  headline: string;
  masteryLevel: 'Getting started' | 'Developing' | 'Proficient' | 'Advanced';
  summary: string;
  strengths: Array<{ topic: string; evidence: string }>;
  weaknesses: Array<{ topic: string; evidence: string; likelyCause: string }>;
  studyPlan: Array<{ title: string; detail: string; lessonId: string; timestampSec: number; minutes: number }>;
  practiceQuestions: Array<{ question: string; hint: string }>;
  nextSteps: string[];
}

export interface ReportStats {
  lessonsTotal: number;
  lessonsCompleted: number;
  completionPercent: number;
  watchMinutes: number;
  rewatchCount: number;
  questionsAnswered: number;
  accuracyPercent: number | null;
  examBestPercent: number | null;
  examPassed: boolean;
  topics: Array<{ topic: string; correct: number; total: number; accuracyPercent: number }>;
  tutorQuestions: number;
}

const INSIGHTS_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    masteryLevel: { type: 'string', enum: ['Getting started', 'Developing', 'Proficient', 'Advanced'] },
    summary: { type: 'string' },
    strengths: {
      type: 'array',
      items: { type: 'object', properties: { topic: { type: 'string' }, evidence: { type: 'string' } }, required: ['topic', 'evidence'], additionalProperties: false }
    },
    weaknesses: {
      type: 'array',
      items: {
        type: 'object',
        properties: { topic: { type: 'string' }, evidence: { type: 'string' }, likelyCause: { type: 'string' } },
        required: ['topic', 'evidence', 'likelyCause'],
        additionalProperties: false
      }
    },
    studyPlan: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          lessonId: { type: 'string' },
          timestampSec: { type: 'integer' },
          minutes: { type: 'integer' }
        },
        required: ['title', 'detail', 'lessonId', 'timestampSec', 'minutes'],
        additionalProperties: false
      }
    },
    practiceQuestions: {
      type: 'array',
      items: { type: 'object', properties: { question: { type: 'string' }, hint: { type: 'string' } }, required: ['question', 'hint'], additionalProperties: false }
    },
    nextSteps: { type: 'array', items: { type: 'string' } }
  },
  required: ['headline', 'masteryLevel', 'summary', 'strengths', 'weaknesses', 'studyPlan', 'practiceQuestions', 'nextSteps'],
  additionalProperties: false
};

async function gather(userId: string, course: Course) {
  const lessons = allLessons(course);
  const [progress, attempts, exams, thread] = await Promise.all([
    LessonProgress.find({ userId, courseSlug: course.slug }).lean<ILessonProgressDocument[]>(),
    Attempt.find({ userId, courseSlug: course.slug }).sort({ createdAt: -1 }).limit(400).lean<IAttemptDocument[]>(),
    ExamSession.find({ userId, courseSlug: course.slug, status: 'SUBMITTED' }).select('percent passed').lean<Array<{ percent: number; passed: boolean }>>(),
    AgentThread.findOne({ userId, agent: 'tutor', scope: course.slug }).lean<{ messages: Array<{ role: string; content: string }> }>()
  ]);

  const topicMap = new Map<string, { correct: number; total: number }>();
  attempts.forEach(a => {
    const key = a.topic || 'General';
    const entry = topicMap.get(key) || { correct: 0, total: 0 };
    entry.total += 1;
    if (a.correct) entry.correct += 1;
    topicMap.set(key, entry);
  });

  const tutorQuestions = (thread?.messages || []).filter(m => m.role === 'user').map(m => m.content);
  const completed = progress.filter(p => p.completed && lessons.some(l => l.id === p.lessonId)).length;
  const correctTotal = attempts.filter(a => a.correct).length;

  const stats: ReportStats = {
    lessonsTotal: lessons.length,
    lessonsCompleted: completed,
    completionPercent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    watchMinutes: Math.round(progress.reduce((s, p) => s + (p.watchedSec || 0), 0) / 60),
    rewatchCount: progress.reduce((s, p) => s + (p.rewatches?.length || 0), 0),
    questionsAnswered: attempts.length,
    accuracyPercent: attempts.length ? Math.round((correctTotal / attempts.length) * 100) : null,
    examBestPercent: exams.length ? Math.max(...exams.map(e => e.percent)) : null,
    examPassed: exams.some(e => e.passed),
    topics: Array.from(topicMap.entries())
      .map(([topic, v]) => ({ topic, correct: v.correct, total: v.total, accuracyPercent: Math.round((v.correct / v.total) * 100) }))
      .sort((a, b) => a.accuracyPercent - b.accuracyPercent),
    tutorQuestions: tutorQuestions.length
  };

  return { lessons, progress, attempts, stats, tutorQuestions };
}

/** Builds a fresh performance report for one learner in one course and saves it. */
export async function generateReport(userId: string, course: Course, trigger: 'ON_DEMAND' | 'AFTER_EXAM' | 'AFTER_QUIZ' | 'WEEKLY' = 'ON_DEMAND') {
  const { lessons, progress, attempts, stats, tutorQuestions } = await gather(userId, course);

  if (!progress.length && !attempts.length) {
    throw new ApiError(409, 'Not enough activity yet. Watch a lesson or answer a checkpoint question first.');
  }

  const lessonLines = lessons.map(l => {
    const p = progress.find(x => x.lessonId === l.id);
    if (!p) return `- ${l.id} "${l.title}": not started`;
    const rewatched = (p.rewatches || []).slice(-5).map(r => `${formatTimestamp(r.fromSec)}-${formatTimestamp(r.toSec)}`).join(', ');
    const skipped = (p.skips || []).slice(-5).map(s => `${formatTimestamp(s.fromSec)}->${formatTimestamp(s.toSec)}`).join(', ');
    return `- ${l.id} "${l.title}": ${p.completed ? 'completed' : `in progress (stopped at ${formatTimestamp(p.positionSec)})`}, watched ${Math.round((p.watchedSec || 0) / 60)} min` +
      (rewatched ? `, rewatched ${rewatched}` : '') + (skipped ? `, skipped ${skipped}` : '');
  });

  const missed = attempts
    .filter(a => !a.correct)
    .slice(0, 25)
    .map(a => `- [${a.kind}] topic "${a.topic}" (lesson ${a.lessonId}${a.timestampSec ? ` @ ${formatTimestamp(a.timestampSec)}` : ''}): ${a.question.slice(0, 200)}`);

  const learnerData = [
    `Lessons:\n${lessonLines.join('\n')}`,
    `Topic accuracy (weakest first):\n${stats.topics.map(t => `- ${t.topic}: ${t.correct}/${t.total} (${t.accuracyPercent}%)`).join('\n') || '- no questions answered yet'}`,
    `Missed questions:\n${missed.join('\n') || '- none'}`,
    `Exam: ${stats.examBestPercent === null ? 'not taken' : `best ${stats.examBestPercent}%${stats.examPassed ? ' (passed)' : ' (not passed)'}`}`,
    `Questions the student asked the AI tutor (recent):\n${tutorQuestions.slice(-15).map(q => `- ${q.slice(0, 200)}`).join('\n') || '- none'}`
  ].join('\n\n');

  const insights = await chatJSON<ReportInsights>({
    agent: 'report',
    userKey: userId,
    tier: 'reasoning',
    reasoningEffort: 'medium',
    maxTokens: 3500,
    temperature: 0.3,
    schemaName: 'performance_report',
    schema: INSIGHTS_SCHEMA,
    messages: [
      {
        role: 'system',
        content: [
          `You are a learning coach writing a performance report for a student of "${course.title}". Write to the student ("you"), warm but honest.`,
          'Use only the data provided. Do not invent scores, lessons or behaviour. If there is little data, say so and keep the report short.',
          '- strengths and weaknesses: 1-4 each, grounded in the topic accuracy, missed questions, rewatches and tutor questions. likelyCause explains why the gap probably exists (for example "skipped 4:10-6:30 of that lesson").',
          '- studyPlan: 2-5 concrete actions. lessonId must be one of the lesson ids listed (or "" if not lesson-specific); timestampSec is where to rewatch (-1 if none); minutes is a realistic estimate.',
          '- practiceQuestions: 2-4 questions on the weakest topics, each with a hint, not the answer.',
          '- nextSteps: 1-3 short sentences.',
          UNTRUSTED_DATA_RULE
        ].join('\n')
      },
      { role: 'user', content: fence('learner_data', learnerData) }
    ]
  });

  const lessonIds = new Set(lessons.map(l => l.id));
  insights.studyPlan = (insights.studyPlan || []).map(step => ({
    ...step,
    lessonId: lessonIds.has(step.lessonId) ? step.lessonId : '',
    timestampSec: Number.isFinite(step.timestampSec) ? step.timestampSec : -1,
    minutes: Math.max(1, Math.min(120, step.minutes || 10))
  }));

  const doc = await Report.create({
    userId,
    courseSlug: course.slug,
    trigger,
    stats,
    insights,
    aiModel: modelFor('reasoning')
  });

  return { id: String(doc._id), createdAt: doc.createdAt, trigger, stats, insights };
}

export async function latestReport(userId: string, courseSlug: string) {
  const doc = await Report.findOne({ userId, courseSlug }).sort({ createdAt: -1 }).lean<{ _id: unknown; createdAt: Date; trigger: string; stats: ReportStats; insights: ReportInsights }>();
  if (!doc) return null;
  return { id: String(doc._id), createdAt: doc.createdAt, trigger: doc.trigger, stats: doc.stats, insights: doc.insights };
}
