import { getSession } from '../../../../lib/auth';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== 'string') return Response.json({ error: 'URL required' }, { status: 400 });

  // ── YouTube ───────────────────────────────────────────────────────────────
  const ytMatch = url.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
      if (!items || items.length === 0) {
        return Response.json({ error: 'No transcript found. The video may not have captions enabled.' }, { status: 422 });
      }
      const transcript = items.map(i => i.text).join(' ').replace(/\s+/g, ' ').trim();

      // Try to get the title from oEmbed (lightweight, no API key needed)
      let title = 'YouTube Video';
      try {
        const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
          signal: AbortSignal.timeout(3000),
        });
        if (oembed.ok) {
          const data = await oembed.json();
          title = data.title || title;
        }
      } catch {}

      const truncated = transcript.slice(0, 14000);
      return Response.json({
        type: 'youtube',
        title,
        videoId,
        url,
        content: truncated,
        wasTruncated: transcript.length > 14000,
        charCount: transcript.length,
      });
    } catch (err) {
      console.error('YouTube transcript error:', err);
      // Give a clear message — most likely cause is no captions
      const msg = err.message?.includes('disabled') || err.message?.includes('transcript')
        ? 'Transcripts are disabled for this video.'
        : 'Could not retrieve the transcript. The video may not have captions.';
      return Response.json({ error: msg }, { status: 422 });
    }
  }

  // ── Web article ───────────────────────────────────────────────────────────
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return Response.json({ error: `Page returned ${res.status}` }, { status: 422 });

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().slice(0, 100) : url;

    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ').trim();

    if (cleaned.length < 100) {
      return Response.json({ error: 'Page has too little readable content (may require JavaScript to render).' }, { status: 422 });
    }

    return Response.json({
      type: 'article',
      title,
      url,
      content: cleaned.slice(0, 14000),
      wasTruncated: cleaned.length > 14000,
      charCount: cleaned.length,
    });
  } catch (err) {
    console.error('Article ingest error:', err);
    return Response.json({ error: 'Failed to fetch page: ' + err.message }, { status: 500 });
  }
}
