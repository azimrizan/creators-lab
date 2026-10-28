/**
 * One-time move of dub tracks generated locally (./storage/dubs) into MongoDB, and into Vercel Blob
 * when BLOB_READ_WRITE_TOKEN is set, so the deployed site can play them.
 *
 *   npm run dubs:upload
 */
import path from 'path';
import { createHash } from 'crypto';
import { promises as fs, createReadStream } from 'fs';
import mongoose from 'mongoose';
import { put } from '@vercel/blob';

const DIR = process.env.DUB_STORAGE_DIR || path.join(process.cwd(), 'storage', 'dubs');
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const mediaId = url => createHash('sha1').update(url).digest('hex').slice(0, 16);

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Run this with: npm run dubs:upload');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

// Local folders are named by a hash of the lesson video URL; find which URL each one belongs to.
const courses = await db.collection('courses').find({}, { projection: { sections: 1, previewVideoUrl: 1 } }).toArray();
const videoUrls = new Set(courses.flatMap(c => [c.previewVideoUrl, ...(c.sections || []).flatMap(s => (s.lessons || []).map(l => l.videoUrl))]).filter(Boolean));
const byId = new Map([...videoUrls].map(url => [mediaId(url), url]));

console.log(`Storage: ${useBlob ? 'Vercel Blob' : 'local disk (set BLOB_READ_WRITE_TOKEN to upload to Vercel Blob)'}`);
let moved = 0;
for (const id of await fs.readdir(DIR).catch(() => [])) {
  const mediaKey = byId.get(id);
  if (!mediaKey) {
    console.log(`- ${id}: no lesson uses this video any more, skipped`);
    continue;
  }
  const dir = path.join(DIR, id);

  const transcript = JSON.parse(await fs.readFile(path.join(dir, 'transcript.json'), 'utf8').catch(() => 'null'));
  if (transcript?.segments?.length) {
    await db.collection('transcripts').updateOne(
      { mediaKey },
      { $setOnInsert: { mediaKey, language: transcript.language, durationSec: transcript.durationSec, segments: transcript.segments, aiModel: 'whisper-large-v3-turbo', createdAt: new Date() }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  }

  for (const name of await fs.readdir(dir)) {
    const match = name.match(/^([a-z]{2})\.m4a$/);
    if (!match) continue;
    const lang = match[1];
    const state = JSON.parse(await fs.readFile(path.join(dir, `track-${lang}.json`), 'utf8').catch(() => '{}'));
    const subtitles = await fs.readFile(path.join(dir, `${lang}.vtt`), 'utf8').catch(() => '');

    let audioUrl = `/api/dubbing/file/${id}/${lang}.m4a?v=${Date.now()}`;
    if (useBlob) {
      const { size } = await fs.stat(path.join(dir, name));
      const blob = await put(`dubs/${id}/${lang}.m4a`, createReadStream(path.join(dir, name)), {
        access: 'public',
        contentType: 'audio/mp4',
        addRandomSuffix: true,
        multipart: size > 5 * 1024 * 1024
      });
      audioUrl = blob.url;
    }

    await db.collection('dubtracks').updateOne(
      { mediaKey, language: lang },
      { $set: { voice: state.voice || 'male', status: 'ready', progress: 100, error: '', audioUrl, subtitles, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    moved++;
    console.log(`- ${lang} → ${useBlob ? audioUrl : 'local'}`);
  }
}

console.log(`Done: ${moved} track(s).`);
await mongoose.disconnect();
