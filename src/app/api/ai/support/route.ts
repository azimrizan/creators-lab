import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { authorizeAI, ApiError, errorResponse, requireDatabase } from '@/lib/ai/guard';
import { loadSupportHistory, supportTurn } from '@/lib/agents/support';

export async function GET(request: Request) {
  try {
    const user = getSessionUser(request);
    if (!user) return NextResponse.json({ success: true, history: [] });
    await requireDatabase();
    return NextResponse.json({ success: true, history: await loadSupportHistory(user.userId) });
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
      ? body.history.filter((h: { role: string; content: unknown }) => (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string').slice(-8)
      : [];
    const result = await supportTurn({ user: caller.user, userKey: caller.userKey, message, clientHistory });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
