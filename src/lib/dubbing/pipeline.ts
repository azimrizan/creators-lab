import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import Transcript from '@/models/Transcript';
import DubTrack, { IDubTrackDocument } from '@/models/DubTrack';
import { connectToDatabase } from '@/lib/mongodb';
import { AIUnavailableError, chatJSON, transcribe, TRANSCRIBE_MODEL } from '@/lib/ai/groq';
import { ApiError, fence, UNTRUSTED_DATA_RULE } from '@/lib/ai/guard';
import { DubbingInfo, DubStatus, DubTrack as DubTrackInfo, DubVoice, findDubLanguage } from './languages';
import { deleteAudio, saveAudio } from './storage';

/**
 * Auto-dubbing: Whisper transcript (Groq) → line-by-line translation (Google Translate's free web
 * endpoint) → neural voice per line (Microsoft Edge TTS) → each line time-fitted to its original
 * slot → one AAC track per language, plus WebVTT subtitles.
 *
 * Every piece is free: translation and voices need no key or account, ffmpeg runs locally, and the
 * only Groq call (Whisper, once per video, cached) fits Groq's free plan. Set DUB_TRANSLATOR=groq to
 * translate with the Groq LLM instead (also sized for the free plan's ~8K tokens per minute).
 *
 * Job state and subtitles live in MongoDB and audio in storage.ts, so it works on serverless hosts
 * where each request may hit a different instance and the local disk is temporary.
 */

const SAMPLE_RATE = 24000;
// Speed a line up by at most this much to fit before the next line; beyond it the line spills over.
const MAX_TEMPO = 1.6;
// Volume of the original soundtrack under the dub. 0 by default: it carries the original speech.
const BACKGROUND_VOLUME = Number(process.env.DUB_BACKGROUND_VOLUME ?? 0);
const TTS_WORKERS = 4;
// Small batches keep each translation request well inside the free plan's per-minute token budget.
const TRANSLATE_BATCH = 12;
// Google Translate request size; lines are sent newline-joined and split back apart.
const GOOGLE_BATCH_CHARS = 3500;
// On the free plan a long lesson hits the per-minute limit; the job waits it out instead of failing.
const RATE_LIMIT_WAIT_MS = 65_000;
const RATE_LIMIT_RETRIES = 6;
// A running job updates its progress at least every few minutes; one silent for longer has died
// (server restart or the host's time limit).
const STALE_AFTER_MS = 10 * 60_000;

interface Segment { start: number; end: number; text: string }
interface CachedTranscript { language: string; durationSec: number; segments: Segment[] }

export const mediaId = (videoUrl: string) => createHash('sha1').update(videoUrl).digest('hex').slice(0, 16);
const workDir = (id: string) => path.join(os.tmpdir(), 'creators-lab-dubs', id);

function ffmpegBin(): string {
  return process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';
}

function runFfmpeg(args: string[], input?: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegBin(), ['-hide_banner', '-loglevel', 'error', ...args]);
    const out: Buffer[] = [];
    let err = '';
    proc.stdout.on('data', d => out.push(d));
    proc.stderr.on('data', d => { err += d; });
    proc.on('error', reject);
    proc.on('close', code => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`ffmpeg failed: ${err.slice(-400)}`))));
    if (input) proc.stdin.end(input);
    else proc.stdin.end();
  });
}

/**
 * ffmpeg input for a lesson video: the file under /public when it's on disk (local dev), otherwise
 * its public URL (on Vercel, /public is served by the CDN and isn't in the function's filesystem).
 */
