const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

const BROWSE_MODAL = `{showBrowse && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:10001, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowBrowse(false)}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 24px', width:680, maxWidth:'95vw', maxHeight:'85vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:500, color:'var(--text)' }}>Browse groups</div>
              <button onClick={()=>setShowBrowse(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button>
            </div>
            <BrowseGroupsPanel onJoin={()=>setShowBrowse(false)} />
          </div>
        </div>
      )}
      `

s = s.replace('showManageRooms && (', BROWSE_MODAL + 'showManageRooms && (')
console.log('✓ Browse modal injected')

// Now add the BrowseGroupsPanel component before the export default
const COMPONENT = `
const BROWSE_GROUPS_DATA = [
  { name:'BTC Club', cat:'Crypto', country:'🌍 Global', members:48, access:'Open', bio:'Bitcoin analysis, on-chain data, and macro cycle research. Weekly COT positioning and bias reports shared every Sunday.', tags:['#Bitcoin','#COT','#OnChain'], color:'#4B44C8', founder:'satoshi99', coLeader:'blocktrader', winRate:'67%', avgRR:'2.1', featured:true },
  { name:'COT Masters', cat:'Futures', country:'🇺🇸 US / Global', members:124, access:'Open', bio:'Deep-dive COT report analysis for commodities and energies. Seasonal setups, weekly signals, and live trade breakdowns.', tags:['#COT','#Futures','#Seasonal'], color:'#059669', founder:'cotmaster', coLeader:'graincowboy', winRate:'71%', avgRR:'2.8', featured:true },
  { name:'FX Swing Club', cat:'Forex', country:'🇬🇧 UK / EU', members:87, access:'Invite', bio:'Higher timeframe forex analysis focused on key levels, COT extremes, and clean swing structures on major pairs.', tags:['#Forex','#Swing','#HTF'], color:'#d97706', founder:'fxswing99', coLeader:'eurusdking', winRate:'58%', avgRR:'1.9', featured:false },
  { name:'Gold Traders', cat:'Trading', country:'🇺🇸 US', members:203, access:'Open', bio:'Gold futures and spot trading. COT-based swing trades, seasonal tendencies, and macro correlations with the dollar.', tags:['#Gold','#COT','#Swing'], color:'#dc2626', founder:'goldtrader', coLeader:'silverbull', winRate:'62%', avgRR:'2.3', featured:false },
  { name:'ES/NQ Scalpers', cat:'Futures', country:'🇺🇸 US', members:66, access:'Invite', bio:'Index futures intraday setups. Pre-market planning, key levels, and scalp setups on ES and NQ futures.', tags:['#Futures','#Scalping','#ES'], color:'#7c3aed', founder:'indexking', coLeader:'nqscalp', winRate:'54%', avgRR:'1.4', featured:false },
  { name:'Seasonal Traders', cat:'Trading', country:'🌍 Global', members:39, access:'Open', bio:'Agricultural and energy seasonal patterns. 15-year tendency studies and precise timing windows for entries.', tags:['#Seasonal','#Grains','#Energy'], color:'#0891b2', founder:'seasonalpro', coLeader:null, winRate:'69%', avgRR:'3.1', featured:false },
  { name:'Crypto Alts Hub', cat:'Crypto', country:'🌏 Asia / Global', members:156, access:'Closed', bio:'Altcoin research, technical analysis, and on-chain metrics. Applications are reviewed every Monday.', tags:['#Crypto','#Alts','#OnChain'], color:'#ec4899', founder:'altmaster', coLeader:'defiking', winRate:'48%', avgRR:'2.6', featured:false },
]

const ACCESS_COLOR = { Open:'#059669', Invite:'#d97706', Closed:'#dc2626' }
const ACCESS_BG = { Open:'rgba(5,150,105,0.1)', Invite:'rgba(217,119,6,0.1)', Closed:'rgba(220,38,38,0.08)' }

function BrowseGroupsPanel({ onJoin }) {
  const [search, setSearch] = React.useState('')
  const [cat, setCat] = React.useState('')
  const [vis, setVis] = React.useState('')
  const [expanded, setExpanded] = React.useState(null)

  const filtered = BROWSE_GROUPS_DATA.filter(g =>
    (!search || g.name.toLowerCase().includes(search.toLowerCase()) || g.tags.join(' ').toLowerCase().includes(search.toLowerCase()) || g.bio.toLowerCase().includes(search.toLowerCase())) &&
    (!cat || g.cat === cat) &&
    (!vis || g.access === vis)
  )

  const PURPLE = '#4B44C8'

  function GroupRow({ g, compact }) {
    const isExp = expanded === g.name
    return (
      <div onClick={() => setExpanded(isExp ? null : g.name)}
        style={{ background:'var(--surface)', border:\`0.5px solid \${isExp ? PURPLE : 'var(--border)'}\`, borderRadius:10, padding:'12px 14px', marginBottom:7, cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:9, background:g.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:500, color:'#fff', flexShrink:0 }}>{g.name[0]}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
              <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{g.name}</span>
              <span style={{ fontSize:10, fontWeight:500, padding:'2px 6px', borderRadius:10, background:ACCESS_BG[g.access], color:ACCESS_COLOR[g.access] }}>{g.access}</span>
              <span style={{ fontSize:10, padding:'2px 6px', borderRadius:10, background:'var(--surface2)', color:'var(--text-muted)' }}>{g.cat}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{g.members} members · {g.country}</div>
          </div>
          <button onClick={e=>{e.stopPropagation();onJoin();}}
            style={{ padding:'5px 14px', background:PURPLE, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'var(--font)', flexShrink:0 }}>
            {g.access==='Closed'?'Request':'Join'}
          </button>
        </div>
        {isExp && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5, marginBottom:10 }}>{g.bio}</div>
            <div style={{ height:'0.5px', background:'var(--border)', marginBottom:10 }} />
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:10 }}>
              {[{l:'Members',v:g.members},{l:'Avg win rate',v:g.winRate,c:'#16a34a'},{l:'Avg R:R',v:g.avgRR+'R'},{l:'Access',v:g.access,c:ACCESS_COLOR[g.access]}].map(stat=>(
                <div key={stat.l}>
                  <div style={{ fontSize:13, fontWeight:500, color:stat.c||'var(--text)' }}>{stat.v}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{stat.l}</div>
                </div>
              ))}
            </div>
            <div style={{ height:'0.5px', background:'var(--border)', marginBottom:10 }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:500, color:'#fff' }}>{g.founder[0].toUpperCase()}</div>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>@{g.founder}</span>
                  <span style={{ fontSize:10, fontWeight:500, padding:'1px 5px', borderRadius:8, background:'rgba(75,68,200,0.1)', color:'#3C3489' }}>Founder</span>
                </div>
                {g.coLeader && (
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'#d97706', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:500, color:'#fff' }}>{g.coLeader[0].toUpperCase()}</div>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>@{g.coLeader}</span>
                    <span style={{ fontSize:10, fontWeight:500, padding:'1px 5px', borderRadius:8, background:'rgba(217,119,6,0.1)', color:'#92400e' }}>Co-leader</span>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {g.tags.map(t=><span key={t} style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background:'var(--surface2)', color:'var(--text-muted)', border:'0.5px solid var(--border)' }}>{t}</span>)}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search groups..." style={{ flex:1, padding:'7px 10px', border:'0.5px solid var(--border2)', borderRadius:7, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }} />
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{ padding:'7px 10px', border:'0.5px solid var(--border2)', borderRadius:7, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }}>
          <option value="">All categories</option>
          {['Crypto','Futures','Forex','Trading'].map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={vis} onChange={e=>setVis(e.target.value)} style={{ padding:'7px 10px', border:'0.5px solid var(--border2)', borderRadius:7, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }}>
          <option value="">Any access</option>
          {['Open','Invite','Closed'].map(v=><option key={v}>{v}</option>)}
        </select>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:11, color:'var(--text-muted)' }}>Trending:</span>
        {['#COT','#Gold','#Bitcoin','#Futures','#Swing'].map(t=>(
          <span key={t} onClick={()=>setSearch(t.slice(1))} style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'var(--surface2)', color:'var(--text-muted)', border:'0.5px solid var(--border)', cursor:'pointer' }}>{t}</span>
        ))}
      </div>
      {!search && !cat && !vis && (
        <>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Featured</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {BROWSE_GROUPS_DATA.filter(g=>g.featured).map(g=>(
              <div key={g.name} onClick={()=>setExpanded(expanded===g.name?null:g.name)}
                style={{ background:'var(--surface)', border:\`0.5px solid \${expanded===g.name?PURPLE:'var(--border)'}\`, borderRadius:10, padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:g.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:500, color:'#fff', flexShrink:0 }}>{g.name[0]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--text)' }}>{g.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{g.members} members</div>
                </div>
                <button onClick={e=>{e.stopPropagation();onJoin();}} style={{ padding:'4px 10px', background:PURPLE, color:'#fff', border:'none', borderRadius:5, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'var(--font)' }}>Join</button>
              </div>
            ))}
          </div>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>All groups</div>
        </>
      )}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'24px', fontSize:13, color:'var(--text-muted)' }}>No groups found</div>
      ) : (
        filtered.map(g => <GroupRow key={g.name} g={g} />)
      )}
    </div>
  )
}

`

const exportIdx = s.indexOf('export default function CommunityLayout')
s = s.slice(0, exportIdx) + COMPONENT + s.slice(exportIdx)
console.log('✓ BrowseGroupsPanel component added')

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
