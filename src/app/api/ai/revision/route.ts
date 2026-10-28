import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { findCourse } from '@/lib/courses';
import { dueCards, reviewCard, ReviewGrade, studyKitForLearner } from '@/lib/agents/revision';

/** ?courseId&lessonId → the lesson's summary and flashcards; ?due=1 → cards due today across courses. */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const user = getSessionUser(request);
    await requireDatabase();

    if (params.get('due') === '1') {
      if (!user) throw new ApiError(401, 'Please sign in.');
      return NextResponse.json({ success: true, ...(await dueCards(user.userId)) });
    }

    const course = await findCourse(params.get('courseId') || '');
    if (!course) throw new ApiError(404, 'Course not found');
    const kit = await studyKitForLearner(user?.userId || null, course.slug, params.get('lessonId') || '');
    return NextResponse.json({ success: true, kit });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) throw new ApiError(401, 'Sign in to save your flashcard progress.');
    const body = await request.json();
    await requireDatabase();
    const result = await reviewCard(user.userId, String(body.courseSlug), String(body.lessonId), String(body.cardId), body.grade as ReviewGrade);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