async function resolveInput(videoUrl: string, origin: string): Promise<string> {
  if (videoUrl.startsWith('/')) {
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.resolve(publicDir, '.' + decodeURIComponent(videoUrl));
    if (!filePath.startsWith(publicDir + path.sep)) throw new ApiError(400, 'Invalid video path.');
    if (await fs.stat(filePath).catch(() => null)) return filePath;
    return origin + encodeURI(decodeURI(videoUrl));
  }
  if (/^https?:\/\//i.test(videoUrl)) return videoUrl;
  throw new ApiError(400, 'Unsupported video URL.');
}

const isRunning = (doc: Pick<IDubTrackDocument, 'status' | 'updatedAt'>) =>
  doc.status !== 'ready' && doc.status !== 'failed' && Date.now() - new Date(doc.updatedAt).getTime() < STALE_AFTER_MS;

async function setTrack(mediaKey: string, language: string, patch: Partial<Pick<IDubTrackDocument, 'voice' | 'status' | 'progress' | 'error' | 'audioUrl' | 'subtitles'>>) {
  await DubTrack.updateOne({ mediaKey, language }, { $set: patch }, { upsert: true });
}

const subtitlesUrl = (videoUrl: string, lang: string, version: string | number) =>
  `/api/dubbing/subtitles?video=${encodeURIComponent(videoUrl)}&lang=${lang}&v=${version}`;

/** Every track generated (or being generated) for a video. Empty when the database is unavailable. */
export async function getDubbingInfo(videoUrl: string): Promise<DubbingInfo> {
  try {
    await connectToDatabase();
  } catch {
    return { sourceLanguage: 'en', tracks: [] };
  }
  const [docs, transcript] = await Promise.all([
    DubTrack.find({ mediaKey: videoUrl }).select('-subtitles').lean<IDubTrackDocument[]>(),
    Transcript.findOne({ mediaKey: videoUrl }).select('language').lean<{ language: string }>()
  ]);
  const tracks: DubTrackInfo[] = docs.map(doc => {
    const failedSilently = doc.status !== 'ready' && doc.status !== 'failed' && !isRunning(doc);
    const version = new Date(doc.updatedAt).getTime();
    return {
      language: doc.language,
      voice: doc.voice,
      status: failedSilently ? 'failed' : doc.status,
      progress: doc.progress,
      error: failedSilently ? 'Stopped before finishing. Start it again.' : doc.error || undefined,
      updatedAt: new Date(doc.updatedAt).toISOString(),
      ...(doc.status === 'ready' && doc.audioUrl && { audioUrl: doc.audioUrl, subtitlesUrl: subtitlesUrl(videoUrl, doc.language, version) })
    };
  });
  return {
    sourceLanguage: transcript?.language || 'en',
    ...(transcript && { sourceSubtitlesUrl: subtitlesUrl(videoUrl, 'source', 1) }),
    tracks: tracks.sort((a, b) => a.language.localeCompare(b.language))
  };
}

/** WebVTT subtitles for a video: lang "source" is the original transcript, otherwise a dubbed language. */
export async function getSubtitles(videoUrl: string, lang: string): Promise<string | null> {
  await connectToDatabase();
  if (lang === 'source') {
    const transcript = await Transcript.findOne({ mediaKey: videoUrl }).lean<CachedTranscript>();
    return transcript?.segments?.length ? toVtt(transcript.segments, transcript.segments.map(s => s.text)) : null;
  }
  const doc = await DubTrack.findOne({ mediaKey: videoUrl, language: lang, status: 'ready' }).select('subtitles').lean<{ subtitles?: string }>();
  return doc?.subtitles || null;
}

export async function deleteDub(videoUrl: string, lang: string) {
  const doc = await DubTrack.findOne({ mediaKey: videoUrl, language: lang }).lean<IDubTrackDocument>();
  if (!doc) return;
  if (isRunning(doc)) throw new ApiError(409, 'This track is still being generated.');
  await deleteAudio(doc.audioUrl);
  await DubTrack.deleteOne({ mediaKey: videoUrl, language: lang });
}

/**
 * Validates the request and marks the track queued. Returns the job to run after the response
 * is sent (it takes a few minutes), or throws if the language is unknown or already being generated.
 * `origin` is the site's base URL, used to fetch videos that aren't on this server's disk.
 */
export async function queueDub(opts: { videoUrl: string; language: string; voice: DubVoice; userKey: string; origin: string }): Promise<() => Promise<void>> {
  const language = findDubLanguage(opts.language);
  if (!language) throw new ApiError(400, 'Unsupported language.');
  const input = await resolveInput(opts.videoUrl, opts.origin);
  const mediaKey = opts.videoUrl;
  const id = mediaId(mediaKey);

  const existing = await DubTrack.findOne({ mediaKey, language: language.code }).lean<IDubTrackDocument>();
  if (existing && isRunning(existing)) throw new ApiError(409, `${language.label} is already being generated.`);
  await setTrack(mediaKey, language.code, { voice: opts.voice, status: 'queued', progress: 0, error: '' });

  return async () => {
    const setStatus = (status: DubStatus, progress: number) => setTrack(mediaKey, language.code, { status, progress });
    let outFile: string | null = null;
    try {
      await setStatus('transcribing', 2);
      const transcript = await loadTranscript(mediaKey, input, id, opts.userKey);
      if (!transcript.segments.length) throw new ApiError(422, 'No speech was found in this video.');

      await setStatus('translating', 8);
      const onTranslateProgress = (p: number) => setStatus('translating', 8 + Math.round(p * 27));
      // Google's free endpoint rate-limits busy IPs; when it refuses, translate with Groq instead.
      const withGroq = () => translateSegments(transcript.segments, language.label, opts.userKey, onTranslateProgress);
      const translated = process.env.DUB_TRANSLATOR === 'groq'
        ? await withGroq()
        : await translateWithGoogle(transcript.segments, language.code, onTranslateProgress).catch(err => {
          console.warn(`[dubbing] Google Translate unavailable (${err instanceof Error ? err.message : err}); using Groq`);
          return withGroq();
        });

      await setStatus('voicing', 35);
      const voiceTrack = await synthesizeTrack(transcript, translated, language.voices[opts.voice], p => setStatus('voicing', 35 + Math.round(p * 55)));

      await setStatus('mixing', 92);
      outFile = await mixTrack(id, language.code, input, voiceTrack);
      const audioUrl = await saveAudio(id, language.code, outFile);
      await setTrack(mediaKey, language.code, { status: 'ready', progress: 100, error: '', audioUrl, subtitles: toVtt(transcript.segments, translated) });
      if (existing?.audioUrl && existing.audioUrl !== audioUrl) await deleteAudio(existing.audioUrl);
    } catch (err) {
      console.error(`[dubbing] ${language.code} failed for ${mediaKey}`, err);
      const message = err instanceof Error ? err.message : 'Dubbing failed.';
      await setTrack(mediaKey, language.code, { status: 'failed', error: message.slice(0, 300) }).catch(() => {});
    } finally {
      if (outFile) await fs.rm(outFile, { force: true }).catch(() => {});
    }
  };
}

/** Reuses the video's saved transcript (shared with AI Studio); otherwise transcribes the audio once and saves it. */
async function loadTranscript(mediaKey: string, input: string, id: string, userKey: string): Promise<CachedTranscript> {
  const saved = await Transcript.findOne({ mediaKey }).lean<CachedTranscript>();
  if (saved?.segments?.length) return { language: saved.language, durationSec: saved.durationSec, segments: saved.segments };

  // Audio only, mono 32kbps: about 4KB per second, so even long lessons fit Whisper's upload limit.
  const audio = await runFfmpeg(['-i', input, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k', '-f', 'mp3', 'pipe:1']);
  const result = await waitOutRateLimits(() => transcribe(new Blob([new Uint8Array(audio)]), `${id}.mp3`, userKey));
  const transcript = { language: result.language, durationSec: result.duration, segments: result.segments.filter(s => s.text) };
  await Transcript.updateOne({ mediaKey }, { $set: { ...transcript, aiModel: TRANSCRIBE_MODEL } }, { upsert: true });
  return transcript;
}

/** Retries a Groq call after a pause when it fails, which on the free plan is almost always a rate limit. */
async function waitOutRateLimits<T>(call: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call();
    } catch (err) {
      if (!(err instanceof AIUnavailableError) || attempt >= RATE_LIMIT_RETRIES) throw err;
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WAIT_MS));
    }
  }
}

