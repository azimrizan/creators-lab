import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Course from '@/models/Course';
import { MOCK_COURSES } from '@/lib/mockData';
import { getSafeThumbnail } from '@/lib/types';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: any = { status: 'PUBLISHED' };
    if (category && category !== 'ALL') {
      filter.categoryId = category;
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Sync all creative masterclasses to MongoDB Atlas
    for (const mockCourse of MOCK_COURSES) {
      await Course.findOneAndUpdate(
        { slug: mockCourse.slug },
        { $set: mockCourse },
        { upsert: true }
      ).catch(() => {});
    }

    // Purge legacy coding courses if present
    await Course.deleteMany({
      slug: { 
        $in: [
          'full-stack-nextjs-react-masterclass', 
          'python-ai-deep-learning-llms', 
          'cloud-devops-masterclass-aws-docker-kubernetes', 
          'cybersecurity-ethical-hacking-defense'
        ] 
      }
    }).catch(() => {});

    const rawCourses = await Course.find(filter).sort({ createdAt: -1 });

    // Normalize courses so every document has a guaranteed non-empty id string and distinct category thumbnail
    const normalizedCourses = rawCourses.map(doc => {
      const obj = doc.toObject();
      const courseId = obj.id || obj._id.toString();
      const thumbnail = getSafeThumbnail(obj.thumbnail, obj.title, obj.categoryName);
      return { ...obj, id: courseId, _id: courseId, thumbnail };
    });

    return NextResponse.json({ success: true, count: normalizedCourses.length, data: normalizedCourses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const course = await Course.create(body);
    const obj = course.toObject();
    const courseId = obj.id || obj._id.toString();
    const normalized = { ...obj, id: courseId, _id: courseId };

    return NextResponse.json({ success: true, data: normalized }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
