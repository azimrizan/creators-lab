import { NextResponse } from 'next/server';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { findCourse } from '@/lib/courses';
import { canManageCourse } from '@/lib/agents/courseBuilder';
import { courseAnalytics, summarizeInsights } from '@/lib/agents/insights';

async function load(request: Request, courseId: string) {
  const caller = await authorizeAI(request, { staffOnly: true });
  await requireDatabase();
  const course = await findCourse(courseId);
  if (!course) throw new ApiError(404, 'Course not found');
  if (!(await canManageCourse(caller.user!, course))) throw new ApiError(403, 'You can only view insights for your own courses.');
  return { caller, course };
}

/** Raw course analytics (no AI call). */
export async function GET(request: Request) {
  try {
    const { course } = await load(request, new URL(request.url).searchParams.get('courseId') || '');
    return NextResponse.json({ success: true, analytics: await courseAnalytics(course) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Analytics plus an AI interpretation with recommendations. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caller, course } = await load(request, String(body.courseId || ''));
    const analytics = await courseAnalytics(course);
    if (!analytics.learners) {
      return NextResponse.json({ success: true, analytics, summary: null, message: 'No learner activity yet for this course.' });
    }
    const summary = await summarizeInsights(caller.userKey, course, analytics);
    return NextResponse.json({ success: true, analytics, summary });
  } catch (error) {
    return errorResponse(error);
  }
}
