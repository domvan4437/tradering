'use client';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

const PURPLE = '#4f46e5';

const THEMES = [
  { id:'dark',       label:'Dark',       bg:'#0f1117', surface:'#1a1d27', accent:'#4f46e5', desc:'Default dark mode'       },
  { id:'dark-gold',  label:'Dark Gold',  bg:'#0a0900', surface:'#111008', accent:'#c9a227', desc:'Warm gold accents'        },
  { id:'dark-blue',  label:'Dark Blue',  bg:'#060912', surface:'#0d1220', accent:'#3b82f6', desc:'Deep ocean blue'          },
  { id:'dark-green', label:'Dark Green', bg:'#040d08', surface:'#091410', accent:'#10b981', desc:'Matrix green vibes'       },
  { id:'light',      label:'Light',      bg:'#f5f6fa', surface:'#ffffff', accent:'#4f46e5', desc:'Clean light interface'    },
];

const NAV_SECTIONS = [
  { id:'home',      label:'Home — Dashboard'     },
  { id:'markets',   label:'Markets'              },
  { id:'charts',    label:'Charts'               },
  { id:'news',      label:'News'                 },
  { id:'community', label:'Community'            },
  { id:'compete',   label:'Compete'              },
  { id:'coach',     label:'AI Coach'             },
  { id:'journal',   label:'Journal'              },
  { id:'tools2',    label:'Tools'                },
];

const FONT_SIZES = [
  { id:'small',  label:'Small',  size:12 },
  { id:'medium', label:'Medium', size:14 },
  { id:'large',  label:'Large',  size:16 },
];

function Section({ title, desc, children }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', marginBottom:16 }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface2)' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:desc?3:0 }}>{title}</div>
        {desc && <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{desc}</div>}
      </div>
      <div style={{ padding:'18px 20px' }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text)', fontWeight:500 }}>{label}</div>
        {desc && <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{desc}</div>}
      </div>
      <button onClick={()=>onChange(!checked)}
        style={{ width:44, height:24, borderRadius:12, border:'none', background:checked?PURPLE:'var(--surface2)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0, outline:'1px solid var(--border)' }}>
        <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:checked?23:3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
      </button>
    </div>
  );
}

