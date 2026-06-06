'use client';
import { useState } from 'react';

const STEPS = [
  { key:'broker',      label:'Connect a Broker',         desc:'Link at least one brokerage account. This verifies your trades are real.',                   required:true },
  { key:'trades',      label:'25+ Verified Trade Calls', desc:'Post at least 25 trade calls. We need enough data to confirm consistency.',                   required:true },
  { key:'account_age', label:'30+ Days Active',          desc:'Your account must be at least 30 days old.',                                                  required:true },
  { key:'identity',    label:'Identity Confirmation',    desc:'Confirm your name and agree to our Creator Terms.',                                            required:true },
];

const TIERS = [
  { name:'Verified Creator', badge:'✓', color:'var(--accent)', bg:'var(--accent-bg)', border:'var(--accent-border)',
    perks:['Verified badge on your profile and all posts','Create paid private groups (you set the price)','TradeZar takes 10% — you keep 90%','Featured in Who to Follow recommendations'],
    note:'Performance display is opt-in. You choose what to show.' },
  { name:'Elite Creator', badge:'★', color:'#d97706', bg:'rgba(217,119,6,0.08)', border:'rgba(217,119,6,0.25)',
    perks:['Everything in Verified Creator','Gold star badge — top 5% performers only','Reduced platform fee — TradeZar takes 5%','Monthly featured spotlight to all users'],
    note:'Requires 60%+ win rate over 100+ trades, sustained 12 months.' },
];

const EARN = [
  { title:'Paid Private Groups', desc:'Create a members-only group. Set your monthly price. TradeZar handles billing, you focus on content.', bg:'var(--accent-bg)' },
  { title:'Premium Posts',       desc:'Gate individual analysis posts behind a one-time fee. Followers pay per piece of content.',             bg:'rgba(16,185,129,0.08)' },
  { title:'Trade Alerts',        desc:'Subscribers get notified instantly when you post a new trade call. Real-time, verified.',               bg:'rgba(217,119,6,0.08)' },
];

function Step({ s, done, active, i }) {
  return (
    <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0,
        background: done?'var(--green)':active?'var(--accent)':'var(--surface3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font)', fontSize:13, fontWeight:700, color: done||active?'#fff':'var(--text-muted)' }}>
        {done ? '✓' : i+1}
      </div>
      <div style={{ flex:1, paddingTop:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600,
            color: done?'var(--green)':active?'var(--text)':'var(--text-muted)' }}>{s.label}</span>
          {s.required && <span style={{ fontSize:9, fontWeight:600, color:'var(--red)', background:'var(--red-bg)', padding:'1px 6px', borderRadius:10 }}>Required</span>}
          {done && <span style={{ fontSize:10, color:'var(--green)' }}>Complete</span>}
        </div>
        <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.55 }}>{s.desc}</div>
        {active && (
          <button style={{ marginTop:10, padding:'7px 18px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            {s.key==='broker'?'Connect Broker →':s.key==='identity'?'Verify Identity →':'View Progress →'}
          </button>
        )}
      </div>
    </div>
  );
}

function Earnings({ price }) {
  if (!price || isNaN(parseFloat(price))) return null;
  const p = parseFloat(price);
  const earn = (p*0.9).toFixed(2);
  const fee  = (p*0.1).toFixed(2);
  return (
    <span style={{ fontSize:12, color:'var(--text-muted)' }}>
      You earn <strong style={{ color:'var(--green)' }}>${earn}/member/month</strong> · TradeZar keeps ${fee}
    </span>
  );
}

