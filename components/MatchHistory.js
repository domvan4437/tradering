'use client';
import { useState } from 'react';

const MOCK_MATCHES = [
  {
    id:1, type:'H2H', result:'win', opponent:'fxswing99', opponentLeague:'silver',
    asset:'Gold (GC=F)', duration:'1 Week', settled:'2 days ago', stake:'$50', pnl:'+$50',
    myStats:{ pnl:'+8.4%', pnlDollar:'+$420', trades:3, winTrades:2, lossTrades:1, bestTrade:'+$280', worstTrade:'-$60', avgHold:'18h 24m', avgEntry:'Good', avgStop:'Excellent' },
    oppStats:{ pnl:'-2.1%', pnlDollar:'-$105', trades:2, winTrades:0, lossTrades:2, bestTrade:'-$40', worstTrade:'-$65', avgHold:'6h 12m', avgEntry:'Poor', avgStop:'Fair' },
    grades:{ entryTiming:'A', stopPlacement:'A+', positionSizing:'B+', riskManagement:'A', tradeFrequency:'B', overall:'A' },
    trades:[
      { id:1, asset:'Silver (SI=F)', dir:'Long', entry:'$31.90', exit:'$32.14', entryTime:'Mon 10:15', exitTime:'Tue 04:32', hold:'18h 17m', pnl:'+$180', pct:'+0.75%', grade:'A', note:'Perfect COT entry — commercials at 78th percentile, strong seasonal. Held through overnight session.', entryScore:92, stopScore:88 },
      { id:2, asset:'Gold (GC=F)', dir:'Long', entry:'$3,241', exit:'$3,287', entryTime:'Wed 09:00', exitTime:'Thu 14:20', hold:'29h 20m', pnl:'+$300', pct:'+1.42%', grade:'A+', note:'Breakout above key resistance with COT confirming. Scaled out at target. Best trade of the week.', entryScore:95, stopScore:94 },
      { id:3, asset:'Gold (GC=F)', dir:'Long', entry:'$3,199', exit:'$3,187', entryTime:'Fri 08:45', exitTime:'Fri 14:00', hold:'5h 15m', pnl:'-$60', pct:'-0.37%', grade:'B-', note:'Chased the move — entered late after momentum. Stop was correctly placed but entry was sloppy.', entryScore:61, stopScore:82 },
    ],
    aiSummary: 'Strong performance this week. Your COT-based entries in silver and gold showed excellent timing and patience. The third trade reveals a tendency to chase momentum after missing a setup — your entry score dropped 30 points vs your first two trades. Consider waiting for a pullback before entering when price has already moved significantly. Stop placement was consistently excellent, keeping losses small when wrong.',
    oppTrades:[
      { id:1, asset:'Gold (GC=F)', dir:'Short', entry:'$3,201', exit:'$3,241', hold:'4h 30m', pnl:'-$65', pct:'-1.25%', grade:'D', note:'Faded a strong uptrend — low probability setup' },
      { id:2, asset:'Gold (GC=F)', dir:'Short', entry:'$3,198', exit:'$3,238', hold:'7h 54m', pnl:'-$40', pct:'-0.37%', grade:'D+', note:'Second attempt to short into strength' },
    ],
  },
  {
    id:2, type:'H2H', result:'loss', opponent:'seasonalace', opponentLeague:'gold',
    asset:'Forex (EUR/USD)', duration:'3 Days', settled:'1 week ago', stake:'$25', pnl:'-$25',
    myStats:{ pnl:'-3.2%', pnlDollar:'-$160', trades:4, winTrades:1, lossTrades:3, bestTrade:'+$80', worstTrade:'-$120', avgHold:'8h 10m', avgEntry:'Fair', avgStop:'Poor' },
    oppStats:{ pnl:'+5.8%', pnlDollar:'+$290', trades:2, winTrades:2, lossTrades:0, bestTrade:'+$190', worstTrade:'+$100', avgHold:'22h 30m', avgEntry:'Excellent', avgStop:'Good' },
    grades:{ entryTiming:'C+', stopPlacement:'C', positionSizing:'B', riskManagement:'C', tradeFrequency:'D', overall:'C' },
    trades:[
      { id:1, asset:'EUR/USD', dir:'Long', entry:'1.0842', exit:'1.0901', hold:'22h', pnl:'+$80', pct:'+0.54%', grade:'B+', note:'', entryScore:78, stopScore:72 },
      { id:2, asset:'EUR/USD', dir:'Long', entry:'1.0901', exit:'1.0868', hold:'3h', pnl:'-$120', pct:'-0.30%', grade:'D', note:'Overtraded — averaged up into a losing position', entryScore:42, stopScore:38 },
      { id:3, asset:'EUR/USD', dir:'Short', entry:'1.0865', exit:'1.0890', hold:'5h', pnl:'-$75', pct:'-0.23%', grade:'D+', note:'Revenge traded after loss', entryScore:35, stopScore:45 },
      { id:4, asset:'GBP/USD', dir:'Long', entry:'1.2701', exit:'1.2680', hold:'2h', pnl:'-$45', pct:'-0.16%', grade:'C', note:'Premature exit on normal pullback', entryScore:55, stopScore:48 },
    ],
    aiSummary: 'Difficult session — you overtraded significantly. After a solid first trade, three consecutive impulsive entries led to losses. The data shows your entry score dropped from 78 on trade 1 to 35 on trade 3, a classic sign of emotional trading. Your opponent made 2 clean, patient trades while you made 4 rushed ones. Key lesson: quality over quantity. Your best trades come when you wait for full confluence.',
    oppTrades:[],
  },
];

