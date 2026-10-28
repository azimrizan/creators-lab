import { NextResponse, after } from 'next/server';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { findCourse, findLesson } from '@/lib/courses';
import { canManageCourse } from '@/lib/agents/courseBuilder';
import { deleteDub, getDubbingInfo, queueDub } from '@/lib/dubbing/pipeline';

// The dubbing job runs after the response and must finish within the function's time limit.
// 300 seconds is the most Vercel's Hobby plan allows; a 15-minute lesson takes about 1-3 minutes.
export const maxDuration = 300;

/** ?video=<lesson video URL> → the audio languages and subtitles available for it. */
export async function GET(request: Request) {
  try {
    const video = new URL(request.url).searchParams.get('video');
    if (!video) throw new ApiError(400, 'video is required');
    return NextResponse.json({ success: true, ...(await getDubbingInfo(video)) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** { courseId, lessonId, language, voice } starts a dub; add action: "delete" to remove a track. Staff only. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const caller = await authorizeAI(request, { staffOnly: true });
    await requireDatabase();
    const course = await findCourse(String(body.courseId || ''));
    if (!course) throw new ApiError(404, 'Course not found');
    if (!(await canManageCourse(caller.user!, course))) throw new ApiError(403, 'You can only manage your own courses.');
    const lesson = findLesson(course, String(body.lessonId || ''));
    if (!lesson?.videoUrl) throw new ApiError(400, 'Only video lessons can be dubbed.');
    const language = String(body.language || '');

    if (body.action === 'delete') {
      await deleteDub(lesson.videoUrl, language);
      return NextResponse.json({ success: true });
    }

    const job = await queueDub({
      videoUrl: lesson.videoUrl,
      language,
      voice: body.voice === 'female' ? 'female' : 'male',
      userKey: caller.userKey,
      origin: new URL(request.url).origin
    });
    after(job);
    return NextResponse.json({ success: true, ...(await getDubbingInfo(lesson.videoUrl)) });
  } catch (error) {
    return errorResponse(error);
  }
}