export default function CreatorStudioTab({ user }) {
  const [tab, setTab]               = useState('overview');
  const [showWin, setShowWin]       = useState(false);
  const [showPnL, setShowPnL]       = useState(false);
  const [price,   setPrice]         = useState('');
  const [gname,   setGname]         = useState('');
  const [gdesc,   setGdesc]         = useState('');
  const progress = { broker:false, trades:false, account_age:true, identity:false };
  const done = Object.values(progress).filter(Boolean).length;
  const isVerified = done === STEPS.length;
  const activeStep = STEPS.find(s => !progress[s.key]);
  const TABS = ['overview','verification','monetize','performance'];
  const s = (k) => ({ padding:'10px 18px', background:'none', border:'none',
    borderBottom: tab===k?'2px solid var(--accent)':'2px solid transparent',
    color: tab===k?'var(--accent)':'var(--text-muted)',
    fontFamily:'var(--font)', fontSize:13, fontWeight: tab===k?700:400, cursor:'pointer', textTransform:'capitalize' });
  return (
    <div style={{ fontFamily:'var(--font)', maxWidth:900, margin:'0 auto', padding:'28px 24px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>Community</div>
        <div style={{ fontSize:24, fontWeight:700, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:4 }}>Creator Studio</div>
        <div style={{ fontSize:13, color:'var(--text-muted)' }}>{isVerified ? 'You are a Verified Creator ✓' : done + ' of ' + STEPS.length + ' steps complete'}</div>
      </div>
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:28 }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={s(t)}>{t}</button>)}
      </div>

      {tab==='overview' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
            {TIERS.map(tier => (
              <div key={tier.name} style={{ border:'1px solid '+tier.border, borderRadius:14, padding:'20px 22px', background:tier.bg }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:tier.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', fontWeight:800 }}>{tier.badge}</div>
                  <span style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>{tier.name}</span>
                </div>
                {tier.perks.map((p,i) => (
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                    <span style={{ color:tier.color, fontSize:12, flexShrink:0, marginTop:2 }}>✓</span>
                    <span style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{p}</span>
                  </div>
                ))}
                <div style={{ fontSize:11, color:'var(--text-muted)', fontStyle:'italic', borderTop:'1px solid var(--border)', paddingTop:10, marginTop:8 }}>{tier.note}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            {EARN.map(m => (
              <div key={m.title} style={{ border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', background:m.bg }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{m.title}</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.55 }}>{m.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:3 }}>Ready to become a Verified Creator?</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>Connect your broker and complete verification to unlock all creator features.</div>
            </div>
            <button onClick={() => setTab('verification')} style={{ padding:'10px 22px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', marginLeft:20 }}>Start Verification →</button>
          </div>
        </div>
      )}

      {tab==='verification' && (
        <div>
          <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Progress</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent)' }}>{done}/{STEPS.length}</span>
            </div>
            <div style={{ height:6, background:'var(--surface3)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width: (done/STEPS.length*100)+'%', height:'100%', background:'var(--accent)', borderRadius:3 }} />
            </div>
          </div>
          <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:12, padding:'16px 20px', marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:8 }}>What Verified Creator means on TradeZar</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>
              The badge confirms your trades are real — connected to your brokerage. It does not require a specific win rate. Any trader who connects their broker and meets activity thresholds can become verified. Performance display is your choice.
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {STEPS.map((s,i) => <Step key={s.key} s={s} done={progress[s.key]} active={!progress[s.key]&&s===activeStep} i={i} />)}
          </div>
        </div>
      )}

      {tab==='monetize' && (
        <div>
          {!isVerified && (
            <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'20px', textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Verification required to monetize</div>
              <button onClick={() => setTab('verification')} style={{ padding:'9px 20px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>Complete Verification →</button>
            </div>
          )}
          <div style={{ border:'1px solid var(--border)', borderRadius:14, padding:'22px', opacity: isVerified?1:0.5, pointerEvents: isVerified?'auto':'none' }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Create a Paid Group</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:18 }}>Members pay a monthly fee you set. You keep 90%.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <input value={gname} onChange={e=>setGname(e.target.value)} placeholder='Group Name' style={{ padding:'10px 14px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none' }} />
              <textarea value={gdesc} onChange={e=>setGdesc(e.target.value)} placeholder='What do members get?' rows={3} style={{ padding:'10px 14px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', resize:'none' }} />
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', width:120 }}>
                  <span style={{ fontSize:13, color:'var(--text-muted)' }}>$</span>
                  <input type='number' value={price} onChange={e=>setPrice(e.target.value)} placeholder='29' style={{ border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', width:'100%' }} />
                </div>
                <Earnings price={price} />
              </div>
              <button style={{ padding:'11px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>Create Group</button>
            </div>
          </div>
        </div>
      )}

      {tab==='performance' && (
        <div>
          <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'18px 20px', marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Performance Display — Your Choice</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.65, marginBottom:16 }}>
              Verification confirms your trades are real. What you show publicly is entirely up to you. Choosing not to display numbers is not a negative signal.
            </div>
            {[
              { label:'Show Win Rate publicly',  val:showWin, set:setShowWin, value:'67%',              note:'Displays on your profile and creator card' },
              { label:'Show P&L publicly',       val:showPnL, set:setShowPnL, value:'+$8,420 lifetime', note:'Displays total verified P&L from connected brokers' },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', border:'1px solid var(--border)', borderRadius:10, marginBottom:10, background: item.val?'var(--accent-bg)':'transparent' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{item.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.note}</div>
                  {item.val && <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--green)', marginTop:4 }}>{item.value}</div>}
                </div>
                <div onClick={() => item.set(!item.val)} style={{ width:44, height:24, borderRadius:12, background: item.val?'var(--accent)':'var(--surface3)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left: item.val?23:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}