async function googleTranslate(text: string, target: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `q=${encodeURIComponent(text)}`,
      signal: AbortSignal.timeout(30_000)
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      return (data?.[0] || []).map((part: [string]) => part[0] || '').join('');
    }
    if (attempt >= 4) throw new Error('The translation service did not respond. Please try again later.');
    await new Promise(resolve => setTimeout(resolve, 2000 * 2 ** attempt));
  }
}

/** Free translation: batches of newline-joined lines; a batch that comes back with a different line count is redone line by line. */
async function translateWithGoogle(segments: Segment[], target: string, onProgress: (p: number) => Promise<void>): Promise<string[]> {
  const out: string[] = [];
  let i = 0;
  while (i < segments.length) {
    const batch: string[] = [];
    let chars = 0;
    while (i + batch.length < segments.length && (batch.length === 0 || chars + segments[i + batch.length].text.length < GOOGLE_BATCH_CHARS)) {
      const line = segments[i + batch.length].text.replace(/\s+/g, ' ').trim();
      batch.push(line);
      chars += line.length + 1;
    }
    let lines = (await googleTranslate(batch.join('\n'), target)).split('\n').map(l => l.trim());
    if (lines.length !== batch.length) {
      lines = [];
      for (const line of batch) lines.push((await googleTranslate(line, target)).replace(/\s+/g, ' ').trim());
    }
    out.push(...lines);
    i += batch.length;
    await onProgress(out.length / segments.length);
  }
  return out;
}

