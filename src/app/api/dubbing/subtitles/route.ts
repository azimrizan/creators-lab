import { errorResponse, ApiError } from '@/lib/ai/guard';
import { getSubtitles } from '@/lib/dubbing/pipeline';

/** ?video=<lesson video URL>&lang=<code | "source"> → WebVTT subtitles. */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const video = params.get('video');
    const lang = params.get('lang') || '';
    if (!video || !/^([a-z]{2}|source)$/.test(lang)) throw new ApiError(400, 'video and lang are required');
    const vtt = await getSubtitles(video, lang);
    if (!vtt) return new Response('Not found', { status: 404 });
    return new Response(vtt, { headers: { 'Content-Type': 'text/vtt; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  } catch (error) {
    return errorResponse(error);
  }
}
