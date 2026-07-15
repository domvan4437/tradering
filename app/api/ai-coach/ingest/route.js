import { getSession } from '../../../../lib/auth';

const YT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// Parse XML timedtext into plain text
function parseTimedText(xml) {
  return xml
    .replace(/<text[^>]*>/g, ' ')
    .replace(/<\/text>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

// Parse JSON3 timedtext format
function parseJson3(data) {
  return (data.events || [])
    .filter(e => e.segs)
    .map(e => e.segs.map(s => s.utf8 || '').join(''))
    .join(' ')
    .replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchTranscript(videoId) {
  // Strategy 1: scrape the watch page for captionTracks
  let title = 'YouTube Video';
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: YT_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    const html = await pageRes.text();

    // Extract title
    const titleMatch = html.match(/"title":"([^"]+)"/);
    if (titleMatch) title = titleMatch[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"');

    // Extract all captionTracks (manual + auto-generated)
    const trackMatches = [...html.matchAll(/"baseUrl":"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/g)];
    for (const m of trackMatches) {
      const captionUrl = m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      // Prefer JSON3 format
      const jsonUrl = captionUrl.includes('fmt=') ? captionUrl.replace(/fmt=[^&]+/, 'fmt=json3') : captionUrl + '&fmt=json3';
      try {
        const cRes = await fetch(jsonUrl, { signal: AbortSignal.timeout(5000) });
        if (cRes.ok) {
          const data = await cRes.json();
          const text = parseJson3(data);
          if (text.length > 50) return { title, transcript: text };
        }
      } catch {}
      // Fallback: XML
      try {
        const xmlRes = await fetch(captionUrl, { signal: AbortSignal.timeout(5000) });
        if (xmlRes.ok) {
          const text = parseTimedText(await xmlRes.text());
          if (text.length > 50) return { title, transcript: text };
        }
      } catch {}
    }
  } catch {}

  // Strategy 2: direct timedtext API — try several lang/kind combos
  const combos = [
    `lang=en&v=${videoId}`,
    `lang=en&v=${videoId}&kind=asr`,
    `lang=en-US&v=${videoId}`,
    `lang=en-GB&v=${videoId}`,
    `v=${videoId}&asr_langs=en&caps=asr`,
  ];
  for (const q of combos) {
    // JSON3
    try {
      const r = await fetch(`https://www.youtube.com/api/timedtext?${q}&fmt=json3`, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const data = await r.json();
        const text = parseJson3(data);
        if (text.length > 50) return { title, transcript: text };
      }
    } catch {}
    // XML
    try {
      const r = await fetch(`https://www.youtube.com/api/timedtext?${q}`, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const text = parseTimedText(await r.text());
        if (text.length > 50) return { title, transcript: text };
      }
    } catch {}
  }

  return null;
}

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
      const result = await fetchTranscript(videoId);
      if (!result) {
        return Response.json({
          error: 'Could not retrieve a transcript for this video. It may have no captions, or captions may be disabled.',
        }, { status: 422 });
      }
      const truncated = result.transcript.slice(0, 14000);
      return Response.json({
        type: 'youtube',
        title: result.title,
        videoId,
        url,
        content: truncated,
        wasTruncated: result.transcript.length > 14000,
        charCount: result.transcript.length,
      });
    } catch (err) {
      console.error('YouTube ingest error:', err);
      return Response.json({ error: 'Failed to fetch transcript: ' + err.message }, { status: 500 });
    }
  }

  // ── Web article ───────────────────────────────────────────────────────────
  try {
    const res = await fetch(url, {
      headers: YT_HEADERS,
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

    const truncated = cleaned.slice(0, 14000);
    return Response.json({
      type: 'article',
      title,
      url,
      content: truncated,
      wasTruncated: cleaned.length > 14000,
      charCount: cleaned.length,
    });
  } catch (err) {
    console.error('Article ingest error:', err);
    return Response.json({ error: 'Failed to fetch page: ' + err.message }, { status: 500 });
  }
}
