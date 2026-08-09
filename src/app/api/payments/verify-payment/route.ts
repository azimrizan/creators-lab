import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Course from '@/models/Course';

const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = await request.json();

    await connectToDatabase();

    // Verify HMAC signature only if live signature is present and not test simulation
    if (
      razorpay_signature &&
      razorpay_signature !== 'test_signature' &&
      RAZORPAY_SECRET &&
      !RAZORPAY_SECRET.includes('placeholder')
    ) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, error: 'Payment signature verification failed' }, { status: 400 });
      }
    }

    const order = await Order.findById(dbOrderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    order.status = 'SUCCESSFUL';
    order.paymentId = razorpay_payment_id || `pay_${Date.now()}`;
    await order.save();

    // Unlock enrollment in User document
    if (order.userId && order.userId !== 'guest') {
      const user = mongoose.Types.ObjectId.isValid(order.userId)
        ? await User.findById(order.userId)
        : await User.findOne({ email: order.userEmail });

      if (user) {
        order.items.forEach((item: any) => {
          const cId = item.courseId;
          if (!user.enrolledCourseIds.includes(cId)) {
            user.enrolledCourseIds.push(cId);
          }
        });
        await user.save();
      }
    }

    // Increment course student count safely
    for (const item of order.items) {
      const isObjId = mongoose.Types.ObjectId.isValid(item.courseId);
      await Course.findOneAndUpdate(
        { $or: [...(isObjId ? [{ _id: item.courseId }] : []), { id: item.courseId }] },
        { $inc: { studentCount: 1 } }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
