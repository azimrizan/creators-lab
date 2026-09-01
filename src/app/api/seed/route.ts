import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import Order from '@/models/Order';
import { MOCK_COURSES } from '@/lib/mockData';

export async function POST() {
  try {
    await connectToDatabase();

    // Clear existing collection data
    await Course.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});

    // Hash default passwords
    const studentPasswordHash = await bcrypt.hash('Student123!', 10);
    const instructorPasswordHash = await bcrypt.hash('Instructor123!', 10);
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

    const initialUsers = [
      {
        name: 'Maya Sharma',
        email: 'student@creatorslab.com',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
        isBlocked: false,
        enrolledCourseIds: [],
        wishlistCourseIds: []
      },
      {
        name: 'Philip Bloom',
        email: 'instructor@creatorslab.com',
        passwordHash: instructorPasswordHash,
        role: 'INSTRUCTOR',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        bio: 'World-renowned Director of Photography, Cinematographer & Pioneer of DSLR Filmmaking.',
        isBlocked: false,
        enrolledCourseIds: [],
        wishlistCourseIds: []
      },
      {
        name: 'Super Admin',
        email: 'admin@creatorslab.com',
        passwordHash: adminPasswordHash,
        role: 'SUPER_ADMIN',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        isBlocked: false,
        enrolledCourseIds: [],
        wishlistCourseIds: []
      }
    ];

    const seededUsers = await User.insertMany(initialUsers);
    const seededCourses = await Course.insertMany(MOCK_COURSES);

    return NextResponse.json({
      success: true,
      message: 'Live MongoDB Atlas database successfully seeded with clean credentials!',
      counts: {
        courses: seededCourses.length,
        users: seededUsers.length,
        orders: 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
