import { NextResponse } from 'next/server';
import { getClientIp, getSessionUser } from '@/lib/auth';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { findCourse } from '@/lib/courses';
import { answerCheckpoint, answerFollowUp, checkpointsForLearner, createFollowUp } from '@/lib/agents/checkpoints';

/** Approved in-video checkpoints for a lesson (questions only, no answers). */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const course = await findCourse(params.get('courseId') || '');
    if (!course) throw new ApiError(404, 'Course not found');
    await requireDatabase();
    const user = getSessionUser(request);
    const checkpoints = await checkpointsForLearner(user?.userId || null, course.slug, params.get('lessonId') || '');
    return NextResponse.json({ success: true, checkpoints });
  } catch (error) {
    return errorResponse(error);
  }
}

/** action: "answer" | "follow_up" | "answer_follow_up" */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await requireDatabase();
    const user = getSessionUser(request);

    if (body.action === 'answer') {
      const result = await answerCheckpoint(user?.userId || null, String(body.checkpointId), String(body.qid), Number(body.choice));
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'follow_up') {
      const caller = await authorizeAI(request);
      const result = await createFollowUp(caller.userKey, String(body.checkpointId), String(body.qid));
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'answer_follow_up') {
      const userKey = user ? user.userId : `ip:${getClientIp(request)}`;
      const result = await answerFollowUp(userKey, user?.userId || null, String(body.followUpId), Number(body.choice));
      return NextResponse.json({ success: true, ...result });
    }

    throw new ApiError(400, 'Unknown action.');
  } catch (error) {
    return errorResponse(error);
  }
}
