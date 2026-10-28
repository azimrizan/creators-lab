import { Types } from 'mongoose';
import StudyPlan, { IStudyPlanDocument } from '@/models/StudyPlan';
import LearnerProfile, { ILearnerProfileDocument } from '@/models/LearnerProfile';
import LessonProgress, { ILessonProgressDocument } from '@/models/LessonProgress';
import Attempt from '@/models/Attempt';
import UserModel from '@/models/User';
import { chatJSON } from '@/lib/ai/groq';
import { fence, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { allLessons, listPublishedCourses, matchesCourse } from '@/lib/courses';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Monday of the current week as YYYY-MM-DD (UTC). */
export function currentWeekStart(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

/** Consecutive days (ending today or yesterday) with any learning activity. */
async function activityStreak(userId: string) {
  const since = new Date(Date.now() - 60 * 86400_000);
  const [progress, attempts] = await Promise.all([
    LessonProgress.find({ userId, updatedAt: { $gte: since } }).select('updatedAt').lean<Array<{ updatedAt: Date }>>(),
    Attempt.find({ userId, createdAt: { $gte: since } }).select('createdAt').lean<Array<{ createdAt: Date }>>()
  ]);
  const days = new Set([...progress.map(p => p.updatedAt), ...attempts.map(a => a.createdAt)].map(d => new Date(d).toISOString().slice(0, 10)));

  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const weekStart = currentWeekStart();
  const activeDaysThisWeek = Array.from(days).filter(d => d >= weekStart).length;
  return { streakDays: streak, activeDaysThisWeek };
}

/** Courses the learner is taking, with lessons still to do. */
async function remainingWork(userId: string) {
  const courses = await listPublishedCourses();
  const progress = await LessonProgress.find({ userId }).lean<ILessonProgressDocument[]>();
  const dbUser = Types.ObjectId.isValid(userId) ? await UserModel.findById(userId).select('enrolledCourseIds').lean<{ enrolledCourseIds: string[] }>() : null;

  const active = courses.filter(c =>
    progress.some(p => p.courseSlug === c.slug) || (dbUser?.enrolledCourseIds || []).some(id => matchesCourse(c, id))
  );

  return active
    .map(course => {
      const remaining = allLessons(course).filter(l => !progress.some(p => p.courseSlug === course.slug && p.lessonId === l.id && p.completed));
      return { course, remaining };
    })
    .filter(x => x.remaining.length > 0);
}

export async function getPlan(userId: string) {
  const [plan, streak] = await Promise.all([
    StudyPlan.findOne({ userId, weekStart: currentWeekStart() }).lean<IStudyPlanDocument>(),
    activityStreak(userId)
  ]);
  return { plan: plan ? serialize(plan) : null, ...streak };
}

function serialize(plan: IStudyPlanDocument) {
  return { weekStart: plan.weekStart, summary: plan.summary, nudge: plan.nudge, sessions: plan.sessions };
}

/** Builds this week's study schedule from the learner's available time and remaining lessons. */
export async function generatePlan(userId: string) {
  const [profile, work, streak] = await Promise.all([
    LearnerProfile.findOne({ userId }).lean<ILearnerProfileDocument>(),
    remainingWork(userId),
    activityStreak(userId)
  ]);

  if (!work.length) {
    return { plan: null, ...streak, message: 'You have no lessons left to schedule. Enroll in a course to get a study plan.' };
  }

  const weeklyMinutes = Math.round((profile?.weeklyHours || 3) * 60);
  const workText = work
    .slice(0, 4)
    .map(({ course, remaining }) =>
      `Course ${course.slug} "${course.title}":\n` +
      remaining.slice(0, 12).map(l => `  - ${l.id} "${l.title}" (${Math.max(1, Math.round(l.durationSeconds / 60))} min, ${l.contentType})`).join('\n')
    )
    .join('\n');

  const result = await chatJSON<{ summary: string; nudge: string; sessions: Array<{ day: string; courseSlug: string; lessonIds: string[]; minutes: number; focus: string }> }>({
    agent: 'study-coach',
    userKey: userId,
    tier: 'fast',
    maxTokens: 1800,
    temperature: 0.4,
    schemaName: 'study_plan',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        nudge: { type: 'string' },
        sessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string', enum: DAYS },
              courseSlug: { type: 'string' },
              lessonIds: { type: 'array', items: { type: 'string' } },
              minutes: { type: 'integer' },
              focus: { type: 'string' }
            },
            required: ['day', 'courseSlug', 'lessonIds', 'minutes', 'focus'],
            additionalProperties: false
          }
        }
      },
      required: ['summary', 'nudge', 'sessions'],
      additionalProperties: false
    },
    messages: [
      {
        role: 'system',
        content: [
          'You are a study coach. Build a realistic weekly schedule (Mon-Sun) for a learner of creative skills.',
          `Total time must be close to ${weeklyMinutes} minutes and never more than ${Math.round(weeklyMinutes * 1.15)}. Use 2-5 sessions; leave rest days.`,
          'Each session lists lesson ids (in course order) that fit its minutes, allowing about 1.5x the video length for notes and checkpoints. Only use lesson ids given.',
          'focus: one short sentence on what to concentrate on. summary: one sentence about the week. nudge: one short encouraging sentence (no emoji).',
          UNTRUSTED_DATA_RULE
        ].join('\n')
      },
      {
        role: 'user',
        content: fence('learner_data', `Goal: ${profile?.goal || 'not stated'}\nPreferred style: ${profile?.learningStyle || 'not stated'}\nCurrent streak: ${streak.streakDays} days\n\nRemaining lessons:\n${workText}`)
      }
    ]
  });

  const sessions = (result.sessions || [])
    .map(s => {
      const entry = work.find(w => w.course.slug === s.courseSlug);
      if (!entry) return null;
      const lessons = s.lessonIds.map(id => entry.remaining.find(l => l.id === id)).filter(Boolean) as typeof entry.remaining;
      if (!lessons.length) return null;
      return {
        day: DAYS.includes(s.day) ? s.day : 'Mon',
        courseSlug: entry.course.slug,
        courseTitle: entry.course.title,
        lessonIds: lessons.map(l => l.id),
        lessonTitles: lessons.map(l => l.title),
        minutes: Math.max(5, Math.min(240, s.minutes)),
        focus: s.focus.slice(0, 200)
      };
    })
    .filter(Boolean)
    .sort((a, b) => DAYS.indexOf(a!.day) - DAYS.indexOf(b!.day));

  const plan = await StudyPlan.findOneAndUpdate(
    { userId, weekStart: currentWeekStart() },
    { $set: { summary: result.summary, nudge: result.nudge, sessions } },
    { upsert: true, returnDocument: 'after' }
  ).lean<IStudyPlanDocument>();

  return { plan: plan ? serialize(plan) : null, ...streak };
}
