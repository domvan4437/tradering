import { getSession } from '../../../lib/auth'

// Free RSS feeds that don't require API keys
const FEEDS = {
  forex: [
    { url: 'https://www.dailyfx.com/feeds/forex-market-news', label: 'DailyFX' },
    { url: 'https://www.forexlive.com/feed/news', label: 'ForexLive' },
    { url: 'https://www.fxstreet.com/rss/news', label: 'FXStreet' },
  ],
  commodities: [
    { url: 'https://www.kitco.com/rss/kitconews.rss', label: 'Kitco' },
    { url: 'https://oilprice.com/rss/main', label: 'OilPrice' },
    { url: 'https://www.agweb.com/rss.xml', label: 'AgWeb' },
  ],
  stocks: [
    { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', label: 'Yahoo Finance' },
    { url: 'https://www.marketwatch.com/rss/topstories', label: 'MarketWatch' },
    { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', label: 'WSJ Markets' },
  ],
  crypto: [
    { url: 'https://cointelegraph.com/rss', label: 'CoinTelegraph' },
    { url: 'https://decrypt.co/feed', label: 'Decrypt' },
  ],
  general: [
    { url: 'https://www.reuters.com/finance/rss', label: 'Reuters' },
    { url: 'https://feeds.bloomberg.com/markets/news.rss', label: 'Bloomberg' },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', label: 'CNBC Markets' },
    { url: 'https://finance.yahoo.com/news/rssindex', label: 'Yahoo Finance' },
  ],
}

function parseRSS(xml, source) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const getTag = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return m ? (m[1] || m[2] || '').trim() : ''
    }
    const title = getTag('title')
    const link = getTag('link') || item.match(/<link>(.*?)<\/link>/i)?.[1] || ''
    const pubDate = getTag('pubDate')
    const desc = getTag('description')?.replace(/<[^>]+>/g, '').slice(0, 200)
    if (title && link) {
      items.push({ title, link: link.trim(), pubDate, description: desc, source })
    }
  }
  return items
}

async function fetchFeed(url, label) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TradeRing/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const text = await res.text()
    return parseRSS(text, label)
  } catch {
    return []
  }
}

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'general'

  const feedList = FEEDS[category] || FEEDS.general
  const results = await Promise.all(feedList.map(f => fetchFeed(f.url, f.label)))
  const items = results.flat()

  // Sort by date descending
  items.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate) : new Date(0)
    const db = b.pubDate ? new Date(b.pubDate) : new Date(0)
    return db - da
  })

  return Response.json({ items: items.slice(0, 60), category, fetchedAt: new Date().toISOString() })
}
