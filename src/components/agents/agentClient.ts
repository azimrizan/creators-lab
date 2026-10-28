'use client';

/** Small fetch helpers for the AI agent endpoints, returning readable errors. */

export class AgentRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function agentGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new AgentRequestError(data.error || 'Request failed', res.status);
  return data as T;
}

export async function agentSend<T>(url: string, body: unknown, method: 'POST' | 'PATCH' = 'POST'): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new AgentRequestError(data.error || 'Request failed', res.status);
  return data as T;
}

export interface TutorSource {
  lessonId: string;
  lessonTitle: string;
  startSec: number;
  topic: string;
}

/** Streams a tutor answer, calling back as sources and text arrive. */
export async function streamTutor(
  body: { courseId: string; lessonId?: string; atSec?: number; message: string; history?: Array<{ role: string; content: string }> },
  handlers: { onSources: (s: TutorSource[]) => void; onDelta: (text: string) => void }
): Promise<void> {
  const res = await fetch('/api/ai/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new AgentRequestError(data.error || 'The tutor is unavailable right now.', res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === 'sources') handlers.onSources(event.sources || []);
      else if (event.type === 'delta') handlers.onDelta(event.text || '');
      else if (event.type === 'error') throw new AgentRequestError(event.error, 503);
    }
  }
}
