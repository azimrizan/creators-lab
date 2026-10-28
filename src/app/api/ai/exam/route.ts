import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { findCourse } from '@/lib/courses';
import { examResult, examStatus, startExam } from '@/lib/agents/exam';

/** Exam eligibility and attempts, or a past result with ?sessionId=. */
export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) throw new ApiError(401, 'Please sign in to take the exam.');
    const params = new URL(request.url).searchParams;
    const course = await findCourse(params.get('courseId') || '');
    if (!course) throw new ApiError(404, 'Course not found');
    await requireDatabase();

    const sessionId = params.get('sessionId');
    if (sessionId) return NextResponse.json({ success: true, result: await examResult(user.userId, sessionId) });
    return NextResponse.json({ success: true, status: await examStatus(user.userId, course) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Starts (or resumes) an exam attempt. */
export async function POST(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) throw new ApiError(401, 'Please sign in to take the exam.');
    const body = await request.json();
    const course = await findCourse(String(body.courseId || ''));
    if (!course) throw new ApiError(404, 'Course not found');
    await requireDatabase();
    return NextResponse.json({ success: true, exam: await startExam(user.userId, course) });
  } catch (error) {
    return errorResponse(error);
  }
}
