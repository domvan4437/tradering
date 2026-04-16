'use client'
import { useState, useEffect } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',surface3:'var(--surface3)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  greenBg:'var(--green-bg)',redBg:'var(--red-bg)',font:'var(--font)',mono:'var(--font-mono)',
}

function parseAnalysis(text) {
  const sections = [
    { key: 'assessment', title: 'Overall Assessment', icon: '📊' },
    { key: 'strengths',  title: 'Your Strengths',      icon: '💪' },
    { key: 'weaknesses', title: 'Critical Weaknesses',  icon: '⚠️' },
    { key: 'pattern',    title: 'Pattern I Notice',     icon: '🔍' },
    { key: 'focus',      title: "This Week's Focus",    icon: '🎯' },
    { key: 'goal',       title: '3 Month Goal',         icon: '🏆' },
  ]
  return sections.map(({ key, title, icon }) => {
    const marker = '**' + title + '**'
    const idx = text.indexOf(marker)
    if (idx === -1) return null
    const start = idx + marker.length
    const nextIdx = text.indexOf('\n**', start)
    const content = (nextIdx === -1 ? text.slice(start) : text.slice(start, nextIdx)).trim()
    return { title, icon, content }
  }).filter(Boolean)
}

export default function AICoachTab() {
  const [analysis, setAnalysis] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastRun, setLastRun] = useState('')

  const generateAnalysis = async () => {
    setLoading(true); setError(''); setAnalysis('')
    try {
      const res = await fetch('/api/ai-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setAnalysis(data.analysis)
      setStats(data.stats)
      setLastRun(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    } catch { setError('Connection error. Please try again.') }
    setLoading(false)
  }

  const sections = analysis ? parseAnalysis(analysis) : []

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:400, margin:'0 0 8px', display:'flex', alignItems:'center', gap:10 }}>
            AI <span style={{ color:C.gold }}>Performance Coach</span>
          </h2>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>
            Personalized analysis built from your actual screening history, positions, and journal entries — not generic advice.
          </p>
        </div>
        <button onClick={generateAnalysis} disabled={loading} style={{ background:loading?C.surface2:C.accent, color:loading?C.muted:'#fff', border:'none', padding:'10px 24px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', fontFamily:C.font, flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
          {loading ? <>⏳ Analyzing your data...</> : <>✦ Generate My Analysis</>}
        </button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
          {[
            { label:'Total Screenings', value:stats.screenings, color:C.text },
            { label:'Overall Win Rate', value:`${stats.winRate}%`, color:stats.winRate>=50?C.green:C.red },
            { label:'Pass Rate', value:`${stats.passRate}%`, color:C.accent },
            { label:'Closed Trades', value:stats.closedPositions, color:C.text },
            { label:'Total P&L', value:`$${stats.totalPnl?.toFixed(2)}`, color:stats.totalPnl>=0?C.green:C.red },
          ].map((s,i) => (
            <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'14px 16px' }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4, fontWeight:500 }}>{s.label}</div>
              <div style={{ fontSize:20, fontWeight:700, color:s.color, fontFamily:C.mono }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:'var(--radius-sm)', padding:'12px 16px', color:C.red, fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}

      {loading && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:40, textAlign:'center' }}>
          <div style={{ width:40, height:40, border:`3px solid ${C.border}`, borderTopColor:C.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <p style={{ fontSize:14, color:C.muted, margin:'0 0 8px' }}>Reading your screening history, positions, and journal...</p>
          <p style={{ fontSize:12, color:C.dim, margin:0 }}>This takes 10-15 seconds</p>
        </div>
      )}

      {!loading && !analysis && !error && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:48, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎯</div>
          <h3 style={{ fontSize:18, fontWeight:600, color:C.text, margin:'0 0 10px' }}>Your Personal Trading Coach</h3>
          <p style={{ fontSize:14, color:C.muted, maxWidth:480, margin:'0 auto 24px', lineHeight:1.7 }}>
            Unlike generic AI chatbots, this coach reads your actual data — every screening you've run, every position you've held, your win rates by commodity and direction, and what your journal says isn't working. Hit Generate to get your personalized analysis.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            {['Identifies your strongest setups','Spots behavioral patterns','Gives specific weekly targets','Tracks 3-month progress'].map((f,i) => (
              <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:99, padding:'6px 14px', fontSize:12, color:C.muted }}>✓ {f}</div>
            ))}
          </div>
        </div>
      )}

      {sections.length > 0 && (
        <div>
          {lastRun && <p style={{ fontSize:11, color:C.dim, marginBottom:16 }}>Analysis generated at {lastRun} · Based on your live account data</p>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {sections.map((s, i) => (
              <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:20, gridColumn: (s.title==='Overall Assessment'||s.title==='3 Month Goal')?'1 / -1':'auto' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>{s.icon}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.text, textTransform:'uppercase', letterSpacing:0.5 }}>{s.title}</span>
                </div>
                <p style={{ fontSize:13, color:C.muted, margin:0, lineHeight:1.8, whiteSpace:'pre-wrap' }}>{s.content}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:C.dim, marginTop:16, textAlign:'center' }}>
            Regenerate anytime as your data grows — the analysis improves with more screening history.
          </p>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
