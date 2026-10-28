import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { findCourse } from '@/lib/courses';
import { generateReport, latestReport } from '@/lib/agents/report';

const WEEK_MS = 7 * 86400_000;

/** Latest saved report for a course. With ?weekly=1, creates a weekly summary if the last one is over a week old. */
export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) throw new ApiError(401, 'Please sign in to see your report.');
    const params = new URL(request.url).searchParams;
    const course = await findCourse(params.get('courseId') || '');
    if (!course) throw new ApiError(404, 'Course not found');
    await requireDatabase();

    let report = await latestReport(user.userId, course.slug);
    const stale = !report || Date.now() - new Date(report.createdAt).getTime() > WEEK_MS;
    if (stale && params.get('weekly') === '1') {
      try {
        await authorizeAI(request, { requireUser: true });
        report = await generateReport(user.userId, course, 'WEEKLY');
      } catch {
        // Not enough activity or AI unavailable: return whatever exists.
      }
    }
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const caller = await authorizeAI(request, { requireUser: true });
    const body = await request.json();
    const course = await findCourse(String(body.courseId || ''));
    if (!course) throw new ApiError(404, 'Course not found');
    await requireDatabase();
    const trigger = ['AFTER_EXAM', 'AFTER_QUIZ'].includes(body.trigger) ? body.trigger : 'ON_DEMAND';
    const report = await generateReport(caller.user!.userId, course, trigger);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return errorResponse(error);
  }
}
