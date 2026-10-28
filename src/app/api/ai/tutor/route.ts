import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { AIUnavailableError, chatStream, modelFor } from '@/lib/ai/groq';
import { findCourse, findLesson } from '@/lib/courses';
import { loadTutorHistory, prepareTutorTurn, saveTutorTurn } from '@/lib/agents/tutor';

/** Saved tutor conversation for a course. */
export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) return NextResponse.json({ success: true, history: [] });
    const course = await findCourse(new URL(request.url).searchParams.get('courseId') || '');
    if (!course) throw new ApiError(404, 'Course not found');
    await requireDatabase();
    const history = await loadTutorHistory(user.userId, course.slug);
    return NextResponse.json({
      success: true,
      history: history.map(m => ({ role: m.role, content: m.content, sources: (m.meta as { sources?: unknown })?.sources || [] }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Streams a grounded tutor answer as newline-delimited JSON events:
 * {"type":"sources",...} then {"type":"delta","text":...}* then {"type":"done"} (or {"type":"error"}).
 */
export async function POST(request: Request) {
  try {
    const caller = await authorizeAI(request);
    const body = await request.json();
    const message = String(body.message || '').trim();
    if (!message) throw new ApiError(400, 'Message is required.');
    if (message.length > 2000) throw new ApiError(400, 'Message is too long.');

    const course = await findCourse(String(body.courseId || ''));
    if (!course) throw new ApiError(404, 'Course not found');
    const lesson = body.lessonId ? findLesson(course, String(body.lessonId)) : null;
    const atSec = Math.max(0, Number(body.atSec) || 0);

    await requireDatabase();

    const history = caller.user
      ? (await loadTutorHistory(caller.user.userId, course.slug)).map(m => ({ role: m.role, content: m.content }))
      : (Array.isArray(body.history) ? body.history : [])
          .filter((h: { role: string; content: unknown }) => (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
          .slice(-6);

    const { messages, sources } = await prepareTutorTurn({ course, lesson, atSec, message, history });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        send({ type: 'sources', sources, model: modelFor('reasoning') });
        let answer = '';
        try {
          for await (const delta of chatStream({ agent: 'tutor', userKey: caller.userKey, tier: 'reasoning', reasoningEffort: 'low', messages, maxTokens: 1400, temperature: 0.3 })) {
            answer += delta;
            send({ type: 'delta', text: delta });
          }
          if (!answer.trim()) {
            answer = "Sorry, I couldn't put an answer together. Could you rephrase your question?";
            send({ type: 'delta', text: answer });
          }
          if (caller.user) await saveTutorTurn(caller.user.userId, course.slug, message, answer, sources).catch(() => {});
          send({ type: 'done' });
        } catch (err) {
          send({ type: 'error', error: err instanceof AIUnavailableError ? err.message : 'The tutor is unavailable right now. Please try again.' });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
