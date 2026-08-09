import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-learnhub-2026-production';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    await connectToDatabase();

    const user = await User.findById(decoded.userId);
    if (!user || user.isBlocked) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isBlocked: user.isBlocked,
      enrolledCourseIds: user.enrolledCourseIds || [],
      wishlistCourseIds: user.wishlistCourseIds || []
    };

    return NextResponse.json({ success: true, user: userResponse });
  } catch (error: any) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}
