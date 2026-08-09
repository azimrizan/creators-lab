import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-learnhub-2026-production';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    await connectToDatabase();

    const { courseId } = await request.json();
    const course = await Course.findById(courseId);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (course.price > 0 && course.discountPrice !== 0) {
      return NextResponse.json({ success: false, error: 'Course requires paid checkout' }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!user.enrolledCourseIds.includes(courseId)) {
      user.enrolledCourseIds.push(courseId);
      await user.save();
      await Course.findByIdAndUpdate(courseId, { $inc: { studentCount: 1 } });
    }

    return NextResponse.json({ success: true, message: 'Free course unlocked successfully', enrolledCourseIds: user.enrolledCourseIds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
