import { NextResponse } from 'next/server';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { findCourse, findLesson } from '@/lib/courses';
import {
  approveLesson,
  canManageCourse,
  courseStatus,
  deleteGeneratedItem,
  generateLessonContent,
  lessonReview,
  transcribeLesson
} from '@/lib/agents/courseBuilder';

// Transcription and generation can take a while for long lessons.
export const maxDuration = 300;

async function loadManagedCourse(request: Request, courseId: string) {
  const caller = await authorizeAI(request, { staffOnly: true });
  await requireDatabase();
  const course = await findCourse(courseId);
  if (!course) throw new ApiError(404, 'Course not found');
  if (!(await canManageCourse(caller.user!, course))) throw new ApiError(403, 'You can only manage your own courses.');
  return { caller, course };
}

/** ?courseId → per-lesson status; add &lessonId → full generated content for review. */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const { course } = await loadManagedCourse(request, params.get('courseId') || '');
    const lessonId = params.get('lessonId');
    if (lessonId) return NextResponse.json({ success: true, review: await lessonReview(course.slug, lessonId) });
    return NextResponse.json({ success: true, course: { slug: course.slug, title: course.title }, lessons: await courseStatus(course) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** action: "transcribe" | "generate" | "approve" | "delete_item" */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caller, course } = await loadManagedCourse(request, String(body.courseId || ''));
    const lesson = body.lessonId ? findLesson(course, String(body.lessonId)) : null;
    if (body.action !== 'delete_item' && !lesson) throw new ApiError(404, 'Lesson not found');

    switch (body.action) {
      case 'transcribe':
        return NextResponse.json({ success: true, result: await transcribeLesson(course, lesson!, caller.userKey) });
      case 'generate':
        return NextResponse.json({ success: true, result: await generateLessonContent(course, lesson!, caller.userKey) });
      case 'approve':
        return NextResponse.json({ success: true, result: await approveLesson(course.slug, lesson!.id) });
      case 'delete_item':
        return NextResponse.json({ success: true, result: await deleteGeneratedItem(course.slug, body.kind === 'checkpoint' ? 'checkpoint' : 'question', String(body.id)) });
      default:
        throw new ApiError(400, 'Unknown action.');
    }
  } catch (error) {
    return errorResponse(error);
  }
}
