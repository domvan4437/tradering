'use client'
import React, { useState } from 'react'

const PURPLE = '#4B44C8'

const MOCK_TRADERS = [
  { id:1, n:'goldtrader', full:'Marcus T.', flag:'🇺🇸', city:'St. Louis, MO', state:'MO', dist:'3 mi', assets:['Gold','Silver','Crude Oil'], style:'Swing', bio:'COT-based commodity trader. 4 years experience. Open to local meetups and accountability groups.', wr:'68%', trades:247, color:'#4B44C8', verified:true, meetup:true, mapX:220, mapY:155 },
  { id:2, n:'cotmaster', full:'James R.', flag:'🇺🇸', city:'Chesterfield, MO', state:'MO', dist:'14 mi', assets:['ES','NQ','Wheat'], style:'Position', bio:'Index futures and grain markets. Former floor trader. Looking to connect with serious traders in the St. Louis area.', wr:'72%', trades:183, color:'#d97706', verified:true, meetup:true, mapX:310, mapY:130 },
  { id:3, n:'fxswing99', full:'Sarah K.', flag:'🇬🇧', city:'Clayton, MO', state:'MO', dist:'7 mi', assets:['EUR/USD','GBP/USD','AUD/USD'], style:'Swing', bio:'Forex swing trader focused on COT and higher timeframe levels. Happy to connect locally.', wr:'61%', trades:312, color:'#059669', verified:false, meetup:false, mapX:265, mapY:175 },
  { id:4, n:'esscalper', full:'Derek M.', flag:'🇺🇸', city:'Belleville, IL', state:'IL', dist:'18 mi', assets:['ES','NQ'], style:'Scalp', bio:'Intraday ES/NQ scalper. Pre-market planning every day. Looking for accountability partner.', wr:'54%', trades:891, color:'#dc2626', verified:false, meetup:true, mapX:290, mapY:210 },
  { id:5, n:'graintrader', full:'Tom W.', flag:'🇨🇦', city:'O\'Fallon, MO', state:'MO', dist:'22 mi', assets:['Wheat','Corn','Soybeans'], style:'Seasonal', bio:'Grain trader using 15-year seasonal tendencies. Would love to meet other commodity traders nearby.', wr:'66%', trades:128, color:'#7c3aed', verified:true, meetup:true, mapX:180, mapY:140 },
]