const GRADE_COLORS = { 'A+':'#16a34a','A':'#16a34a','A-':'#16a34a','B+':'#0891b2','B':'#0891b2','B-':'#0891b2','C+':'#d97706','C':'#d97706','C-':'#d97706','D+':'#dc2626','D':'#dc2626','D-':'#dc2626' };

function GradeBadge({ grade, size='md' }) {
  const color = GRADE_COLORS[grade] || 'var(--text-muted)';
  const sz = size==='lg' ? { width:44, height:44, fontSize:18 } : { width:28, height:28, fontSize:12 };
  return <div style={{ ...sz, borderRadius:'50%', background:`${color}20`, border:`2px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontWeight:800, color, flexShrink:0 }}>{grade}</div>;
}

function ScoreBar({ score, label }) {
  const color = score>=80?'var(--green)':score>=60?'#d97706':'var(--red)';
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{label}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color }}>{score}/100</span>
      </div>
      <div style={{ height:4, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${score}%`, background:color, borderRadius:2, transition:'width 0.6s' }} />
      </div>
    </div>
  );
}

function TradeReview({ trade, isOpp }) {
  const [expanded, setExpanded] = useState(false);
  const up = trade.pnl.startsWith('+');
  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:8 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer', background: expanded?'var(--surface2)':'transparent' }}>
        {!isOpp && <GradeBadge grade={trade.grade} />}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text)' }}>{trade.asset}</span>
            <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:4, background: trade.dir==='Long'?'var(--green-bg)':'var(--red-bg)', color: trade.dir==='Long'?'var(--green)':'var(--red)' }}>{trade.dir}</span>
            <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{trade.hold}</span>
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Entry {trade.entry} → Exit {trade.exit}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color: up?'var(--green)':'var(--red)' }}>{trade.pnl}</div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, color: up?'var(--green)':'var(--red)' }}>{trade.pct}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ transform: expanded?'rotate(180deg)':'none', transition:'transform 0.2s', flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {expanded && !isOpp && (
        <div style={{ padding:'14px', borderTop:'1px solid var(--border)', background:'var(--surface)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:12 }}>
            <div>
              <ScoreBar score={trade.entryScore} label="Entry Timing" />
              <ScoreBar score={trade.stopScore} label="Stop Placement" />
            </div>
            <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>AI Review</div>
              <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)', lineHeight:1.5 }}>{trade.note || 'No specific notes for this trade.'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchDetail({ match, onBack, onExportNote }) {
  const [tab, setTab] = useState('overview');
  const isWin = match.result === 'win';

  return (
    <div style={{ fontFamily:'var(--font)', padding:'20px' }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, marginBottom:16, padding:0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Match History
      </button>

      {/* Result banner */}
      <div style={{ background: isWin?'var(--green-bg)':'var(--red-bg)', border:`1px solid ${isWin?'var(--green-border)':'var(--red-border)'}`, borderRadius:14, padding:'20px', marginBottom:16, textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:32, marginBottom:4 }}>{isWin?'🏆':'📊'}</div>
        <div style={{ fontFamily:'var(--font)', fontSize:22, fontWeight:800, color: isWin?'var(--green)':'var(--red)', marginBottom:4 }}>{isWin?'Victory':'Defeat'}</div>
        <div style={{ fontFamily:'var(--font)', fontSize:13, color: isWin?'var(--green)':'var(--red)', marginBottom:4 }}>vs {match.opponent} · {match.asset} · {match.duration}</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color: isWin?'var(--green)':'var(--red)' }}>{match.pnl} {isWin?'won':'lost'} · Settled {match.settled}</div>
      </div>

      {/* Overall grade */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {Object.entries(match.grades).map(([k,v]) => (
          <div key={k} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px', textAlign:'center' }}>
            {k==='overall'
              ? <><GradeBadge grade={v} size="lg" /><div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:6, textTransform:'capitalize' }}>Overall Grade</div></>
              : <><div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:800, color: GRADE_COLORS[v]||'var(--text)' }}>{v}</div><div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', textTransform:'capitalize' }}>{k.replace(/([A-Z])/g,' $1').trim()}</div></>
            }
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:16 }}>
        {['overview','my trades','opponent','ai review'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 14px', background:'none', border:'none', borderBottom: tab===t?'2px solid var(--accent)':'2px solid transparent', color: tab===t?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight: tab===t?700:400, cursor:'pointer', textTransform:'capitalize', whiteSpace:'nowrap' }}>{t}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[
              { label:'You', stats:match.myStats, color:'var(--accent)' },
              { label:match.opponent, stats:match.oppStats, color:'var(--text-muted)' },
            ].map(side => (
              <div key={side.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px' }}>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:side.color, marginBottom:10 }}>{side.label}</div>
                {[
                  ['P&L', side.stats.pnl, side.stats.pnl.startsWith('+')?'var(--green)':'var(--red)'],
                  ['Dollar', side.stats.pnlDollar, side.stats.pnlDollar.startsWith('+')?'var(--green)':'var(--red)'],
                  ['Trades', `${side.stats.trades} (${side.stats.winTrades}W/${side.stats.lossTrades}L)`, 'var(--text)'],
                  ['Best Trade', side.stats.bestTrade, 'var(--green)'],
                  ['Worst Trade', side.stats.worstTrade, 'var(--red)'],
                  ['Avg Hold', side.stats.avgHold, 'var(--text)'],
                  ['Entry Quality', side.stats.avgEntry, 'var(--text)'],
                  ['Stop Quality', side.stats.avgStop, 'var(--text)'],
                ].map(([label,val,color]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='my trades' && (
        <div>
          {match.trades.map(t => <TradeReview key={t.id} trade={t} isOpp={false} />)}
        </div>
      )}

      {tab==='opponent' && (
        <div>
          {match.oppTrades.length === 0
            ? <div style={{ padding:'30px', textAlign:'center', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Opponent trade details are private for this match.</div>
            : match.oppTrades.map(t => <TradeReview key={t.id} trade={t} isOpp={true} />)
          }
        </div>
      )}

      {tab==='ai review' && (
        <div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>AI Performance Analysis</div>
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text)', lineHeight:1.7 }}>{match.aiSummary}</div>
          </div>
          <button onClick={() => onExportNote(match)} style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid var(--accent)', background:'var(--accent-bg)', color:'var(--accent)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Export to My Notes
          </button>
        </div>
      )}
    </div>
  );
}

export default function MatchHistory({ onExportNote }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [historyTab, setHistoryTab] = useState('h2h');

  const matches = MOCK_MATCHES.filter(m => filter==='all' || m.result===filter);

  if(selected) return <MatchDetail match={selected} onBack={() => setSelected(null)} onExportNote={onExportNote} />;

  return (
    <div style={{ fontFamily:'var(--font)', padding:'20px' }}>
      {/* H2H / Group Contests subtabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', margin:'-20px -20px 20px -20px' }}>
        {[['h2h','H2H Matches'],['group','Group Contests']].map(([key,lbl]) => (
          <button key={key} onClick={() => setHistoryTab(key)} style={{ padding:'11px 16px', background:'none', border:'none', borderBottom: historyTab===key?'2px solid var(--accent)':'2px solid transparent', color: historyTab===key?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight: historyTab===key?700:400, cursor:'pointer', whiteSpace:'nowrap' }}>
            {lbl}
          </button>
        ))}
      </div>

      {historyTab === 'h2h' && (
        <div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Match History</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Detailed post-match analytics · Grades · AI review</div>
          </div>

          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
            {[
              { label:'Total Matches', value:'18', color:'var(--text)' },
              { label:'Wins', value:'13', color:'var(--green)' },
              { label:'Losses', value:'5', color:'var(--red)' },
              { label:'Avg Grade', value:'B+', color:'#0891b2' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:800, color:s.color, marginBottom:2 }}>{s.value}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:6, marginBottom:14 }}>
            {['all','win','loss'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:'5px 14px', borderRadius:20, border:'1px solid var(--border)', background: filter===f?'var(--accent)':'transparent', color: filter===f?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:500, cursor:'pointer', textTransform:'capitalize' }}>{f==='all'?'All':f==='win'?'Wins':'Losses'}</button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {matches.map(m => {
              const isWin = m.result === 'win';
              return (
                <div key={m.id} onClick={() => setSelected(m)} style={{ background:'var(--surface)', border:`1px solid ${isWin?'var(--green-border)':'var(--red-border)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:12 }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background='var(--surface)'}>
                  <div style={{ width:40, height:40, borderRadius:10, background: isWin?'var(--green-bg)':'var(--red-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{isWin?'🏆':'📉'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>vs {m.opponent}</span>
                      <span style={{ fontFamily:'var(--font)', fontSize:10, padding:'1px 6px', borderRadius:4, background: isWin?'var(--green-bg)':'var(--red-bg)', color: isWin?'var(--green)':'var(--red)', fontWeight:600 }}>{isWin?'WIN':'LOSS'}</span>
                      <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{m.grades.overall} grade</span>
                    </div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.type} · {m.asset} · {m.duration} · {m.settled}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color: isWin?'var(--green)':'var(--red)' }}>{m.pnl}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{m.myStats.pnl} P&L</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {historyTab === 'group' && (
        <div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Group Contest History</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Your past group contest results</div>
          </div>
          {[
            { name:'May Commodities Cup', result:'win', rank:2, prize:'+$1,260', pnl:'+8.1%', group:'Metal Bulls', traders:9, settled:'2 weeks ago' },
            { name:'COT Futures Sprint', result:'win', rank:1, prize:'+$800', pnl:'+12.3%', group:'Metal Bulls', traders:6, settled:'1 month ago' },
            { name:'Forex Weekly Open', result:'loss', rank:4, prize:'—', pnl:'+2.1%', group:'Metal Bulls', traders:8, settled:'2 months ago' },
          ].map((c,i) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid '+(c.result==='win'?'var(--green-border)':'var(--border)'), borderRadius:12, padding:'16px', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.name}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.group} · {c.traders} traders · {c.settled}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:20, fontWeight:700, color:c.result==='win'?'var(--green)':'var(--text-muted)' }}>{c.prize}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Rank #{c.rank}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ background:'var(--surface2)', borderRadius:8, padding:'8px 12px', flex:1, textAlign:'center' }}><div style={{ fontSize:16, fontWeight:700, color:'var(--green)', fontFamily:'var(--font)' }}>{c.pnl}</div><div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font)' }}>P&L</div></div>
                <div style={{ background:'var(--surface2)', borderRadius:8, padding:'8px 12px', flex:1, textAlign:'center' }}><div style={{ fontSize:16, fontWeight:700, color:'var(--accent)', fontFamily:'var(--font)' }}>#{c.rank}</div><div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font)' }}>Rank</div></div>
                <div style={{ background:'var(--surface2)', borderRadius:8, padding:'8px 12px', flex:1, textAlign:'center' }}><div style={{ fontSize:16, fontWeight:700, color:c.result==='win'?'var(--green)':'var(--red)', fontFamily:'var(--font)' }}>{c.result==='win'?'Won':'Lost'}</div><div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font)' }}>Result</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
