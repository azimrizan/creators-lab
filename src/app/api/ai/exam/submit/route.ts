import { NextResponse } from 'next/server';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { findCourse } from '@/lib/courses';
import { submitExam } from '@/lib/agents/exam';

// Written answers are graded by the reasoning model, which can take a little while.
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const caller = await authorizeAI(request, { requireUser: true });
    const body = await request.json();
    const course = await findCourse(String(body.courseId || ''));
    if (!course) throw new ApiError(404, 'Course not found');
    await requireDatabase();
    const result = await submitExam(caller.user!.userId, course, String(body.sessionId || ''), body.answers || {});
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return errorResponse(error);
  }
}