export default function SettingsTab({ user }) {
  const { theme, set: setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('appearance');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [fontSize, setFontSize] = useState(() => {
    try { return localStorage.getItem('tr_font_size') || 'medium'; } catch { return 'medium'; }
  });
  const [compactMode, setCompactMode] = useState(() => {
    try { return localStorage.getItem('tr_compact') === 'true'; } catch { return false; }
  });
  const [defaultSection, setDefaultSection] = useState(() => {
    try { return localStorage.getItem('tr_default_section') || 'home'; } catch { return 'home'; }
  });
  const [numberFormat, setNumberFormat] = useState(() => {
    try { return localStorage.getItem('tr_number_format') || 'en-US'; } catch { return 'en-US'; }
  });
  const [timezone, setTimezone] = useState(() => {
    try { return localStorage.getItem('tr_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
  });

  // Notification settings
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tr_notifs') || '{}'); } catch { return {}; }
  });
  const setNotif = (k, v) => setNotifs(p => ({ ...p, [k]: v }));

  // Privacy settings
  const [privacy, setPrivacy] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tr_privacy') || '{}'); } catch { return {}; }
  });
  const setPriv = (k, v) => setPrivacy(p => ({ ...p, [k]: v }));

  // Apply font size
  useEffect(() => {
    localStorage.setItem('tr_font_size', fontSize);
    const sizes = { small:'12px', medium:'14px', large:'16px' };
    document.documentElement.style.setProperty('--base-font-size', sizes[fontSize]);
  }, [fontSize]);

  // Apply compact mode
  useEffect(() => {
    localStorage.setItem('tr_compact', compactMode);
    document.documentElement.setAttribute('data-compact', compactMode ? 'true' : 'false');
  }, [compactMode]);

  const saveAll = async () => {
    setSaving(true);
    localStorage.setItem('tr_default_section', defaultSection);
    localStorage.setItem('tr_number_format', numberFormat);
    localStorage.setItem('tr_timezone', timezone);
    localStorage.setItem('tr_notifs', JSON.stringify(notifs));
    localStorage.setItem('tr_privacy', JSON.stringify(privacy));
    try {
      await fetch('/api/preferences', {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ theme, customFields: { fontSize, compactMode, defaultSection, numberFormat, timezone, notifs, privacy } })
      });
    } catch {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const exportData = async () => {
    const data = {
      exportedAt: new Date().toISOString(),
      settings: { theme, fontSize, compactMode, defaultSection, numberFormat, timezone },
      notes: JSON.parse(localStorage.getItem('tr_notes_v2') || '{}'),
      reviews: JSON.parse(localStorage.getItem('tr_reviews_v2') || '{}'),
      tradelog: JSON.parse(localStorage.getItem('tr_tradelog_v2') || '{}'),
      strategies: JSON.parse(localStorage.getItem('tr_strategies_v2') || '[]'),
      tradePlans: JSON.parse(localStorage.getItem('tr_trade_plans_v2') || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tradering_export_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
  };

  const SECTIONS = [
    { id:'appearance',    label:'🎨 Appearance'     },
    { id:'display',       label:'🖥️ Display'         },
    { id:'notifications', label:'🔔 Notifications'  },
    { id:'privacy',       label:'🔒 Privacy'         },
    { id:'subscription',  label:'💳 Subscription'   },
    { id:'data',          label:'📦 Data & Export'  },
  ];

  const inp = { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontFamily:'var(--font)', fontSize:13, padding:'9px 12px', outline:'none', width:'100%', boxSizing:'border-box', cursor:'pointer' };

  return (
    <div style={{ fontFamily:'var(--font)', maxWidth:860, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:6 }}>Account</div>
        <h2 style={{ fontSize:24, fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>Settings</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>Customize your TradeRing experience.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20, alignItems:'start' }}>

        {/* Sidebar nav */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:8, position:'sticky', top:20 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={()=>setActiveSection(s.id)}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'none', background:activeSection===s.id?PURPLE:'transparent', color:activeSection===s.id?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:activeSection===s.id?700:400, cursor:'pointer', textAlign:'left', marginBottom:2, transition:'all 0.15s' }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>

          {/* ── APPEARANCE ── */}
          {activeSection === 'appearance' && (
            <div>
              <Section title="Theme" desc="Choose your preferred color scheme">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
                  {THEMES.map(t => (
                    <div key={t.id} onClick={()=>setTheme(t.id)}
                      style={{ border:'2px solid '+(theme===t.id?PURPLE:'var(--border)'), borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'all 0.15s', boxShadow:theme===t.id?'0 0 0 3px rgba(79,70,229,0.2)':'none' }}>
                      {/* Preview */}
                      <div style={{ height:70, background:t.bg, padding:10, display:'flex', flexDirection:'column', gap:5 }}>
                        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:t.accent }}/>
                          <div style={{ height:4, width:30, background:t.accent, borderRadius:2, opacity:0.7 }}/>
                        </div>
                        <div style={{ height:4, width:'80%', background:t.surface, borderRadius:2, opacity:0.8 }}/>
                        <div style={{ height:4, width:'60%', background:t.surface, borderRadius:2, opacity:0.6 }}/>
                        <div style={{ height:4, width:'70%', background:t.surface, borderRadius:2, opacity:0.4 }}/>
                      </div>
                      {/* Label */}
                      <div style={{ padding:'8px 10px', background:t.surface, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                          <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:t.bg==='#f5f6fa'?'#111':'#f1f3f9' }}>{t.label}</div>
                          <div style={{ fontFamily:'var(--font)', fontSize:10, color:t.bg==='#f5f6fa'?'#6b7280':'#8b92a8' }}>{t.desc}</div>
                        </div>
                        {theme === t.id && <div style={{ width:16, height:16, borderRadius:'50%', background:PURPLE, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><span style={{ color:'#fff', fontSize:9, fontWeight:700 }}>✓</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:12, padding:'10px 14px', background:'var(--surface2)', borderRadius:8, fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>
                  Theme is saved automatically and synced to your account.
                </div>
              </Section>
            </div>
          )}

          {/* ── DISPLAY ── */}
          {activeSection === 'display' && (
            <div>
              <Section title="Font Size" desc="Adjust text size across the platform">
                <div style={{ display:'flex', gap:10 }}>
                  {FONT_SIZES.map(f => (
                    <button key={f.id} onClick={()=>setFontSize(f.id)}
                      style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid '+(fontSize===f.id?PURPLE:'var(--border)'), background:fontSize===f.id?'rgba(79,70,229,0.08)':'var(--surface2)', cursor:'pointer', transition:'all 0.15s' }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:f.size, fontWeight:700, color:fontSize===f.id?PURPLE:'var(--text)', marginBottom:3 }}>Aa</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:fontSize===f.id?PURPLE:'var(--text-muted)', fontWeight:fontSize===f.id?700:400 }}>{f.label}</div>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Layout" desc="Control spacing and density">
                <Toggle checked={compactMode} onChange={setCompactMode} label="Compact Mode" desc="Tighter spacing for more information on screen"/>
              </Section>

              <Section title="Default Landing Page" desc="Which section opens when you log in">
                <select value={defaultSection} onChange={e=>setDefaultSection(e.target.value)} style={inp}>
                  {NAV_SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Section>

              <Section title="Number Format" desc="How prices and P&L are displayed">
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { id:'en-US', label:'US Format',         example:'$1,234.56' },
                    { id:'en-GB', label:'UK / EU Format',    example:'£1.234,56' },
                    { id:'de-DE', label:'European Format',   example:'1.234,56 €' },
                    { id:'raw',   label:'Plain Numbers',     example:'1234.56'   },
                  ].map(f => (
                    <div key={f.id} onClick={()=>setNumberFormat(f.id)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:8, border:'1px solid '+(numberFormat===f.id?PURPLE:'var(--border)'), background:numberFormat===f.id?'rgba(79,70,229,0.06)':'var(--surface2)', cursor:'pointer', transition:'all 0.15s' }}>
                      <span style={{ fontFamily:'var(--font)', fontSize:13, color:numberFormat===f.id?PURPLE:'var(--text)', fontWeight:numberFormat===f.id?600:400 }}>{f.label}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{f.example}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Timezone" desc="Used for trade timestamps and economic calendar">
                <select value={timezone} onChange={e=>setTimezone(e.target.value)} style={inp}>
                  {[
                    'UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
                    'Europe/London','Europe/Paris','Europe/Berlin','Europe/Zurich',
                    'Asia/Tokyo','Asia/Hong_Kong','Asia/Singapore','Australia/Sydney',
                  ].map(tz => <option key={tz} value={tz}>{tz.replace('_',' ')}</option>)}
                </select>
                <div style={{ marginTop:8, fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>
                  Your detected timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </Section>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === 'notifications' && (
            <div>
              <Section title="Email Notifications" desc="Manage what TradeRing sends to your email">
                {[
                  { key:'weeklyDigest',    label:'Weekly Performance Digest',   desc:'Your weekly trade summary every Monday morning'       },
                  { key:'cotAlerts',       label:'COT Alert Triggers',          desc:'Email when a COT alert you set is triggered'          },
                  { key:'priceAlerts',     label:'Price Alerts',                desc:'Email when a price alert hits your target'            },
                  { key:'competitionEnd',  label:'Competition Results',         desc:'Notify when a competition you entered ends'           },
                  { key:'badgeEarned',     label:'Badge & Achievement Updates', desc:'When you earn a verified badge or achievement'        },
                  { key:'newFollower',     label:'New Followers',               desc:'When someone follows your public profile'            },
                  { key:'productUpdates',  label:'Product Updates',             desc:'New features and platform announcements (max monthly)'},
                ].map(n => (
                  <Toggle key={n.key} checked={notifs[n.key]||false} onChange={v=>setNotif(n.key,v)} label={n.label} desc={n.desc}/>
                ))}
              </Section>

              <Section title="In-App Notifications" desc="What shows in your notification feed">
                {[
                  { key:'inAppCot',     label:'COT Alert triggers',    desc:'Show in notification tray'   },
                  { key:'inAppCompete', label:'Competition updates',    desc:'Live competition status'      },
                  { key:'inAppFollow',  label:'New followers',         desc:'When someone follows you'    },
                  { key:'inAppMention', label:'Community mentions',    desc:'When someone mentions you'   },
                ].map(n => (
                  <Toggle key={n.key} checked={notifs[n.key]||false} onChange={v=>setNotif(n.key,v)} label={n.label} desc={n.desc}/>
                ))}
              </Section>
            </div>
          )}

          {/* ── PRIVACY ── */}
          {activeSection === 'privacy' && (
            <div>
              <Section title="Profile Privacy" desc="Control what others can see about you">
                {[
                  { key:'showPnl',         label:'Show P&L publicly',          desc:'Others can see your real dollar gains/losses'        },
                  { key:'showWinRate',     label:'Show win rate',               desc:'Display your win rate on your public profile'        },
                  { key:'showOnLeaderboard', label:'Appear on leaderboards',   desc:'Your name shows in global and competition rankings'  },
                  { key:'showTrades',      label:'Show trade history publicly', desc:'Others can browse your logged trades'               },
                  { key:'allowMessages',   label:'Allow direct messages',      desc:'Community members can message you'                   },
                  { key:'showOnline',      label:'Show online status',         desc:'Others can see when you are active'                  },
                ].map(n => (
                  <Toggle key={n.key} checked={privacy[n.key]||false} onChange={v=>setPriv(n.key,v)} label={n.label} desc={n.desc}/>
                ))}
              </Section>

              <Section title="Data Privacy" desc="How your data is used">
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { icon:'✅', text:'Your trade data is never sold to third parties' },
                    { icon:'✅', text:'Broker credentials are processed by Plaid — TradeRing never stores them' },
                    { icon:'✅', text:'You can export or delete all your data at any time' },
                    { icon:'✅', text:'All data is encrypted at rest and in transit' },
                  ].map((item,i) => (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{item.icon}</span>
                      <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── SUBSCRIPTION ── */}
          {activeSection === 'subscription' && (
            <div>
              <Section title="Current Plan" desc="Your active TradeRing subscription">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', marginBottom:16 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:3, textTransform:'capitalize' }}>
                      {user?.plan || 'Free'} Plan
                    </div>
                    <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>
                      {user?.subscriptionStatus === 'active' ? 'Active subscription' : 'No active subscription'}
                      {user?.trialEndsAt && new Date(user.trialEndsAt) > new Date() && ' · Trial ends '+new Date(user.trialEndsAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ padding:'6px 16px', borderRadius:20, background: user?.plan==='free'?'var(--surface)':'rgba(79,70,229,0.1)', border:'1px solid '+(user?.plan==='free'?'var(--border)':'rgba(79,70,229,0.3)'), fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:user?.plan==='free'?'var(--text-muted)':'#4f46e5', textTransform:'capitalize' }}>
                    {user?.plan || 'Free'}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    { plan:'Pro',    price:'$29/mo',  features:['Unlimited screeners','AI Coach','Trade Plans','Priority support'] },
                    { plan:'Trader', price:'$79/mo',  features:['Everything in Pro','Prop firm referrals','Creator tools','API access'] },
                  ].map(p => (
                    <div key={p.plan} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{p.plan}</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:'#4f46e5', marginBottom:10 }}>{p.price}</div>
                      {p.features.map(f => (
                        <div key={f} style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:4, display:'flex', gap:6 }}>
                          <span style={{ color:'var(--green)', flexShrink:0 }}>✓</span>{f}
                        </div>
                      ))}
                      <button onClick={()=>window.location.href='/api/stripe/checkout?plan='+p.plan.toLowerCase()}
                        style={{ width:'100%', marginTop:12, padding:'9px', borderRadius:8, border:'none', backgroundColor:'#4f46e5', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        {user?.plan===p.plan.toLowerCase()?'Current Plan':'Upgrade to '+p.plan}
                      </button>
                    </div>
                  ))}
                </div>

                {user?.subscriptionId && (
                  <button onClick={()=>fetch('/api/stripe/portal',{method:'POST'}).then(r=>r.json()).then(d=>{if(d.url)window.location.href=d.url;})}
                    style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Manage Billing & Invoices →
                  </button>
                )}
              </Section>
            </div>
          )}

          {/* ── DATA & EXPORT ── */}
          {activeSection === 'data' && (
            <div>
              <Section title="Export Your Data" desc="Download everything you've created on TradeRing">
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ padding:'14px 16px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>Full Data Export</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Notes, reviews, trade log, strategies, plans — everything as JSON</div>
                    </div>
                    <button onClick={exportData}
                      style={{ padding:'7px 16px', borderRadius:8, border:'none', backgroundColor:'#4f46e5', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                      ↓ Export JSON
                    </button>
                  </div>

                  <div style={{ padding:'14px 16px', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>Trade Log CSV</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>All logged trades in spreadsheet format</div>
                    </div>
                    <button onClick={()=>{
                      const trades = JSON.parse(localStorage.getItem('tr_tradelog_v2')||'{}').trades||[];
                      if(!trades.length){alert('No trades to export');return;}
                      const keys = Object.keys(trades[0]?.fields||{});
                      const csv = [keys.join(','),...trades.map(t=>keys.map(k=>(t.fields?.[k]||'').toString().replace(/,/g,';')).join(','))].join('\n');
                      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='trades.csv';a.click();
                    }}
                      style={{ padding:'7px 16px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                      ↓ Export CSV
                    </button>
                  </div>
                </div>
              </Section>

              <Section title="Clear Local Data" desc="Reset cached data stored in your browser">
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'Clear COT Dashboard Cache',   key:'cot',      action:()=>{ Object.keys(localStorage).filter(k=>k.includes('cot')).forEach(k=>localStorage.removeItem(k)); alert('COT cache cleared'); } },
                    { label:'Clear Chart Preferences',     key:'charts',   action:()=>{ localStorage.removeItem('tr_chart_prefs'); alert('Chart preferences cleared'); } },
                    { label:'Reset All Local Settings',    key:'all',      action:()=>{ if(window.confirm('Reset all local settings to defaults?')){ ['tr_font_size','tr_compact','tr_default_section','tr_number_format','tr_timezone','tr_notifs','tr_privacy'].forEach(k=>localStorage.removeItem(k)); window.location.reload(); } } },
                  ].map(item => (
                    <div key={item.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--surface2)', borderRadius:8, border:'1px solid var(--border)' }}>
                      <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text)' }}>{item.label}</span>
                      <button onClick={item.action}
                        style={{ padding:'5px 14px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        Clear
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* Save button */}
          {activeSection !== 'appearance' && activeSection !== 'subscription' && (
            <button onClick={saveAll} disabled={saving}
              style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', backgroundColor:saving?'var(--surface2)':saved?'var(--green)':'#4f46e5', color:saving?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', transition:'all 0.2s', marginTop:4 }}>
              {saving?'Saving…':saved?'✓ Settings Saved':'Save Settings'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
