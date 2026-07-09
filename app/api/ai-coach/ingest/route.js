import { getSession } from '../../../../lib/auth';

export async function POST(req) {
  const session = await getSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== 'string') return Response.json({ error: 'URL required' }, { status: 400 });

  // ── YouTube ──────────────────────────────────────────────────────────────
  const ytMatch = url.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    try {
      // Fetch the video page to get captions URL and title
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const html = await pageRes.text();

      // Extract title
      const titleMatch = html.match(/"title":"(.*?)(?:",")/);
      const title = titleMatch ? titleMatch[1].replace(/\\u0026/g, '&') : 'YouTube Video';

      // Extract captions URL
      const captionsMatch = html.match(/"captionTracks":\[.*?"baseUrl":"(.*?)"/);
      if (!captionsMatch) {
        return Response.json({ error: 'No captions/transcript found for this video. Try a video with closed captions enabled.' }, { status: 422 });
      }

      const captionsUrl = captionsMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      const captionsRes = await fetch(captionsUrl + '&fmt=json3');
      let transcript = '';

      if (captionsRes.ok) {
        const data = await captionsRes.json();
        transcript = (data.events || [])
          .filter(e => e.segs)
          .map(e => e.segs.map(s => s.utf8 || '').join(''))
          .join(' ')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        // Fallback: fetch XML format
        const xmlRes = await fetch(captionsUrl);
        const xml = await xmlRes.text();
        transcript = xml
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (!transcript) return Response.json({ error: 'Could not extract transcript text.' }, { status: 422 });

      // Truncate to ~12k chars (roughly 3000 tokens)
      const truncated = transcript.slice(0, 12000);
      const wasTruncated = transcript.length > 12000;

      return Response.json({
        type: 'youtube',
        title,
        videoId,
        url,
        content: truncated,
        wasTruncated,
        charCount: transcript.length,
      });
    } catch (err) {
      console.error('YouTube ingest error:', err);
      return Response.json({ error: 'Failed to fetch YouTube transcript: ' + err.message }, { status: 500 });
    }
  }

  // ── Web article ───────────────────────────────────────────────────────────
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return Response.json({ error: `Page returned ${res.status}` }, { status: 422 });

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    // Strip scripts, styles, nav, header, footer, ads
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const truncated = cleaned.slice(0, 12000);
    const wasTruncated = cleaned.length > 12000;

    if (truncated.length < 100) {
      return Response.json({ error: 'Page has too little readable content (may require JavaScript to render).' }, { status: 422 });
    }

    return Response.json({
      type: 'article',
      title: title.slice(0, 100),
      url,
      content: truncated,
      wasTruncated,
      charCount: cleaned.length,
    });
  } catch (err) {
    console.error('Article ingest error:', err);
    return Response.json({ error: 'Failed to fetch page: ' + err.message }, { status: 500 });
  }
}
