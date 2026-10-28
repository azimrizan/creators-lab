import LearnerProfile, { ILearnerProfileDocument } from '@/models/LearnerProfile';
import LessonProgress, { ILessonProgressDocument } from '@/models/LessonProgress';
import AgentThread from '@/models/AgentThread';
import Certificate from '@/models/Certificate';
import CardReview from '@/models/CardReview';
import StudyPlan from '@/models/StudyPlan';
import BankQuestion from '@/models/BankQuestion';
import UserModel from '@/models/User';
import { Types } from 'mongoose';
import { ChatMessage, runAgent, ToolDefinition } from '@/lib/ai/groq';
import { fence, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { allLessons, formatTimestamp, listPublishedCourses } from '@/lib/courses';
import { SessionUser } from '@/lib/auth';
import { Course } from '@/lib/types';

export type ConciergeAction =
  | { type: 'courses'; items: Array<{ id: string; slug: string; title: string; thumbnail: string; price: number; discountPrice?: number; rating: number; level: string; reason: string }> }
  | { type: 'link'; href: string; label: string }
  | { type: 'cart'; courseId: string; slug: string; title: string }
  | { type: 'profile_saved' };

const ALLOWED_PATHS = [/^\/$/, /^\/courses(\?.*)?$/, /^\/course\/[\w-]+$/, /^\/watch\/[\w-]+\/[\w-]+(\?t=\d+)?$/, /^\/exam\/[\w-]+$/, /^\/my-learning(\/.*)?$/, /^\/certificates$/, /^\/wishlist$/];

function summarizeCourse(c: Course) {
  return `${c.slug} | ${c.title} | ${c.categoryName} | ${c.level} | ₹${c.discountPrice || c.price} | rating ${c.rating} | ${c.subtitle?.slice(0, 120) || ''}`;
}

async function resolveUserName(userId: string) {
  if (!Types.ObjectId.isValid(userId)) return '';
  const u = await UserModel.findById(userId).select('name').lean<{ name: string }>();
  return u?.name?.split(' ')[0] || '';
}

/** Learning status used for the welcome-back message and the get_my_learning tool. */
async function learningSnapshot(userId: string, courses: Course[]) {
  const progress = await LessonProgress.find({ userId }).sort({ updatedAt: -1 }).limit(200).lean<ILessonProgressDocument[]>();
  const slugs = Array.from(new Set(progress.map(p => p.courseSlug)));
  const certs = await Certificate.find({ userId }).select('courseSlug').lean<Array<{ courseSlug: string }>>();

  return slugs.map(slug => {
    const course = courses.find(c => c.slug === slug);
    if (!course) return null;
    const lessons = allLessons(course);
    const done = progress.filter(p => p.courseSlug === slug && p.completed).length;
    const resume = progress.find(p => p.courseSlug === slug && !p.completed);
    const nextLesson = resume ? lessons.find(l => l.id === resume.lessonId) : lessons.find(l => !progress.some(p => p.courseSlug === slug && p.lessonId === l.id && p.completed));
    return {
      slug,
      title: course.title,
      lessonsDone: done,
      lessonsTotal: lessons.length,
      certified: certs.some(c => c.courseSlug === slug),
      resume: nextLesson ? { lessonId: nextLesson.id, title: nextLesson.title, positionSec: resume?.lessonId === nextLesson.id ? resume.positionSec : 0 } : null
    };
  }).filter(Boolean) as Array<{ slug: string; title: string; lessonsDone: number; lessonsTotal: number; certified: boolean; resume: { lessonId: string; title: string; positionSec: number } | null }>;
}

/** What the agent dock should show when a page loads. */
export async function conciergeState(user: SessionUser | null) {
  if (!user) return { needsOnboarding: false, profile: null, welcome: null };

  const profile = await LearnerProfile.findOne({ userId: user.userId }).lean<ILearnerProfileDocument>();
  const needsOnboarding = user.role === 'STUDENT' && !profile?.onboardedAt && !profile?.dismissedAt;
  if (needsOnboarding || !profile?.onboardedAt) {
    return { needsOnboarding, profile: profile ? publicProfile(profile) : null, welcome: null };
  }

  const courses = await listPublishedCourses();
  const [snapshot, dueCards, plan, firstName] = await Promise.all([
    learningSnapshot(user.userId, courses),
    CardReview.countDocuments({ userId: user.userId, dueAt: { $lte: new Date() } }),
    StudyPlan.findOne({ userId: user.userId }).sort({ weekStart: -1 }).lean<{ nudge: string }>(),
    resolveUserName(user.userId)
  ]);
  const hello = firstName ? `Welcome back, ${firstName}!` : 'Welcome back!';

  // Pick the single most useful next step.
  for (const course of snapshot) {
    if (course.lessonsDone >= course.lessonsTotal && !course.certified) {
      const examReady = await BankQuestion.exists({ courseSlug: course.slug, status: 'APPROVED', type: 'MCQ' });
      if (examReady) {
        return { needsOnboarding: false, profile: publicProfile(profile), welcome: { message: `${hello} You've finished every lesson of "${course.title}". Take the final exam to earn your certificate.`, action: { label: 'Take the exam', href: `/exam/${course.slug}` } } };
      }
    }
  }
  const resumeCourse = snapshot.find(c => c.resume && c.lessonsDone < c.lessonsTotal);
  if (resumeCourse?.resume) {
    const t = resumeCourse.resume.positionSec > 5 ? `?t=${Math.floor(resumeCourse.resume.positionSec)}` : '';
    return {
      needsOnboarding: false,
      profile: publicProfile(profile),
      welcome: {
        message: `${hello} Pick up "${resumeCourse.resume.title}" in ${resumeCourse.title}${t ? ` where you left off (${formatTimestamp(resumeCourse.resume.positionSec)})` : ''}. You're ${resumeCourse.lessonsDone}/${resumeCourse.lessonsTotal} lessons in.`,
        action: { label: 'Resume lesson', href: `/watch/${resumeCourse.slug}/${resumeCourse.resume.lessonId}${t}` }
      }
    };
  }
  if (dueCards > 0) {
    return { needsOnboarding: false, profile: publicProfile(profile), welcome: { message: `${hello} You have ${dueCards} flashcard${dueCards === 1 ? '' : 's'} due for review. A 5-minute review keeps them fresh.`, action: { label: 'Review now', href: '/my-learning#review' } } };
  }
  return {
    needsOnboarding: false,
    profile: publicProfile(profile),
    welcome: { message: `${hello} ${plan?.nudge || 'Ready to start something new? I can suggest a course that fits your goals.'}`, action: { label: 'Browse courses', href: '/courses' } }
  };
}

function publicProfile(p: ILearnerProfileDocument) {
  return {
    interests: p.interests,
    level: p.level,
    goal: p.goal,
    goalType: p.goalType,
    weeklyHours: p.weeklyHours,
    learningStyle: p.learningStyle,
    onboarded: Boolean(p.onboardedAt)
  };
}

export async function dismissOnboarding(userId: string) {
  await LearnerProfile.updateOne({ userId }, { $set: { dismissedAt: new Date() } }, { upsert: true });
}

export async function loadConciergeHistory(userId: string) {
  const thread = await AgentThread.findOne({ userId, agent: 'concierge', scope: 'global' }).lean<{ messages: Array<{ role: 'user' | 'assistant'; content: string; meta?: { actions?: ConciergeAction[] } }> }>();
  return (thread?.messages || []).map(m => ({ role: m.role, content: m.content, actions: m.meta?.actions || [] }));
}

/** One turn of the concierge conversation. Tools run server-side; UI actions are returned to the client. */
export async function conciergeTurn(params: {
  user: SessionUser | null;
  userKey: string;
  message: string;
  clientHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode: 'onboarding' | 'chat';
}) {
  const { user, userKey, message, mode } = params;
  const courses = await listPublishedCourses();
  const actions: ConciergeAction[] = [];

  let history = params.clientHistory;
  let profile: ILearnerProfileDocument | null = null;
  if (user) {
    const [stored, p] = await Promise.all([loadConciergeHistory(user.userId), LearnerProfile.findOne({ userId: user.userId }).lean<ILearnerProfileDocument>()]);
    history = stored.map(m => ({ role: m.role, content: m.content }));
    profile = p;
  }

  const tools: ToolDefinition[] = [
    {
      name: 'recommend_courses',
      description: 'Show course cards to the learner. Use after you understand their goals, or when they ask for suggestions. 1-3 courses.',
      parameters: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: { slug: { type: 'string', description: 'Course slug from the catalog' }, reason: { type: 'string', description: 'One sentence on why it fits this learner' } },
              required: ['slug', 'reason']
            }
          }
        },
        required: ['recommendations']
      },
      handler: async (args: Record<string, unknown>) => {
        const recs = (args.recommendations as Array<{ slug: string; reason: string }>) || [];
        const items = recs
          .map(r => {
            const c = courses.find(x => x.slug === r.slug);
            return c ? { id: c.id, slug: c.slug, title: c.title, thumbnail: c.thumbnail, price: c.price, discountPrice: c.discountPrice, rating: c.rating, level: c.level, reason: r.reason } : null;
          })
          .filter(Boolean)
          .slice(0, 3) as Extract<ConciergeAction, { type: 'courses' }>['items'];
        if (items.length) actions.push({ type: 'courses', items });
        return { shown: items.map(i => i.slug), unknown: recs.filter(r => !items.some(i => i.slug === r.slug)).map(r => r.slug) };
      }
    },
    {
      name: 'show_link',
      description: 'Show the learner a button that takes them to a page of the site.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Site path such as /courses, /course/<slug>, /my-learning, /certificates, /wishlist, /exam/<slug>' },
          label: { type: 'string', description: 'Short button label' }
        },
        required: ['path', 'label']
      },
      handler: async (args: Record<string, unknown>) => {
        const path = String(args.path || '');
        if (!ALLOWED_PATHS.some(p => p.test(path))) return { error: 'That page does not exist.' };
        actions.push({ type: 'link', href: path, label: String(args.label || 'Open').slice(0, 40) });
        return { shown: true };
      }
    },
    {
      name: 'add_to_cart',
      description: 'Add a course to the learner\'s cart when they say they want to buy or enroll in it.',
      parameters: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
      handler: async (args: Record<string, unknown>) => {
        const c = courses.find(x => x.slug === args.slug);
        if (!c) return { error: 'Unknown course.' };
        actions.push({ type: 'cart', courseId: c.id, slug: c.slug, title: c.title });
        return { added: c.slug };
      }
    }
  ];

  if (user) {
    tools.push(
      {
        name: 'save_learner_profile',
        description: 'Save what you learned about the learner. Call once you know their interests, level, goal and weekly time.',
        parameters: {
          type: 'object',
          properties: {
            interests: { type: 'array', items: { type: 'string' }, description: 'Creative areas, e.g. cinematography, color grading, music production' },
            level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
            goal: { type: 'string', description: 'Their goal in their own words, one sentence' },
            goalType: { type: 'string', enum: ['HOBBY', 'CAREER', 'FREELANCE', 'UPSKILL', 'OTHER'] },
            weeklyHours: { type: 'number', description: 'Hours per week they can study' },
            learningStyle: { type: 'string', description: 'Optional preference, e.g. short daily sessions, project-based' }
          },
          required: ['interests', 'level', 'goal', 'goalType', 'weeklyHours']
        },
        handler: async (args: Record<string, unknown>) => {
          const update = {
            interests: ((args.interests as string[]) || []).slice(0, 8).map(s => String(s).slice(0, 40)),
            level: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(String(args.level)) ? args.level : 'BEGINNER',
            goal: String(args.goal || '').slice(0, 300),
            goalType: ['HOBBY', 'CAREER', 'FREELANCE', 'UPSKILL', 'OTHER'].includes(String(args.goalType)) ? args.goalType : 'OTHER',
            weeklyHours: Math.max(0.5, Math.min(60, Number(args.weeklyHours) || 3)),
            learningStyle: String(args.learningStyle || '').slice(0, 200),
            onboardedAt: new Date()
          };
          await LearnerProfile.updateOne({ userId: user.userId }, { $set: update }, { upsert: true });
          actions.push({ type: 'profile_saved' });
          return { saved: true };
        }
      },
      {
        name: 'get_my_learning',
        description: 'Get the learner\'s enrolled courses, progress and next lesson.',
        parameters: { type: 'object', properties: {} },
        handler: async () => ({ courses: await learningSnapshot(user.userId, courses) })
      }
    );
  }

  const profileText = profile?.onboardedAt
    ? `Known learner profile: interests ${profile.interests.join(', ') || 'unknown'}; level ${profile.level}; goal "${profile.goal}" (${profile.goalType}); about ${profile.weeklyHours} h/week.`
    : user
      ? 'No learner profile saved yet.'
      : 'The visitor is not signed in, so nothing can be saved. Suggest signing in to save preferences and track progress.';

  const system = [
    'You are the Creators Lab guide: a friendly concierge for an online school of creative skills (filmmaking, photography, editing and color, 3D and motion, music and sound, design).',
    mode === 'onboarding'
      ? 'This is the learner\'s first visit. Have a short, warm conversation to learn (1) what they want to create, (2) their current level, (3) their goal (hobby, job, freelance, upskilling), and (4) how many hours a week they can study. Ask exactly one question per message and wait for the answer. Do not show course cards until you know all four. As soon as you know all four, call save_learner_profile, then recommend_courses with the 2-3 courses that best match their goal (for example, client or brand work points to commercial production) and explain your picks in one or two sentences. Offer to add one to their cart.'
      : 'Help the learner find courses, plan their learning, and get around the site. Use tools to show course cards or page buttons instead of describing URLs.',
    'Only recommend courses from the catalog below, by slug. Never invent courses, prices, discounts or features. If nothing fits, say so honestly.',
    'For payment, refund or account problems, tell them to use the Help tab in this panel.',
    'Keep replies short (under 90 words), conversational, and in the learner\'s language (Hinglish is fine).',
    profileText,
    `Catalog (slug | title | category | level | price | rating | summary):\n${courses.slice(0, 40).map(summarizeCourse).join('\n')}`,
    UNTRUSTED_DATA_RULE
  ].join('\n\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...history.slice(-10).map(h => ({ role: h.role, content: h.content.slice(0, 1500) } as ChatMessage)),
    { role: 'user', content: fence('student_message', message) }
  ];

  const result = await runAgent({ agent: 'concierge', userKey, tier: 'fast', messages, tools, maxTokens: 900, maxSteps: 4, temperature: 0.5 });
  const reply = result.content?.trim() || (actions.length ? 'Here you go:' : 'Sorry, I could not work that out. Could you rephrase?');

  if (user) {
    const now = new Date();
    await AgentThread.updateOne(
      { userId: user.userId, agent: 'concierge', scope: 'global' },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message, at: now },
              { role: 'assistant', content: reply, at: now, meta: { actions } }
            ],
            $slice: -30
          }
        }
      },
      { upsert: true }
    );
  }

  return { reply, actions };
}
