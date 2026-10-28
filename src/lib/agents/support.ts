import { Types } from 'mongoose';
import Order from '@/models/Order';
import Certificate from '@/models/Certificate';
import SupportTicket from '@/models/SupportTicket';
import LessonProgress from '@/models/LessonProgress';
import AgentThread from '@/models/AgentThread';
import UserModel from '@/models/User';
import { ChatMessage, runAgent, ToolDefinition } from '@/lib/ai/groq';
import { fence, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { allLessons, listPublishedCourses, matchesCourse } from '@/lib/courses';
import { SessionUser } from '@/lib/auth';

export async function loadSupportHistory(userId: string) {
  const thread = await AgentThread.findOne({ userId, agent: 'support', scope: 'global' }).lean<{ messages: Array<{ role: 'user' | 'assistant'; content: string; meta?: { ticket?: string } }> }>();
  return (thread?.messages || []).map(m => ({ role: m.role, content: m.content, ticket: m.meta?.ticket }));
}

/**
 * Support agent: answers account, payment, access and certificate questions using only the
 * signed-in learner's own records, and opens a ticket for a human when it cannot resolve something.
 */
export async function supportTurn(params: { user: SessionUser | null; userKey: string; message: string; clientHistory: Array<{ role: 'user' | 'assistant'; content: string }> }) {
  const { user, userKey, message } = params;
  let ticketNumber: string | undefined;
  const courses = await listPublishedCourses();

  const tools: ToolDefinition[] = [
    {
      name: 'get_course_info',
      description: 'Look up a course in the catalog by keywords (title, topic, instructor).',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      handler: async (args: Record<string, unknown>) => {
        const q = String(args.query || '').toLowerCase();
        return courses
          .filter(c => `${c.title} ${c.categoryName} ${c.instructorName} ${(c.tags || []).join(' ')}`.toLowerCase().includes(q))
          .slice(0, 3)
          .map(c => ({ slug: c.slug, title: c.title, price: c.price, discountPrice: c.discountPrice, level: c.level, lessons: allLessons(c).length, instructor: c.instructorName }));
      }
    }
  ];

  let history = params.clientHistory;
  if (user) {
    history = (await loadSupportHistory(user.userId)).map(m => ({ role: m.role, content: m.content }));
    const dbUser = Types.ObjectId.isValid(user.userId)
      ? await UserModel.findById(user.userId).select('name email enrolledCourseIds createdAt').lean<{ name: string; email: string; enrolledCourseIds: string[]; createdAt: Date }>()
      : null;

    tools.push(
      {
        name: 'list_my_orders',
        description: 'The learner\'s orders and payments (most recent first).',
        parameters: { type: 'object', properties: {} },
        handler: async () => {
          const orders = await Order.find({ userId: user.userId }).sort({ createdAt: -1 }).limit(10).lean<Array<Record<string, unknown>>>();
          return orders.map(o => ({
            orderNumber: o.orderNumber,
            date: o.createdAt,
            items: (o.items as Array<{ courseTitle: string; price: number }>).map(i => ({ course: i.courseTitle, price: i.price })),
            totalInr: o.totalAmount,
            status: o.status,
            paymentId: o.paymentId,
            gateway: o.paymentGateway
          }));
        }
      },
      {
        name: 'list_my_courses',
        description: 'Courses the learner is enrolled in, with progress.',
        parameters: { type: 'object', properties: {} },
        handler: async () => {
          const progress = await LessonProgress.find({ userId: user.userId, completed: true }).select('courseSlug').lean<Array<{ courseSlug: string }>>();
          return courses
            .filter(c => (dbUser?.enrolledCourseIds || []).some(id => matchesCourse(c, id)) || progress.some(p => p.courseSlug === c.slug))
            .map(c => ({ slug: c.slug, title: c.title, lessonsCompleted: progress.filter(p => p.courseSlug === c.slug).length, lessonsTotal: allLessons(c).length }));
        }
      },
      {
        name: 'list_my_certificates',
        description: 'Certificates the learner has earned, with verification numbers.',
        parameters: { type: 'object', properties: {} },
        handler: async () => {
          const certs = await Certificate.find({ userId: user.userId }).lean<Array<Record<string, unknown>>>();
          return certs.map(c => ({ course: c.courseTitle, certificateNumber: c.certificateNumber, issued: c.issueDate, verifyUrl: `/verify/${c.certificateNumber}` }));
        }
      },
      {
        name: 'create_support_ticket',
        description: 'Escalate to the human support team. Use for refunds, failed or duplicate payments, missing access after payment, account problems, exam re-attempts, or anything you cannot resolve.',
        parameters: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            category: { type: 'string', enum: ['PAYMENT', 'REFUND', 'ACCESS', 'CERTIFICATE', 'ACCOUNT', 'OTHER'] },
            summary: { type: 'string', description: 'What happened and what the learner wants, including order numbers or course names' }
          },
          required: ['subject', 'category', 'summary']
        },
        handler: async (args: Record<string, unknown>) => {
          const ticket = await SupportTicket.create({
            userId: user.userId,
            email: dbUser?.email || user.email,
            subject: String(args.subject || 'Support request').slice(0, 120),
            category: ['PAYMENT', 'REFUND', 'ACCESS', 'CERTIFICATE', 'ACCOUNT', 'OTHER'].includes(String(args.category)) ? args.category : 'OTHER',
            summary: String(args.summary || message).slice(0, 2000)
          });
          ticketNumber = `T-${String(ticket._id).slice(-6).toUpperCase()}`;
          return { ticketNumber, responseTime: 'The support team replies by email, usually within 1 business day.' };
        }
      }
    );
  }

  const system = [
    'You are the Creators Lab support assistant. Help with payments (Razorpay, INR), orders, course access, certificates, exams and account questions.',
    user
      ? 'Use the tools to look up the learner\'s own orders, courses and certificates before answering. Quote real order numbers and dates from tool results.'
      : 'The visitor is not signed in, so you cannot see any account data. For anything about their orders, access or certificates, ask them to sign in first.',
    'Policies you can state: payments are processed securely by Razorpay; a paid course appears in My Learning right after payment; certificates are earned by passing the final exam and can be verified at /verify/<number>; each exam allows 3 attempts.',
    'Do not promise refunds, discounts or exceptions, and do not invent policies. For refunds, payment failures, missing access or anything you cannot resolve, call create_support_ticket and give the learner the ticketNumber it returns.',
    'Never say a ticket was opened, and never write a ticket number, unless create_support_ticket returned it in this conversation. Never invent order numbers, certificate numbers or dates; only quote what the tools returned.',
    'Answer every part of a multi-part message: look up each thing the learner asks about.',
    'Be brief (under 100 words), friendly and specific. Reply in the learner\'s language.',
    UNTRUSTED_DATA_RULE
  ].join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...history.slice(-8).map(h => ({ role: h.role, content: h.content.slice(0, 1500) } as ChatMessage)),
    { role: 'user', content: fence('student_message', message) }
  ];

  // Support answers depend on correct tool use, so it runs on the reasoning model.
  const result = await runAgent({ agent: 'support', userKey, tier: 'reasoning', reasoningEffort: 'low', messages, tools, maxTokens: 1200, maxSteps: 5, temperature: 0.2 });
  let reply = result.content?.trim() || (ticketNumber ? `I've opened ticket ${ticketNumber}. Our team will email you within 1 business day.` : 'Sorry, I could not work that out. Could you rephrase?');

  // Guardrail: never let the model claim a ticket that was not actually created.
  if (!ticketNumber && /ticket\s*(#|number|no\.?|id)|\bT-[A-Z0-9]{4,}|CS-\d{4}/i.test(reply)) {
    reply = user
      ? "I wasn't able to open a support ticket just now. Please try again in a moment, or email the support team with your order number."
      : 'Please sign in so I can look into this and open a support ticket for you.';
  }

  if (user) {
    const now = new Date();
    await AgentThread.updateOne(
      { userId: user.userId, agent: 'support', scope: 'global' },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message, at: now },
              { role: 'assistant', content: reply, at: now, meta: ticketNumber ? { ticket: ticketNumber } : {} }
            ],
            $slice: -30
          }
        }
      },
      { upsert: true }
    );
  }

  return { reply, ticketNumber: ticketNumber || null };
}
