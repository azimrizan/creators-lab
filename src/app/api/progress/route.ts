import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import User from '@/models/User';
import LessonProgress from '@/models/LessonProgress';
import { getSessionUser } from '@/lib/auth';
import { findCourse, findLesson } from '@/lib/courses';
import { ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';

/** The signed-in learner's saved progress for one course. */
export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const courseId = new URL(request.url).searchParams.get('courseId') || '';
    const course = await findCourse(courseId);
    if (!course) throw new ApiError(404, 'Course not found');

    await requireDatabase();
    const rows = await LessonProgress.find({ userId: user.userId, courseSlug: course.slug })
      .select('lessonId positionSec completed')
      .lean<Array<{ lessonId: string; positionSec: number; completed: boolean }>>();

    return NextResponse.json({
      success: true,
      progress: rows.map(r => ({ lessonId: r.lessonId, positionSec: r.positionSec, completed: r.completed }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Saves watch position, time watched, rewatches/skips and completion. The watch page calls this
 * every ~15 seconds while playing, on seeks, and when a lesson is completed.
 */
export async function POST(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { courseId, lessonId, isCompleted } = body;
    const positionSec = Number(body.positionSec);
    const durationSec = Number(body.durationSec);
    const watchedDelta = Math.max(0, Math.min(60, Number(body.watchedDelta) || 0));

    const course = await findCourse(String(courseId || ''));
    if (!course) throw new ApiError(404, 'Course not found');
    if (!findLesson(course, String(lessonId || ''))) throw new ApiError(404, 'Lesson not found');

    await requireDatabase();

    const update: Record<string, Record<string, unknown>> = { $set: {}, $inc: {}, $max: {}, $push: {} };
    if (Number.isFinite(positionSec) && positionSec >= 0) {
      update.$set.positionSec = Math.floor(positionSec);
      update.$max.maxPositionSec = Math.floor(positionSec);
    }
    if (Number.isFinite(durationSec) && durationSec > 0) update.$set.durationSec = Math.floor(durationSec);
    if (watchedDelta > 0) update.$inc.watchedSec = watchedDelta;
    if (isCompleted) {
      update.$set.completed = true;
      update.$set.completedAt = new Date();
    }

    const seek = body.seek as { fromSec?: number; toSec?: number } | undefined;
    if (seek && Number.isFinite(seek.fromSec) && Number.isFinite(seek.toSec)) {
      const entry = { fromSec: Math.floor(seek.fromSec!), toSec: Math.floor(seek.toSec!), at: new Date() };
      if (entry.toSec < entry.fromSec - 5) update.$push.rewatches = { $each: [{ fromSec: entry.toSec, toSec: entry.fromSec, at: entry.at }], $slice: -30 };
      else if (entry.toSec > entry.fromSec + 10) update.$push.skips = { $each: [entry], $slice: -30 };
    }

    for (const key of Object.keys(update)) {
      if (!Object.keys(update[key]).length) delete update[key];
    }

    await LessonProgress.updateOne(
      { userId: user.userId, courseSlug: course.slug, lessonId },
      { ...update, $setOnInsert: { userId: user.userId, courseSlug: course.slug, lessonId } },
      { upsert: true }
    );

    // Keep the existing behaviour: watching a course's lessons enrolls the learner in it.
    let enrolledCourseIds: string[] | undefined;
    if (Types.ObjectId.isValid(user.userId)) {
      const dbUser = await User.findById(user.userId);
      if (dbUser) {
        if (!dbUser.enrolledCourseIds.includes(course.id)) {
          dbUser.enrolledCourseIds.push(course.id);
          await dbUser.save();
        }
        enrolledCourseIds = dbUser.enrolledCourseIds;
      }
    }

    return NextResponse.json({ success: true, enrolledCourseIds });
  } catch (error) {
    return errorResponse(error);
  }
}
