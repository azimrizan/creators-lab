import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { conciergeState, conciergeTurn, dismissOnboarding, loadConciergeHistory } from '@/lib/agents/concierge';

/** Onboarding status, welcome-back message and saved conversation for the agent dock. */
export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) return NextResponse.json({ success: true, needsOnboarding: false, profile: null, welcome: null, history: [] });
    await requireDatabase();
    const [state, history] = await Promise.all([conciergeState(user), loadConciergeHistory(user.userId)]);
    return NextResponse.json({ success: true, ...state, history });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const caller = await authorizeAI(request);
    const body = await request.json();
    const message = String(body.message || '').trim();
    if (!message) throw new ApiError(400, 'Message is required.');
    if (message.length > 2000) throw new ApiError(400, 'Message is too long.');
    if (caller.user) await requireDatabase();

    const clientHistory = Array.isArray(body.history)
      ? body.history.filter((h: { role: string; content: unknown }) => (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string').slice(-10)
      : [];

    const result = await conciergeTurn({
      user: caller.user,
      userKey: caller.userKey,
      message,
      clientHistory,
      mode: body.mode === 'onboarding' ? 'onboarding' : 'chat'
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

/** "Not now" on the onboarding popup. */
export async function PATCH(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) throw new ApiError(401, 'Please sign in.');
    await requireDatabase();
    await dismissOnboarding(user.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