async function translateSegments(segments: Segment[], languageLabel: string, userKey: string, onProgress: (p: number) => Promise<void>): Promise<string[]> {
  const out: string[] = new Array(segments.length).fill('');
  let translatedCount = 0;
  for (let i = 0; i < segments.length; i += TRANSLATE_BATCH) {
    // Lines carry their number so a merged or dropped line can be detected and asked for again.
    let pending = segments.slice(i, i + TRANSLATE_BATCH).map((s, j) => ({ n: i + j + 1, seconds: Math.max(0.5, s.end - s.start).toFixed(1), text: s.text }));
    for (let attempt = 0; attempt < 3 && pending.length; attempt++) {
      const result = await waitOutRateLimits(() => chatJSON<{ translations: Array<{ n: number; text: string }> }>({
        agent: 'dubbing',
        userKey,
        tier: 'reasoning',
        reasoningEffort: 'low',
        maxTokens: 4000,
        temperature: 0.2,
        schemaName: 'dub_translation',
        schema: {
          type: 'object',
          properties: {
            translations: {
              type: 'array',
              items: {
                type: 'object',
                properties: { n: { type: 'integer' }, text: { type: 'string' } },
                required: ['n', 'text'],
                additionalProperties: false
              }
            }
          },
          required: ['translations'],
          additionalProperties: false
        },
        messages: [
          {
            role: 'system',
            content: [
              `You translate lesson narration into ${languageLabel} for a voice-over dub of a creative-skills course video.`,
              'Rules:',
              `- Return one translation for every input line (${pending.length} in total), each with the same "n" as its input line. Never merge or split lines.`,
              '- Write natural, spoken, conversational language as a native teacher would say it aloud, not formal written text.',
              '- Each line must be speakable in about the given number of seconds, so keep it about as short as the original.',
              '- Keep widely used technical terms (lens, ISO, shutter speed, frame, timeline, render, etc.) in the form native speakers actually use, usually the English word written in the target script.',
              '- Lines may be fragments of a sentence that continues on the next line; translate the fragment so the joined lines read naturally.',
              '- Output only the translated words: no numbering, notes or quotes.',
              UNTRUSTED_DATA_RULE
            ].join('\n')
          },
          { role: 'user', content: fence('transcript', JSON.stringify(pending)) }
        ]
      }));
      for (const t of result.translations || []) {
        const text = String(t.text || '').trim();
        if (text && pending.some(p => p.n === t.n) && !out[t.n - 1]) {
          out[t.n - 1] = text;
          translatedCount++;
        }
      }
      pending = pending.filter(p => !out[p.n - 1]);
    }
    if (pending.length) throw new Error('Some lines could not be translated. Please try again.');
    await onProgress(Math.min(1, translatedCount / segments.length));
  }
  return out;
}

