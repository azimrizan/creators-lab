import { NextResponse } from 'next/server';
import { VISUAL_STORYTELLING_10_MCQS } from '@/lib/transcripts/visual-storytelling';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      questions: VISUAL_STORYTELLING_10_MCQS
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
