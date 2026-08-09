import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Course from '@/models/Course';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-learnhub-2026-production';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    await connectToDatabase();

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
          const orders = await Order.find({}).sort({ createdAt: -1 });
          return NextResponse.json({ success: true, orders });
        } else if (user) {
          const orders = await Order.find({ userId: user._id.toString() }).sort({ createdAt: -1 });
          return NextResponse.json({ success: true, orders });
        }
      } catch (e) {
        // invalid token
      }
    }

    const publicOrders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders: publicOrders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { userId, items, paymentId, paymentGateway, subtotal, discountAmount, taxAmount, totalAmount } = body;

    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let userName = 'Student';
    let userEmail = 'student@learnhub.com';

    if (userId) {
      const dbUser = await User.findById(userId);
      if (dbUser) {
        userName = dbUser.name;
        userEmail = dbUser.email;

        // Add course IDs to user's enrolledCourseIds in MongoDB
        items.forEach((item: any) => {
          if (!dbUser.enrolledCourseIds.includes(item.courseId)) {
            dbUser.enrolledCourseIds.push(item.courseId);
          }
        });
        await dbUser.save();
      }
    }

    const order = await Order.create({
      orderNumber,
      userId: userId || 'guest',
      userName,
      userEmail,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentGateway: paymentGateway || 'RAZORPAY',
      paymentId: paymentId || `pay_rzp_${Date.now()}`,
      status: 'SUCCESSFUL'
    });

    // Update studentCount on purchased courses
    for (const item of items) {
      await Course.findByIdAndUpdate(item.courseId, { $inc: { studentCount: 1 } });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
