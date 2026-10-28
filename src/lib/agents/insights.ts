import LessonProgress, { ILessonProgressDocument } from '@/models/LessonProgress';
import Attempt, { IAttemptDocument } from '@/models/Attempt';
import ExamSession from '@/models/ExamSession';
import AgentThread from '@/models/AgentThread';
import { chatJSON } from '@/lib/ai/groq';
import { fence, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { allLessons, formatTimestamp } from '@/lib/courses';
import { Course } from '@/lib/types';

/** Aggregate (anonymous) course analytics for instructors and admins. */
export async function courseAnalytics(course: Course) {
  const lessons = allLessons(course);
  const [progress, attempts, exams, threads] = await Promise.all([
    LessonProgress.find({ courseSlug: course.slug }).lean<ILessonProgressDocument[]>(),
    Attempt.find({ courseSlug: course.slug }).lean<IAttemptDocument[]>(),
    ExamSession.find({ courseSlug: course.slug, status: 'SUBMITTED' }).select('percent passed userId').lean<Array<{ percent: number; passed: boolean; userId: string }>>(),
    AgentThread.find({ agent: 'tutor', scope: course.slug }).select('messages').lean<Array<{ messages: Array<{ role: string; meta?: { topics?: string[] } }> }>>()
  ]);

  const learners = new Set(progress.map(p => p.userId)).size;

  const lessonStats = lessons.map(lesson => {
    const rows = progress.filter(p => p.lessonId === lesson.id);
    const incomplete = rows.filter(r => !r.completed && r.positionSec > 0).map(r => r.positionSec).sort((a, b) => a - b);
    const rewatchBuckets = new Map<number, number>();
    rows.forEach(r => (r.rewatches || []).forEach(rw => {
      const bucket = Math.floor(rw.fromSec / 30) * 30;
      rewatchBuckets.set(bucket, (rewatchBuckets.get(bucket) || 0) + 1);
    }));
    const hotspot = Array.from(rewatchBuckets.entries()).sort((a, b) => b[1] - a[1])[0];
    const lessonAttempts = attempts.filter(a => a.lessonId === lesson.id && (a.kind === 'CHECKPOINT' || a.kind === 'LESSON_QUIZ'));
    return {
      lessonId: lesson.id,
      title: lesson.title,
      started: rows.length,
      completed: rows.filter(r => r.completed).length,
      completionRate: rows.length ? Math.round((rows.filter(r => r.completed).length / rows.length) * 100) : null,
      medianDropOffSec: incomplete.length ? incomplete[Math.floor(incomplete.length / 2)] : null,
      rewatchHotspotSec: hotspot ? hotspot[0] : null,
      rewatchHotspotCount: hotspot ? hotspot[1] : 0,
      quizAccuracy: lessonAttempts.length ? Math.round((lessonAttempts.filter(a => a.correct).length / lessonAttempts.length) * 100) : null,
      quizAnswers: lessonAttempts.length
    };
  });

  const byQuestion = new Map<string, { question: string; lessonId: string; topic: string; correct: number; total: number }>();
  attempts.filter(a => a.kind === 'CHECKPOINT' || a.kind === 'EXAM').forEach(a => {
    const key = a.kind === 'EXAM' ? a.refId.split(':')[1] || a.question : a.refId;
    const entry = byQuestion.get(key) || { question: a.question, lessonId: a.lessonId, topic: a.topic, correct: 0, total: 0 };
    entry.total += 1;
    if (a.correct) entry.correct += 1;
    byQuestion.set(key, entry);
  });
  const hardestQuestions = Array.from(byQuestion.values())
    .filter(q => q.total >= 3)
    .map(q => ({ ...q, accuracyPercent: Math.round((q.correct / q.total) * 100) }))
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
    .slice(0, 5);

  const topicCounts = new Map<string, number>();
  threads.forEach(t => t.messages.filter(m => m.role === 'user').forEach(m => (m.meta?.topics || []).slice(0, 1).forEach(topic => topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1))));
  const tutorTopics = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([topic, count]) => ({ topic, count }));

  return {
    learners,
    exam: {
      attempts: exams.length,
      passRate: exams.length ? Math.round((exams.filter(e => e.passed).length / exams.length) * 100) : null,
      averagePercent: exams.length ? Math.round(exams.reduce((s, e) => s + e.percent, 0) / exams.length) : null
    },
    lessons: lessonStats,
    hardestQuestions,
    tutorTopics
  };
}

/** Asks the reasoning model to interpret the analytics and suggest what to improve. */
export async function summarizeInsights(userKey: string, course: Course, analytics: Awaited<ReturnType<typeof courseAnalytics>>) {
  const lines = [
    `Learners with activity: ${analytics.learners}`,
    `Exam: ${analytics.exam.attempts} attempts, pass rate ${analytics.exam.passRate ?? 'n/a'}%, average ${analytics.exam.averagePercent ?? 'n/a'}%`,
    'Lessons:',
    ...analytics.lessons.map(l =>
      `- ${l.lessonId} "${l.title}": started ${l.started}, completion ${l.completionRate ?? 'n/a'}%, median drop-off ${l.medianDropOffSec !== null ? formatTimestamp(l.medianDropOffSec) : 'n/a'}, rewatch hotspot ${l.rewatchHotspotSec !== null ? `${formatTimestamp(l.rewatchHotspotSec)} (${l.rewatchHotspotCount}x)` : 'none'}, quiz accuracy ${l.quizAccuracy ?? 'n/a'}%`
    ),
    'Hardest questions:',
    ...analytics.hardestQuestions.map(q => `- [${q.topic}] ${q.accuracyPercent}% of ${q.total}: ${q.question.slice(0, 160)}`),
    'Most-asked tutor topics:',
    ...analytics.tutorTopics.map(t => `- ${t.topic}: ${t.count} questions`)
  ].join('\n');

  return chatJSON<{ headline: string; findings: Array<{ severity: 'high' | 'medium' | 'low'; title: string; detail: string; lessonId: string }>; recommendations: string[] }>({
    agent: 'insights',
    userKey,
    tier: 'reasoning',
    reasoningEffort: 'medium',
    maxTokens: 2500,
    temperature: 0.2,
    schemaName: 'course_insights',
    schema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              title: { type: 'string' },
              detail: { type: 'string' },
              lessonId: { type: 'string' }
            },
            required: ['severity', 'title', 'detail', 'lessonId'],
            additionalProperties: false
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      },
      required: ['headline', 'findings', 'recommendations'],
      additionalProperties: false
    },
    messages: [
      {
        role: 'system',
        content: [
          `You analyse learning data for the course "${course.title}" and tell the instructor where students struggle and what to improve.`,
          'Use only the numbers given. With small samples (under 10 learners), say the signal is early. Do not invent data.',
          'findings: 2-6, most important first; lessonId is one of the listed ids or "". recommendations: 2-5 concrete content changes (re-record a section, add an example, rewrite a confusing question).',
          UNTRUSTED_DATA_RULE
        ].join('\n')
      },
      { role: 'user', content: fence('course_data', lines) }
    ]
  });
}
