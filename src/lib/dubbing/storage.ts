import path from 'path';
import { promises as fs, createReadStream } from 'fs';
import { del, put } from '@vercel/blob';

/**
 * Where finished dub tracks live. On Vercel (BLOB_READ_WRITE_TOKEN set) they go to Vercel Blob,
 * because a serverless function's disk is temporary. Locally they're kept under ./storage/dubs
 * and served by /api/dubbing/file.
 */

const LOCAL_DIR = process.env.DUB_STORAGE_DIR || path.join(process.cwd(), 'storage', 'dubs');

export const usesBlobStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Local path of a stored track, or null if the id/name is not one this module writes. */
export function localAudioPath(id: string, name: string): string | null {
  if (!/^[a-f0-9]{16}$/.test(id) || !/^[a-z]{2}\.m4a$/.test(name)) return null;
  return path.join(LOCAL_DIR, id, name);
}

/** Stores a finished .m4a file and returns the URL the player should load. */
export async function saveAudio(id: string, language: string, file: string): Promise<string> {
  if (usesBlobStorage()) {
    const { size } = await fs.stat(file);
    const blob = await put(`dubs/${id}/${language}.m4a`, createReadStream(file), {
      access: 'public',
      contentType: 'audio/mp4',
      // A fresh URL per version, so browsers and the CDN never serve an old take.
      addRandomSuffix: true,
      multipart: size > 5 * 1024 * 1024
    });
    return blob.url;
  }
  const target = localAudioPath(id, `${language}.m4a`)!;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(file, target);
  return `/api/dubbing/file/${id}/${language}.m4a?v=${Date.now()}`;
}

/** Removes a stored track. Never throws: a leftover file is harmless. */
export async function deleteAudio(url: string | undefined) {
  if (!url) return;
  try {
    if (/^https?:\/\//.test(url)) {
      if (usesBlobStorage()) await del(url);
      return;
    }
    const match = url.match(/^\/api\/dubbing\/file\/([a-f0-9]{16})\/([a-z]{2}\.m4a)/);
    const file = match && localAudioPath(match[1], match[2]);
    if (file) await fs.rm(file, { force: true });
  } catch (err) {
    console.warn('[dubbing] could not delete old track', err);
  }
}