async function speak(tts: MsEdgeTTS, text: string): Promise<Buffer> {
  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

/** Voices every line and places it on a single PCM timeline at its original start time. */
async function synthesizeTrack(transcript: CachedTranscript, lines: string[], voiceName: string, onProgress: (p: number) => Promise<void>): Promise<Buffer> {
  const segs = transcript.segments;
  const clips: Array<Buffer | null> = new Array(segs.length).fill(null);
  let next = 0;
  let done = 0;

  const newVoice = async () => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    return tts;
  };

  const worker = async () => {
    let tts = await newVoice();
    try {
      while (next < segs.length) {
        const i = next++;
        const text = lines[i];
        if (text) {
          let mp3: Buffer | null = null;
          for (let attempt = 0; attempt < 3 && !mp3?.length; attempt++) {
            try {
              mp3 = await speak(tts, text);
            } catch {
              tts.close();
              tts = await newVoice();
            }
          }
          if (!mp3?.length) throw new Error('The voice service did not respond. Please try again later.');
          clips[i] = await runFfmpeg(['-f', 'mp3', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE), 'pipe:1'], mp3);
        }
        done++;
        if (done % 5 === 0) await onProgress(done / segs.length);
      }
    } finally {
      tts.close();
    }
  };
  await Promise.all(Array.from({ length: Math.min(TTS_WORKERS, segs.length) }, worker));

  // Lay clips out in order. Each clip starts at its line's original time (or right after the previous
  // clip if that one ran long) and is sped up to end before the next line starts, so a long
  // translation can't push every later line out of sync.
  const bytesPerSec = SAMPLE_RATE * 2;
  const placed: Array<{ offset: number; pcm: Buffer }> = [];
  let cursor = 0;
  for (let i = 0; i < segs.length; i++) {
    let pcm = clips[i];
    if (!pcm) continue;
    const offset = Math.max(Math.round(segs[i].start * bytesPerSec) & ~1, cursor);
    const deadline = (segs[i + 1]?.start ?? Math.max(transcript.durationSec || 0, segs[i].end)) * bytesPerSec;
    const tempo = Math.min(MAX_TEMPO, pcm.length / Math.max(deadline - offset, 0.4 * bytesPerSec));
    if (tempo > 1.01) {
      pcm = await runFfmpeg(['-f', 's16le', '-ar', String(SAMPLE_RATE), '-ac', '1', '-i', 'pipe:0', '-af', `atempo=${tempo.toFixed(3)}`, '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE), 'pipe:1'], pcm);
    }
    placed.push({ offset, pcm });
    cursor = offset + pcm.length;
  }
  const total = Math.max(cursor, Math.round((transcript.durationSec || 0) * bytesPerSec) & ~1);
  const timeline = Buffer.alloc(total);
  for (const { offset, pcm } of placed) pcm.copy(timeline, offset);
  return timeline;
}

/** Encodes the voice track to AAC in a temp folder (optionally over the ducked original soundtrack); returns the file path. */
async function mixTrack(id: string, lang: string, input: string, voicePcm: Buffer): Promise<string> {
  const dir = workDir(id);
  await fs.mkdir(dir, { recursive: true });
  const rawFile = path.join(dir, `${lang}.voice.raw`);
  const outFile = path.join(dir, `${lang}.m4a`);
  await fs.writeFile(rawFile, voicePcm);
  const voiceIn = ['-f', 's16le', '-ar', String(SAMPLE_RATE), '-ac', '1', '-i', rawFile];
  const encode = ['-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-y', outFile];
  try {
    if (BACKGROUND_VOLUME > 0) {
      try {
        await runFfmpeg([
          ...voiceIn,
          '-i', input,
          '-filter_complex',
          `[0:a]aformat=sample_rates=44100:channel_layouts=stereo[v];[1:a]volume=${BACKGROUND_VOLUME},aformat=sample_rates=44100:channel_layouts=stereo[bg];[v][bg]amix=inputs=2:duration=longest:normalize=0[out]`,
          '-map', '[out]',
          ...encode
        ]);
      } catch {
        await runFfmpeg([...voiceIn, '-ar', '44100', ...encode]);
      }
    } else {
      await runFfmpeg([...voiceIn, '-ar', '44100', ...encode]);
    }
    return outFile;
  } finally {
    await fs.rm(rawFile, { force: true });
  }
}

function vttTime(sec: number) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}

function toVtt(segments: Segment[], lines: string[]) {
  const cues = segments
    .map((s, i) => (lines[i] ? `${vttTime(s.start)} --> ${vttTime(Math.max(s.end, s.start + 0.5))}\n${lines[i].replace(/-->/g, '→')}` : ''))
    .filter(Boolean);
  return `WEBVTT\n\n${cues.join('\n\n')}\n`;
}
