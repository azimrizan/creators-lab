import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Course from '@/models/Course';
import { razorpayClient } from '@/lib/razorpay';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-learnhub-2026-production';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    let userId = 'guest';
    let userName = 'Guest Learner';
    let userEmail = 'guest@learnhub.com';

    await connectToDatabase();

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const dbUser = mongoose.Types.ObjectId.isValid(decoded.userId)
          ? await User.findById(decoded.userId)
          : await User.findOne({ email: decoded.email });

        if (dbUser) {
          userId = dbUser._id.toString();
          userName = dbUser.name;
          userEmail = dbUser.email;
        }
      } catch (e) {
        // guest fallback
      }
    }

    const { courseId, couponCode } = await request.json();

    // Query Course safely supporting custom string IDs (e.g., 'course-1') or native Mongo ObjectIds
    const isObjId = mongoose.Types.ObjectId.isValid(courseId);
    const course = await Course.findOne({
      $or: [
        ...(isObjId ? [{ _id: courseId }] : []),
        { id: courseId },
        { slug: courseId }
      ]
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const targetCourseId = course._id.toString();

    // Check if user is already enrolled
    if (userId !== 'guest') {
      const dbUser = await User.findById(userId);
      if (dbUser && dbUser.enrolledCourseIds.includes(targetCourseId)) {
        return NextResponse.json({ success: false, error: 'You are already enrolled in this course' }, { status: 400 });
      }
    }

    const rawPrice = course.discountPrice || course.price;
    const discountAmount = (couponCode === 'WELCOME20' || couponCode === 'PROMO20') ? rawPrice * 0.2 : 0;
    const subtotal = rawPrice - discountAmount;
    const taxAmount = subtotal * 0.18;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const amountInPaise = Math.round(totalAmount * 100);

    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    let razorpayOrderId = `order_test_${Date.now()}`;

    try {
      if (process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('placeholder')) {
        const razorpayOrder = await razorpayClient.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: orderNumber,
          notes: { courseId: targetCourseId, userId }
        });
        razorpayOrderId = razorpayOrder.id;
      }
    } catch (err) {
      console.warn('Razorpay live API call skipped:', err);
    }

    const newOrder = await Order.create({
      orderNumber,
      userId,
      userName,
      userEmail,
      items: [{ courseId: targetCourseId, courseTitle: course.title, price: rawPrice }],
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentGateway: 'RAZORPAY',
      paymentId: razorpayOrderId,
      status: 'PENDING'
    });

    return NextResponse.json({
      success: true,
      orderNumber,
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      dbOrderId: newOrder._id.toString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
