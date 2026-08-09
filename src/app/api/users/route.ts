import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const { userId, isBlocked, role } = await request.json();

    const updateFields: any = {};
    if (typeof isBlocked === 'boolean') updateFields.isBlocked = isBlocked;
    if (role) updateFields.role = role;

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select('-passwordHash');
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
