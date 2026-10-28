import { Types } from 'mongoose';
import { connectToDatabase } from './mongodb';
import CourseModel from '@/models/Course';
import { MOCK_COURSES } from './mockData';
import { Course, Lesson } from './types';
import { allLessons } from './courseUtils';

export { allLessons, stripQuizAnswers, formatTimestamp } from './courseUtils';

/**
 * Server-side course lookup. AI data is keyed by course slug because it is the one
 * identifier that is stable whether courses come from MongoDB or the mock catalog.
 */
export async function findCourse(idOrSlug: string): Promise<Course | null> {
  if (!idOrSlug) return null;

  try {
    await connectToDatabase();
    const query = Types.ObjectId.isValid(idOrSlug) && idOrSlug.length === 24
      ? { $or: [{ slug: idOrSlug }, { _id: idOrSlug }] }
      : { slug: idOrSlug };
    const doc = await CourseModel.findOne(query).lean();
    if (doc) {
      const obj = doc as unknown as Course & { _id: Types.ObjectId };
      return { ...obj, id: obj._id.toString() };
    }
  } catch {
    // Fall through to the bundled catalog when the database is unavailable
  }

  return MOCK_COURSES.find(c => c.slug === idOrSlug || c.id === idOrSlug) || null;
}

export async function listPublishedCourses(): Promise<Course[]> {
  try {
    await connectToDatabase();
    const docs = await CourseModel.find({ status: 'PUBLISHED' }).lean();
    if (docs.length > 0) {
      return docs.map(d => {
        const obj = d as unknown as Course & { _id: Types.ObjectId };
        return { ...obj, id: obj._id.toString() };
      });
    }
  } catch {
    // Fall through to the bundled catalog
  }
  return MOCK_COURSES.filter(c => c.status === 'PUBLISHED');
}

export function findLesson(course: Course, lessonId: string): Lesson | null {
  return allLessons(course).find(l => l.id === lessonId) || null;
}

/** True if the given course id/slug refers to this course. */
export function matchesCourse(course: Course, idOrSlug: string): boolean {
  return course.slug === idOrSlug || course.id === idOrSlug || (course as Course & { _id?: string })._id?.toString() === idOrSlug;
}
