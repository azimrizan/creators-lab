import TranscriptChunk from '@/models/TranscriptChunk';

/**
 * Transcript search with BM25 (keyword ranking). Groq has no embedding model, and for
 * lecture transcripts keyword ranking plus "what's playing right now" works well.
 */

export interface RetrievedChunk {
  id: string;
  lessonId: string;
  order: number;
  startSec: number;
  endSec: number;
  topic: string;
  text: string;
  score: number;
}

const STOPWORDS = new Set(
  'a an and are as at be but by can could did do does for from had has have he her his how i if in into is it its just me my of on or our she so than that the their them then there these they this to too us was we were what when where which who why will with would you your about also any been being more most much should some such very what\'s whats explain tell mean means meant said says say'.split(' ')
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

/** Very light stemming so "lenses"/"lens" and "framing"/"frame" match. */
function stem(token: string): string {
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  return token;
}

interface IndexedCourse {
  loadedAt: number;
  chunks: Array<Omit<RetrievedChunk, 'score'> & { terms: Map<string, number>; length: number }>;
  docFreq: Map<string, number>;
  avgLength: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const courseIndex = new Map<string, IndexedCourse>();

export function invalidateCourseIndex(courseSlug: string) {
  courseIndex.delete(courseSlug);
}

async function loadIndex(courseSlug: string): Promise<IndexedCourse> {
  const cached = courseIndex.get(courseSlug);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return cached;

  const docs = await TranscriptChunk.find({ courseSlug }).sort({ lessonId: 1, order: 1 }).lean();
  const docFreq = new Map<string, number>();
  const chunks = docs.map(d => {
    const tokens = tokenize(`${d.topic} ${d.text}`);
    const terms = new Map<string, number>();
    tokens.forEach(t => terms.set(t, (terms.get(t) || 0) + 1));
    terms.forEach((_, t) => docFreq.set(t, (docFreq.get(t) || 0) + 1));
    return {
      id: String(d._id),
      lessonId: d.lessonId,
      order: d.order,
      startSec: d.startSec,
      endSec: d.endSec,
      topic: d.topic,
      text: d.text,
      terms,
      length: tokens.length
    };
  });
  const avgLength = chunks.reduce((sum, c) => sum + c.length, 0) / Math.max(1, chunks.length);
  const index = { loadedAt: Date.now(), chunks, docFreq, avgLength };
  courseIndex.set(courseSlug, index);
  return index;
}

/**
 * Returns the best-matching transcript passages for a question. Passages from the lesson
 * the learner is watching get a small boost.
 */
export async function searchTranscript(
  courseSlug: string,
  query: string,
  opts: { lessonId?: string; limit?: number } = {}
): Promise<RetrievedChunk[]> {
  const index = await loadIndex(courseSlug);
  if (!index.chunks.length) return [];

  const queryTerms = Array.from(new Set(tokenize(query)));
  const N = index.chunks.length;
  const k1 = 1.4;
  const b = 0.75;

  const scored = index.chunks.map(chunk => {
    let score = 0;
    for (const term of queryTerms) {
      const tf = chunk.terms.get(term) || 0;
      if (!tf) continue;
      const df = index.docFreq.get(term) || 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * chunk.length) / index.avgLength)));
    }
    if (score > 0 && opts.lessonId && chunk.lessonId === opts.lessonId) score *= 1.25;
    return { chunk, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, opts.limit ?? 5)
    .map(({ chunk, score }) => ({
      id: chunk.id,
      lessonId: chunk.lessonId,
      order: chunk.order,
      startSec: chunk.startSec,
      endSec: chunk.endSec,
      topic: chunk.topic,
      text: chunk.text,
      score
    }));
}

/** The passage playing at a given second of a lesson (for "what did he mean just now?"). */
export async function chunkAt(courseSlug: string, lessonId: string, atSec: number): Promise<RetrievedChunk | null> {
  const index = await loadIndex(courseSlug);
  const lessonChunks = index.chunks.filter(c => c.lessonId === lessonId);
  const match = lessonChunks.find(c => atSec >= c.startSec && atSec < c.endSec) || lessonChunks[lessonChunks.length - 1];
  if (!match) return null;
  return { id: match.id, lessonId: match.lessonId, order: match.order, startSec: match.startSec, endSec: match.endSec, topic: match.topic, text: match.text, score: 0 };
}

/** All passages of one lesson in order (used for content generation). */
export async function lessonChunks(courseSlug: string, lessonId: string): Promise<RetrievedChunk[]> {
  const index = await loadIndex(courseSlug);
  return index.chunks
    .filter(c => c.lessonId === lessonId)
    .map(c => ({ id: c.id, lessonId: c.lessonId, order: c.order, startSec: c.startSec, endSec: c.endSec, topic: c.topic, text: c.text, score: 0 }));
}
