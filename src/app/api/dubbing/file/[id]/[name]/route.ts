import { createReadStream, promises as fs } from 'fs';
import { Readable } from 'stream';
import { dubFilePath } from '@/lib/dubbing/pipeline';

/** Serves a generated dub track or subtitle file, with Range support so the player can seek. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params;
  const file = dubFilePath(id, name);
  const stat = file ? await fs.stat(file).catch(() => null) : null;
  if (!file || !stat) return new Response('Not found', { status: 404 });

  const headers: Record<string, string> = {
    'Content-Type': name.endsWith('.vtt') ? 'text/vtt; charset=utf-8' : 'audio/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600'
  };

  const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, stat.size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': String(end - start + 1) }
    });
  }

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, 'Content-Length': String(stat.size) } });
}
