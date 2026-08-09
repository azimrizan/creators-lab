import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Course from '@/models/Course';

const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Cryptographic HMAC SHA256 verification
    if (signature && RAZORPAY_SECRET && !RAZORPAY_SECRET.includes('placeholder')) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_SECRET)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ success: false, error: 'Invalid HMAC webhook signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    await connectToDatabase();

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id || paymentEntity.id;

      // Idempotency Check: Find matching order
      const order = await Order.findOne({
        $or: [{ paymentId: razorpayOrderId }, { orderNumber: paymentEntity.notes?.orderNumber }]
      });

      if (order) {
        if (order.status === 'SUCCESSFUL') {
          return NextResponse.json({ success: true, message: 'Webhook already processed (idempotent)' });
        }

        // Fulfill order
        order.status = 'SUCCESSFUL';
        order.paymentId = paymentEntity.id || razorpayOrderId;
        await order.save();

        // Grant enrollment to user
        if (order.userId && order.userId !== 'guest') {
          const user = await User.findById(order.userId);
          if (user) {
            order.items.forEach((item: any) => {
              if (!user.enrolledCourseIds.includes(item.courseId)) {
                user.enrolledCourseIds.push(item.courseId);
              }
            });
            await user.save();
          }
        }

        // Increment student count
        for (const item of order.items) {
          await Course.findByIdAndUpdate(item.courseId, { $inc: { studentCount: 1 } });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
