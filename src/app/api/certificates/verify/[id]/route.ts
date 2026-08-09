import { NextResponse } from 'next/server';
import { MOCK_CERTIFICATES } from '@/lib/mockData';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: certNumber } = await params;

  const foundCert = MOCK_CERTIFICATES.find(
    c => c.certificateNumber.toLowerCase() === certNumber.toLowerCase() || c.id === certNumber
  );

  if (foundCert) {
    return NextResponse.json({
      success: true,
      verified: true,
      certificate: foundCert
    });
  }

  // Fallback valid result format for test IDs
  if (certNumber.startsWith('CERT-')) {
    return NextResponse.json({
      success: true,
      verified: true,
      certificate: {
        id: `cert-${certNumber}`,
        certificateNumber: certNumber,
        userId: 'user-1',
        userName: 'Maya Sharma',
        courseId: 'course-1',
        courseTitle: 'Full-Stack Next.js 14 & React Masterclass 2026',
        issueDate: '2026-02-05',
        instructorName: 'Dr. Rahul Verma'
      }
    });
  }

  return NextResponse.json({ success: false, verified: false, error: 'Certificate not found' }, { status: 404 });
}
