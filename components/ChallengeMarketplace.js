'use client';
import { useState } from 'react';
import { LeagueBadge, LEAGUES } from './LeagueSystem';

const ASSET_CLASSES = ['Any','Forex','Commodities','Futures','Stocks','Crypto'];
const DURATIONS = ['1 Day','3 Days','1 Week','2 Weeks','1 Month'];
const STAKES = ['$5','$10','$25','$50','$100','$250','$500','$1,000'];

const MOCK_CHALLENGES = [
  { id:1, poster:'seasonalace', league:'gold', bracket:'standard', asset:'Commodities', duration:'1 Week', stake:'$50', description:'COT-based setups only. Grains and metals. Best P&L after 7 days wins.', posted:'2h ago', accepts:2, maxAccepts:1, winRate:76, wins:38 },
  { id:2, poster:'fxswing99', league:'silver', bracket:'standard', asset:'Forex', duration:'3 Days', stake:'$25', description:'Major pairs only. No scalping — minimum 4hr hold time per trade.', posted:'4h ago', accepts:0, maxAccepts:1, winRate:67, wins:16 },
  { id:3, poster:'cotmaster2', league:'gold', bracket:'pro', asset:'Any', duration:'2 Weeks', stake:'$100', description:'Open asset class. Verified broker account required. Top P&L% wins.', posted:'6h ago', accepts:1, maxAccepts:3, winRate:71, wins:35 },
  { id:4, poster:'edgefinder', league:'platinum', bracket:'pro', asset:'Futures', duration:'1 Month', stake:'$250', description:'Equity index futures only. ES, NQ, YM. Monthly P&L competition.', posted:'1d ago', accepts:0, maxAccepts:1, winRate:74, wins:58 },
  { id:5, poster:'newtrader22', league:'iron', bracket:'micro', asset:'Forex', duration:'1 Day', stake:'$5', description:'Quick 1-day EUR/USD challenge. First trade within 2hrs of market open.', posted:'30m ago', accepts:0, maxAccepts:1, winRate:40, wins:2 },
];

function ChallengeCard({ c, onAccept, onSpectate }) {
  const league = LEAGUES.find(l => l.id === c.league);
  const full = c.accepts >= c.maxAccepts;
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${league?.color||'#6366f1'},#7c3aed)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>{c.poster[0].toUpperCase()}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.poster}</span>
            <LeagueBadge leagueId={c.league} size="sm" />
            <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>· {c.bracket}</span>
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.winRate}% win rate · {c.wins}W</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:'var(--accent)' }}>{c.stake}</div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>entry</div>
        </div>
      </div>

      <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 12px' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)', lineHeight:1.5 }}>{c.description}</div>
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {[
          { label:c.asset, color:'#4f46e5' },
          { label:c.duration, color:'#0891b2' },
          { label:`${c.accepts}/${c.maxAccepts} accepted`, color: full?'#dc2626':'#16a34a' },
          { label:c.posted, color:'var(--text-muted)' },
        ].map(tag => (
          <span key={tag.label} style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--surface2)', color:tag.color, border:'1px solid var(--border)' }}>{tag.label}</span>
        ))}
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => onSpectate(c)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          👁 Spectate
        </button>
        <button onClick={() => !full && onAccept(c)} style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background: full?'var(--surface3)':'var(--accent)', color: full?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor: full?'default':'pointer' }}>
          {full ? 'Challenge Full' : 'Accept Challenge →'}
        </button>
      </div>
    </div>
  );
}

function CreateChallengeModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ asset:'Any', duration:'1 Week', stake:'$25', maxAccepts:1, description:'' });
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:480, maxWidth:'92vw', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Post a Challenge</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Asset Class</label>
            <select value={form.asset} onChange={e=>set('asset',e.target.value)} style={inputStyle}>
              {ASSET_CLASSES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duration</label>
            <select value={form.duration} onChange={e=>set('duration',e.target.value)} style={inputStyle}>
              {DURATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Entry Stake</label>
            <select value={form.stake} onChange={e=>set('stake',e.target.value)} style={inputStyle}>
              {STAKES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Max Challengers</label>
            <input type="number" min="1" max="10" value={form.maxAccepts} onChange={e=>set('maxAccepts',parseInt(e.target.value)||1)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Challenge Rules & Description</label>
          <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe your challenge rules, asset restrictions, trading style requirements..." rows={4} style={{...inputStyle, resize:'none'}} />
        </div>

        <div style={{ background:'var(--surface2)', borderRadius:10, padding:'12px 14px', marginBottom:20, fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>
          ⚠️ You will be matched with traders in your league tier (±1 league). Entry stakes are held in escrow until match completion. Verified broker accounts required.
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { onCreate(form); onClose(); }} disabled={!form.description.trim()} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background: form.description.trim()?'var(--accent)':'var(--surface3)', color: form.description.trim()?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor: form.description.trim()?'pointer':'default' }}>Post Challenge</button>
        </div>
      </div>
    </div>
  );
}

export default function ChallengeMarketplace({ onSpectate }) {
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES);
  const [showCreate, setShowCreate] = useState(false);
  const [filterAsset, setFilterAsset] = useState('Any');
  const [filterLeague, setFilterLeague] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [accepted, setAccepted] = useState(null);

  const filtered = challenges
    .filter(c => filterAsset === 'Any' || c.asset === filterAsset || c.asset === 'Any')
    .filter(c => filterLeague === 'all' || c.league === filterLeague)
    .sort((a,b) => sortBy === 'stake' ? parseInt(b.stake.replace(/\D/g,'')) - parseInt(a.stake.replace(/\D/g,'')) : sortBy === 'winrate' ? b.winRate - a.winRate : b.id - a.id);

  const handleAccept = (c) => setAccepted(c);

  const handleCreate = (form) => {
    setChallenges(p => [{
      id: Date.now(), poster:'you', league:'silver', bracket:'standard',
      asset:form.asset, duration:form.duration, stake:form.stake,
      description:form.description, posted:'just now',
      accepts:0, maxAccepts:form.maxAccepts, winRate:72, wins:18,
    }, ...p]);
  };

  return (
    <div style={{ fontFamily:'var(--font)', padding:'20px' }}>
      {showCreate && <CreateChallengeModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {accepted && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:32, width:360, textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>⚔️</div>
            <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Challenge Accepted!</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>vs <strong>{accepted.poster}</strong></div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>{accepted.duration} · {accepted.stake} entry · {accepted.asset}</div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setAccepted(null)} style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Close</button>
              <button onClick={() => setAccepted(null)} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>View Match →</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)' }}>Challenge Marketplace</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{challenges.length} open challenges · Matched to your league</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding:'9px 18px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Post Challenge</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:4 }}>
          {ASSET_CLASSES.map(a => (
            <button key={a} onClick={() => setFilterAsset(a)} style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background: filterAsset===a?'var(--accent)':'transparent', color: filterAsset===a?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:500, cursor:'pointer' }}>{a}</button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Sort:</span>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:11, color:'var(--text)', outline:'none' }}>
            <option value="recent">Recent</option>
            <option value="stake">Highest Stake</option>
            <option value="winrate">Win Rate</option>
          </select>
        </div>
      </div>

      {/* Challenge grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {filtered.length === 0
          ? <div style={{ gridColumn:'1/-1', padding:'40px', textAlign:'center', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No challenges match your filters.</div>
          : filtered.map(c => <ChallengeCard key={c.id} c={c} onAccept={handleAccept} onSpectate={onSpectate} />)
        }
      </div>
    </div>
  );
}
