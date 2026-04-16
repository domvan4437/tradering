'use client'
import { useState, useEffect, useCallback } from 'react'

const C = {
  bg:'var(--bg)', surface:'var(--surface)', surface2:'var(--surface2)',
  surface3:'var(--surface3)', border:'var(--border)', border2:'var(--border2)',
  accent:'var(--accent)', text:'var(--text)', muted:'var(--text-muted)',
  dim:'var(--text-dim)', green:'var(--green)', red:'var(--red)', gold:'var(--gold)',
  font:'var(--font)', mono:'var(--font-mono)',
}

const CATEGORIES = [
  { id:'general',     label:'All Markets',  icon:'🌍', color:'#4A6FA5' },
  { id:'forex',       label:'Forex',        icon:'💱', color:'#7c3aed' },
  { id:'commodities', label:'Commodities',  icon:'🌾', color:'#059669' },
  { id:'stocks',      label:'Stocks',       icon:'📈', color:'#2563eb' },
  { id:'crypto',      label:'Crypto',       icon:'₿',  color:'#f59e0b' },
]

const KEYWORDS = {
  bullish:  ['rally','surge','climb','rise','gain','high','bull','strong','beat','record','growth','up'],
  bearish:  ['fall','drop','plunge','decline','loss','low','bear','weak','miss','crash','down','sell'],
  neutral:  ['hold','flat','stable','unchanged','sideways','mixed','steady'],
  warning:  ['warning','risk','concern','threat','uncertain','volatile','fear','crisis'],
}

function getSentiment(title) {
  const t = title.toLowerCase()
  if (KEYWORDS.bearish.some(w => t.includes(w))) return { label:'Bearish', color:'#dc2626', bg:'var(--red-bg)' }
  if (KEYWORDS.bullish.some(w => t.includes(w))) return { label:'Bullish', color:'#059669', bg:'var(--green-bg)' }
  if (KEYWORDS.warning.some(w => t.includes(w))) return { label:'Watch',   color:'#d97706', bg:'#fef3c7' }
  return null
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  try {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  } catch { return '' }
}

function NewsCard({ item, index }) {
  const sentiment = getSentiment(item.title)
  const isNew = (() => {
    try { return (Date.now() - new Date(item.pubDate)) / 3600000 < 2 } catch { return false }
  })()

  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', display:'block' }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'16px 18px', transition:'all 0.15s', cursor:'pointer' }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow='none' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          {/* Index number */}
          <div style={{ fontSize:11, color:C.dim, fontFamily:C.mono, minWidth:20, paddingTop:2, flexShrink:0 }}>{index+1}</div>
          <div style={{ flex:1, minWidth:0 }}>
            {/* Top row: source + time + badges */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:'uppercase', letterSpacing:0.5 }}>{item.source}</span>
              <span style={{ fontSize:10, color:C.dim }}>·</span>
              <span style={{ fontSize:11, color:C.dim }}>{timeAgo(item.pubDate)}</span>
              {isNew && <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:C.accent, padding:'1px 7px', borderRadius:99 }}>NEW</span>}
              {sentiment && <span style={{ fontSize:10, fontWeight:600, color:sentiment.color, background:sentiment.bg, padding:'2px 8px', borderRadius:99 }}>{sentiment.label}</span>}
            </div>
            {/* Title */}
            <div style={{ fontSize:14, fontWeight:600, color:C.text, lineHeight:1.5, marginBottom:6 }}>
              {item.title}
            </div>
            {/* Description */}
            {item.description && (
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                {item.description}
              </div>
            )}
          </div>
          {/* External link icon */}
          <div style={{ color:C.dim, fontSize:12, flexShrink:0, paddingTop:2 }}>↗</div>
        </div>
      </div>
    </a>
  )
}

