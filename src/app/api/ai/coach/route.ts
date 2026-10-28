import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { generatePlan, getPlan } from '@/lib/agents/coach';

/** This week's study plan and activity streak. */
export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) throw new ApiError(401, 'Please sign in.');
    await requireDatabase();
    return NextResponse.json({ success: true, ...(await getPlan(user.userId)) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** (Re)builds this week's plan. */
export async function POST(request: Request) {
  try {
    const caller = await authorizeAI(request, { requireUser: true });
    await requireDatabase();
    return NextResponse.json({ success: true, ...(await generatePlan(caller.user!.userId)) });
  } catch (error) {
    return errorResponse(error);
  }
}