function TraderCard({ trader, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'var(--surface,#fff)', borderRadius:14, padding:'20px 24px', width:480, maxWidth:'92vw', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:trader.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', flexShrink:0 }}>{trader.n[0].toUpperCase()}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
              <span style={{ fontSize:16, fontWeight:600, color:'var(--text,#111)' }}>{trader.full}</span>{trader.flag && <span style={{ fontSize:16 }}>{trader.flag}</span>}
              <span style={{ fontSize:13, color:'#9ca3af' }}>@{trader.n}</span>
              {trader.verified && <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:8, background:'#EEEDFE', color:'#3C3489' }}>✓ Verified</span>}
              {trader.meetup && <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:8, background:'rgba(5,150,105,0.1)', color:'#059669' }}>📍 Open to meetups</span>}
            </div>
            <div style={{ fontSize:12, color:'#6b7280' }}>📍 {trader.city} · {trader.dist} away · {trader.style} trader</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#9ca3af', padding:0 }}>×</button>
        </div>

        <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, marginBottom:14 }}>{trader.bio}</div>

        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14 }}>
          {trader.assets.map(a => <span key={a} style={{ fontSize:11, padding:'3px 9px', borderRadius:10, background:'#f3f4f6', color:'#6b7280', border:'0.5px solid #e5e7eb' }}>{a}</span>)}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
          {[{l:'Win rate',v:trader.wr,c:'#16a34a'},{l:'Trades logged',v:trader.trades},{l:'Trading style',v:trader.style}].map(s=>(
            <div key={s.l} style={{ background:'#f9fafb', borderRadius:8, padding:'8px', textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:600, color:s.c||'#111' }}>{s.v}</div>
              <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button style={{ flex:1, padding:'10px', background:PURPLE, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>Message</button>
          <button style={{ flex:1, padding:'10px', background:'transparent', color:PURPLE, border:`1px solid ${PURPLE}`, borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>Follow</button>
        </div>
      </div>
    </div>
  )
}

export default function LocalTradersTab() {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [asset, setAsset] = useState('')
  const [meetupOnly, setMeetupOnly] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const filtered = MOCK_TRADERS.filter(t =>
    (!search || t.city.toLowerCase().includes(search.toLowerCase()) || t.n.toLowerCase().includes(search.toLowerCase()) || t.assets.some(a=>a.toLowerCase().includes(search.toLowerCase()))) &&
    (!asset || t.assets.some(a=>a.includes(asset))) &&
    (!meetupOnly || t.meetup) &&
    (!verifiedOnly || t.verified)
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font,system-ui)' }}>
      {selected && <TraderCard trader={selected} onClose={()=>setSelected(null)} />}

      {/* Header */}
      <div style={{ padding:'14px 18px', borderBottom:'0.5px solid var(--border,#e5e7eb)' }}>
        <div style={{ fontSize:15, fontWeight:500, color:'var(--text,#111)', marginBottom:10 }}>Discover local traders</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 City, name, or asset..."
            style={{ flex:1, minWidth:160, padding:'7px 10px', borderRadius:8, border:'0.5px solid var(--border2,#d1d5db)', fontSize:12, background:'var(--surface2,#f9fafb)', color:'var(--text,#111)', outline:'none', fontFamily:'var(--font,system-ui)' }} />
          <select value={asset} onChange={e=>setAsset(e.target.value)}
            style={{ padding:'7px 10px', borderRadius:8, border:'0.5px solid var(--border2,#d1d5db)', fontSize:12, background:'var(--surface2,#f9fafb)', color:'var(--text,#111)', fontFamily:'var(--font,system-ui)' }}>
            <option value="">All assets</option>
            <option value="Gold">Commodities</option>
            <option value="EUR">Forex</option>
            <option value="ES">Futures</option>
            <option value="BTC">Crypto</option>
          </select>
          <button onClick={()=>setMeetupOnly(m=>!m)}
            style={{ padding:'7px 12px', borderRadius:20, border:'none', background:meetupOnly?'rgba(5,150,105,0.15)':'var(--surface2,#f3f4f6)', color:meetupOnly?'#059669':'var(--text-muted,#6b7280)', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'var(--font,system-ui)' }}>
            📍 Meetups
          </button>
          <button onClick={()=>setVerifiedOnly(v=>!v)}
            style={{ padding:'7px 12px', borderRadius:20, border:'none', background:verifiedOnly?'rgba(75,68,200,0.1)':'var(--surface2,#f3f4f6)', color:verifiedOnly?PURPLE:'var(--text-muted,#6b7280)', fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'var(--font,system-ui)' }}>
            ✓ Verified
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ position:'relative', height:260, background:'linear-gradient(135deg,#e8f0f8,#d4e4f0)', flexShrink:0, overflow:'hidden' }}>
        {/* Grid lines */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(176,200,220,0.5) 39px,rgba(176,200,220,0.5) 40px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(176,200,220,0.5) 59px,rgba(176,200,220,0.5) 60px)' }} />
        
        {/* You are here marker */}
        <div style={{ position:'absolute', top:155, left:245, transform:'translate(-50%,-50%)' }}>
          <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', border:`3px solid ${PURPLE}`, boxShadow:'0 0 0 4px rgba(75,68,200,0.2)' }} />
        </div>
        <div style={{ position:'absolute', top:168, left:245, transform:'translateX(-50%)', fontSize:9, fontWeight:500, color:PURPLE, whiteSpace:'nowrap' }}>You</div>

        {/* Radius circle */}
        <div style={{ position:'absolute', top:155, left:245, transform:'translate(-50%,-50%)', width:200, height:200, borderRadius:'50%', border:`1.5px dashed rgba(75,68,200,0.25)`, pointerEvents:'none' }} />

        {/* Trader pins */}
        {filtered.map(t => (
          <div key={t.id} onClick={()=>setSelected(t)}
            style={{ position:'absolute', top:t.mapY, left:t.mapX, transform:'translate(-50%,-50%)', cursor:'pointer' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', border:'2px solid #fff', boxShadow:'0 2px 8px rgba(0,0,0,0.2)', transition:'transform 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.2)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              {t.n[0].toUpperCase()}
            </div>
          </div>
        ))}

        {/* Count badge */}
        <div style={{ position:'absolute', bottom:10, left:12, background:'rgba(255,255,255,0.92)', padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:500, color:'#374151', backdropFilter:'blur(4px)' }}>
          {filtered.length} trader{filtered.length!==1?'s':''} nearby · St. Louis area
        </div>

        {/* Privacy note */}
        <div style={{ position:'absolute', bottom:10, right:12, background:'rgba(255,255,255,0.85)', padding:'4px 8px', borderRadius:5, fontSize:10, color:'#9ca3af' }}>
          City-level only · No exact locations
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto' }}>
        <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted,#9ca3af)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'10px 18px 6px' }}>
          {filtered.length} traders in your area
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px', fontSize:13, color:'var(--text-muted,#6b7280)' }}>No traders match your filters</div>
        ) : (
          filtered.map(t => (
            <div key={t.id} onClick={()=>setSelected(t)}
              style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 18px', borderBottom:'0.5px solid var(--border,#f3f4f6)', cursor:'pointer', transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface2,#f9fafb)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', flexShrink:0 }}>{t.n[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--text,#111)' }}>{t.full}</span>{t.flag && <span style={{ fontSize:14 }}>{t.flag}</span>}
                  <span style={{ fontSize:11, color:'#9ca3af' }}>@{t.n}</span>
                  {t.verified && <span style={{ fontSize:10, fontWeight:500, padding:'1px 6px', borderRadius:8, background:'#EEEDFE', color:'#3C3489' }}>✓</span>}
                  {t.meetup && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:'rgba(5,150,105,0.1)', color:'#059669' }}>📍 meetup</span>}
                </div>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:5 }}>📍 {t.city} · {t.dist} · {t.style}</div>
                <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                  {t.assets.slice(0,3).map(a=><span key={a} style={{ fontSize:10, padding:'2px 6px', borderRadius:8, background:'var(--surface2,#f3f4f6)', color:'#6b7280', border:'0.5px solid var(--border,#e5e7eb)' }}>{a}</span>)}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'#16a34a' }}>{t.wr}</div>
                <div style={{ fontSize:10, color:'#9ca3af' }}>{t.trades} trades</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
