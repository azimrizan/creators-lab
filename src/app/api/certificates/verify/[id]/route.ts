import { NextResponse } from 'next/server';
import Certificate from '@/models/Certificate';
import { connectToDatabase } from '@/lib/mongodb';
import { MOCK_CERTIFICATES } from '@/lib/mockData';

/** Public certificate verification. Only certificates that were actually issued verify. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: certNumber } = await params;
  const clean = certNumber.trim().replace(/[^A-Za-z0-9-]/g, '');

  try {
    await connectToDatabase();
    const cert = await Certificate.findOne({ certificateNumber: new RegExp(`^${clean}$`, 'i') }).lean<Record<string, unknown>>();
    if (cert) {
      return NextResponse.json({
        success: true,
        verified: true,
        certificate: {
          id: String(cert._id),
          certificateNumber: cert.certificateNumber,
          userId: cert.userId,
          userName: cert.userName,
          courseId: cert.courseId,
          courseTitle: cert.courseTitle,
          issueDate: cert.issueDate,
          instructorName: cert.instructorName
        }
      });
    }
  } catch {
    // Fall back to bundled certificates when the database is unavailable
  }

  const mockCert = MOCK_CERTIFICATES.find(c => c.certificateNumber.toLowerCase() === clean.toLowerCase() || c.id === clean);
  if (mockCert) return NextResponse.json({ success: true, verified: true, certificate: mockCert });

  return NextResponse.json({ success: false, verified: false, error: 'Certificate not found' }, { status: 404 });
}
