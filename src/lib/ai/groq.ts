import { recordUsage } from './guard';
import { AIUnavailableError } from './errors';

export { AIUnavailableError };

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export type ModelTier = 'fast' | 'reasoning';

export function modelFor(tier: ModelTier): string {
  return tier === 'reasoning'
    ? process.env.GROQ_REASONING_MODEL || 'openai/gpt-oss-120b'
    : process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b';
}

export const TRANSCRIBE_MODEL = process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolDefinition<A = Record<string, unknown>> {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: A) => Promise<unknown>;
}

interface BaseOptions {
  agent: string;
  userKey: string;
  tier: ModelTier;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

interface ChatOptions extends BaseOptions {
  tools?: ToolDefinition[];
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

interface ChatResult {
  content: string;
  toolCalls: ToolCall[];
  model: string;
}

function apiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new AIUnavailableError('AI is not configured: GROQ_API_KEY is missing.');
  return key;
}

function buildBody(opts: ChatOptions, stream: boolean) {
  const model = modelFor(opts.tier);
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    max_completion_tokens: opts.maxTokens ?? 1200,
    temperature: opts.temperature ?? 0.4,
    reasoning_effort: opts.reasoningEffort ?? (opts.tier === 'fast' ? 'low' : 'medium'),
    include_reasoning: false,
    stream
  };
  if (opts.tools?.length) {
    body.tools = opts.tools.map(t => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters }
    }));
    body.tool_choice = 'auto';
  }
  if (opts.jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: opts.jsonSchema.name, strict: true, schema: opts.jsonSchema.schema }
    };
  }
  return { body, model };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** POST to Groq with retries on rate limits (429) and server errors (5xx). */
async function groqFetch(path: string, init: { body: BodyInit; headers?: Record<string, string> }, attempts = 3): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(`${GROQ_BASE_URL}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey()}`, ...(init.headers || {}) },
        body: init.body,
        signal: AbortSignal.timeout(90_000)
      });
      if (res.ok) return res;

      const detail = await res.text().catch(() => '');
      // Rate limits, server errors, and the occasional output that misses the JSON schema are worth retrying.
      const retryable = res.status === 429 || res.status >= 500 || (res.status === 400 && detail.includes('json_validate_failed'));
      lastError = new Error(`Groq ${res.status}: ${detail.slice(0, 300)}`);
      if (!retryable) break;

      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 800 * 2 ** attempt);
    } catch (err) {
      if (err instanceof AIUnavailableError) throw err;
      lastError = err;
      await sleep(800 * 2 ** attempt);
    }
  }
  console.error('[groq] request failed', lastError);
  throw new AIUnavailableError();
}

/** Single chat completion (optionally with tools or a strict JSON schema). */
export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const { body, model } = buildBody(opts, false);
  let ok = false;
  let usage = { prompt_tokens: 0, completion_tokens: 0 };
  try {
    const res = await groqFetch('/chat/completions', {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    usage = data.usage || usage;
    const message = data.choices?.[0]?.message || {};
    ok = true;
    return { content: message.content || '', toolCalls: message.tool_calls || [], model };
  } finally {
    recordUsage({ userKey: opts.userKey, agent: opts.agent, model, promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, ok });
  }
}

/** Chat completion constrained to a JSON schema, parsed into T. Retries once on invalid JSON. */
export async function chatJSON<T>(opts: Omit<ChatOptions, 'tools' | 'jsonSchema'> & { schemaName: string; schema: Record<string, unknown> }): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await chat({ ...opts, jsonSchema: { name: opts.schemaName, schema: opts.schema } });
    try {
      return JSON.parse(result.content) as T;
    } catch {
      console.warn(`[groq] invalid JSON from ${opts.agent}, retrying`);
    }
  }
  throw new AIUnavailableError('The AI returned an unreadable answer. Please try again.');
}

/**
 * Runs a tool-calling loop: the model may call tools (executed server-side) until it
 * produces a final text answer or the step limit is reached.
 */
export async function runAgent(opts: ChatOptions & { maxSteps?: number }): Promise<{ content: string; toolResults: Array<{ name: string; args: unknown; result: unknown }> }> {
  const messages = [...opts.messages];
  const toolResults: Array<{ name: string; args: unknown; result: unknown }> = [];
  const maxSteps = opts.maxSteps ?? 4;

  for (let step = 0; step < maxSteps; step++) {
    const isLastStep = step === maxSteps - 1;
    const result = await chat({ ...opts, messages, tools: isLastStep ? undefined : opts.tools });

    if (!result.toolCalls.length) {
      if (process.env.AI_DEBUG === '1') console.log(`[agent:${opts.agent}] final after ${step} tool step(s):`, result.content.slice(0, 300));
      return { content: result.content, toolResults };
    }

    messages.push({ role: 'assistant', content: result.content || null, tool_calls: result.toolCalls });

    for (const call of result.toolCalls) {
      const tool = opts.tools?.find(t => t.name === call.function.name);
      let output: unknown;
      let args: Record<string, unknown> = {};
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        output = tool ? await tool.handler(args) : { error: `Unknown tool ${call.function.name}` };
      } catch (err) {
        output = { error: err instanceof Error ? err.message : 'Tool failed' };
      }
      toolResults.push({ name: call.function.name, args, result: output });
      if (process.env.AI_DEBUG === '1') console.log(`[agent:${opts.agent}] tool ${call.function.name}`, JSON.stringify(args).slice(0, 300), '->', JSON.stringify(output).slice(0, 300));
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(output).slice(0, 6000) });
    }
  }

  return { content: '', toolResults };
}

/** Streams the text of a chat completion as it is generated. */
export async function* chatStream(opts: BaseOptions): AsyncGenerator<string> {
  const { body, model } = buildBody(opts, true);
  body.stream_options = { include_usage: true };
  let ok = false;
  let usage = { prompt_tokens: 0, completion_tokens: 0 };

  try {
    const res = await groqFetch('/chat/completions', {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.body) throw new AIUnavailableError();

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
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const chunk = JSON.parse(payload);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) yield delta;
          const chunkUsage = chunk.usage || chunk.x_groq?.usage;
          if (chunkUsage) usage = chunkUsage;
        } catch {
          // Ignore keep-alive or partial lines
        }
      }
    }
    ok = true;
  } finally {
    recordUsage({ userKey: opts.userKey, agent: opts.agent, model, promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, ok });
  }
}

export interface WhisperResult {
  language: string;
  duration: number;
  segments: Array<{ start: number; end: number; text: string }>;
}

/** Transcribes an audio/video file with Groq Whisper, returning timestamped segments. */
export async function transcribe(file: Blob, filename: string, userKey: string): Promise<WhisperResult> {
  const form = new FormData();
  form.append('file', file, filename);
  form.append('model', TRANSCRIBE_MODEL);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment');

  let ok = false;
  try {
    const res = await groqFetch('/audio/transcriptions', { body: form });
    const data = await res.json();
    ok = true;
    return {
      language: data.language || 'en',
      duration: data.duration || 0,
      segments: (data.segments || []).map((s: { start: number; end: number; text: string }) => ({
        start: s.start,
        end: s.end,
        text: (s.text || '').trim()
      }))
    };
  } finally {
    recordUsage({ userKey, agent: 'transcribe', model: TRANSCRIBE_MODEL, promptTokens: 0, completionTokens: 0, ok });
  }
}
