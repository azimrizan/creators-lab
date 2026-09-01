import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Course from '@/models/Course';

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

    const OLD_REACT_IMG = '1633356122544-f134324a6cee';
    const NEW_CODE_IMG = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';

    // Auto-migrate any stale React thumbnails stored in MongoDB
    Course.updateMany(
      { thumbnail: { $regex: OLD_REACT_IMG } },
      { $set: { thumbnail: NEW_CODE_IMG } }
    ).catch(() => {});

    const rawCourses = await Course.find(filter).sort({ createdAt: -1 });

    // Normalize courses so every document has a guaranteed non-empty id string and clean thumbnail
    const normalizedCourses = rawCourses.map(doc => {
      const obj = doc.toObject();
      const courseId = obj.id || obj._id.toString();
      let thumbnail = obj.thumbnail;
      if (!thumbnail || thumbnail.includes(OLD_REACT_IMG)) {
        thumbnail = NEW_CODE_IMG;
      }
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