export default function NewsTab() {
  const [category, setCategory] = useState('general')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [fetchedAt, setFetchedAt] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const fetchNews = useCallback(async (cat) => {
    setLoading(true); setError(''); setItems([])
    try {
      const res = await fetch(`/api/news?category=${cat}`)
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setItems(data.items || [])
      if (data.fetchedAt) setFetchedAt(new Date(data.fetchedAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}))
    } catch { setError('Failed to load news. Please try again.') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchNews(category) }, [category])

  const sources = ['all', ...Array.from(new Set(items.map(i => i.source)))]

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase())
    const matchSource = sourceFilter === 'all' || item.source === sourceFilter
    const sentiment = getSentiment(item.title)
    const matchSentiment = sentimentFilter === 'all'
      || (sentimentFilter === 'bullish' && sentiment?.label === 'Bullish')
      || (sentimentFilter === 'bearish' && sentiment?.label === 'Bearish')
      || (sentimentFilter === 'watch'   && sentiment?.label === 'Watch')
    return matchSearch && matchSource && matchSentiment
  })

  const catInfo = CATEGORIES.find(c => c.id === category)

  // Stats
  const bullishCount = items.filter(i => getSentiment(i.title)?.label === 'Bullish').length
  const bearishCount = items.filter(i => getSentiment(i.title)?.label === 'Bearish').length
  const watchCount   = items.filter(i => getSentiment(i.title)?.label === 'Watch').length

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:400, margin:'0 0 6px' }}>
            Market <span style={{ color:C.gold }}>News</span>
          </h2>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>
            Live news across all asset classes — sorted by recency with AI sentiment tagging.
            {fetchedAt && <span style={{ color:C.dim }}> · Updated {fetchedAt}</span>}
          </p>
        </div>
        <button onClick={() => fetchNews(category)} disabled={loading} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'7px 16px', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:C.font }}>
          {loading ? '⏳ Loading...' : '↻ Refresh'}
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setCategory(cat.id); setSearch(''); setSentimentFilter('all'); setSourceFilter('all') }}
            style={{ background:category===cat.id?cat.color:C.surface, color:category===cat.id?'#fff':C.muted, border:`1px solid ${category===cat.id?cat.color:C.border}`, padding:'8px 16px', borderRadius:99, fontSize:13, fontWeight:category===cat.id?600:400, cursor:'pointer', fontFamily:C.font, transition:'all 0.15s', display:'flex', alignItems:'center', gap:6 }}>
            <span>{cat.icon}</span>{cat.label}
          </button>
        ))}
      </div>

      {/* Sentiment summary */}
      {items.length > 0 && (
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <div style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:8, padding:'8px 16px', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.green }}>{bullishCount}</span>
            <span style={{ fontSize:11, color:C.muted }}>Bullish</span>
          </div>
          <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:8, padding:'8px 16px', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.red }}>{bearishCount}</span>
            <span style={{ fontSize:11, color:C.muted }}>Bearish</span>
          </div>
          <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:'8px 16px', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#d97706' }}>{watchCount}</span>
            <span style={{ fontSize:11, color:C.muted }}>Watch</span>
          </div>
          <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 16px', display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{items.length}</span>
            <span style={{ fontSize:11, color:C.muted }}>Total Stories</span>
          </div>
        </div>
      )}

      {/* Filters row */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.dim, fontSize:13 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search headlines..." style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 12px 8px 32px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
        </div>
        {/* Sentiment filter */}
        <select value={sentimentFilter} onChange={e=>setSentimentFilter(e.target.value)} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font, cursor:'pointer' }}>
          <option value="all">All Sentiment</option>
          <option value="bullish">🟢 Bullish Only</option>
          <option value="bearish">🔴 Bearish Only</option>
          <option value="watch">🟡 Watch Only</option>
        </select>
        {/* Source filter */}
        <select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font, cursor:'pointer' }}>
          {sources.map(s => <option key={s} value={s}>{s==='all'?'All Sources':s}</option>)}
        </select>
        {(search || sentimentFilter!=='all' || sourceFilter!=='all') && (
          <button onClick={()=>{setSearch('');setSentimentFilter('all');setSourceFilter('all')}} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && items.length > 0 && (
        <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>
          Showing {filtered.length} of {items.length} stories
          {search && ` matching "${search}"`}
        </div>
      )}

      {/* News feed */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[...Array(8)].map((_,i) => (
            <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'16px 18px', opacity: 1 - i*0.1 }}>
              <div style={{ height:12, background:C.surface2, borderRadius:4, width:'30%', marginBottom:10 }} />
              <div style={{ height:16, background:C.surface2, borderRadius:4, width:'85%', marginBottom:8 }} />
              <div style={{ height:12, background:C.surface2, borderRadius:4, width:'65%' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:'var(--radius)', padding:'16px 20px', color:C.red, fontSize:13 }}>
          ⚠️ {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📰</div>
          <div style={{ fontSize:14, color:C.muted }}>
            {items.length === 0 ? 'No news available for this category right now.' : 'No stories match your filters.'}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((item, i) => <NewsCard key={`${item.link}-${i}`} item={item} index={i} />)}
        </div>
      )}

      <div style={{ fontSize:11, color:C.dim, textAlign:'center', marginTop:20, paddingBottom:8 }}>
        News sourced from public RSS feeds. Stories open in a new tab. TradeRing does not endorse any specific outlets.
      </div>
    </div>
  )
}
