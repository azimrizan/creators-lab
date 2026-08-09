import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Order from '@/models/Order';

export async function GET() {
  try {
    await connectToDatabase();

    const totalUsers = await User.countDocuments({});
    const totalCourses = await Course.countDocuments({});
    const publishedCourses = await Course.countDocuments({ status: 'PUBLISHED' });
    const successfulOrders = await Order.countDocuments({ status: 'SUCCESSFUL' });

    const salesAggregate = await Order.aggregate([
      { $match: { status: 'SUCCESSFUL' } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
    ]);

    const totalSales = salesAggregate.length > 0 ? salesAggregate[0].totalSales : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalSales,
        totalCourses,
        publishedCourses,
        totalUsers,
        successfulOrders
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
