import { NextResponse } from 'next/server';
import Certificate from '@/models/Certificate';
import { getSessionUser } from '@/lib/auth';
import { errorResponse, requireDatabase } from '@/lib/ai/guard';

/** Certificates earned by the signed-in learner. */
export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) return NextResponse.json({ success: true, certificates: [] });
    await requireDatabase();
    const certs = await Certificate.find({ userId: user.userId }).sort({ createdAt: -1 }).lean<Array<Record<string, unknown>>>();
    return NextResponse.json({
      success: true,
      certificates: certs.map(c => ({
        id: String(c._id),
        certificateNumber: c.certificateNumber,
        userId: c.userId,
        userName: c.userName,
        courseId: c.courseId,
        courseSlug: c.courseSlug,
        courseTitle: c.courseTitle,
        issueDate: c.issueDate,
        instructorName: c.instructorName
      }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}
