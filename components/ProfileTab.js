'use client';
import { useState, useEffect, useRef } from 'react';
import { Panel, PanelHeader, Btn, Badge } from './DS';

const PURPLE = '#4f46e5';

const TRADER_STYLES = ['scalper','daytrader','swing','position','macro'];

const ASSET_OPTIONS = [
  'Gold','Silver','Copper','Crude Oil','Natural Gas','Platinum','Palladium',
  'Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa','Live Cattle',
  'EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','USD/CHF','NZD/USD',
  'S&P 500','Nasdaq','Dow Jones','Russell 2000',
  'Bitcoin','Ethereum','Solana','BNB','XRP',
  'AAPL','NVDA','TSLA','SPY','QQQ',
];

const BADGE_CRITERIA = [
  { key:'isPublic',     label:'Profile set to Public',   desc:'Required to appear on leaderboards' },
  { key:'accountAge',   label:'Account 90+ days old',    desc:'Builds trust over time'              },
  { key:'enoughTrades', label:'50+ verified trade calls',desc:'Enough data to be meaningful'        },
  { key:'winRate',      label:'Win rate 50%+',           desc:'Consistent profitability'            },
  { key:'avgRR',        label:'Average R:R 1.2+',        desc:'Quality over quantity'               },
];

function Avatar({ name, size=80 }) {
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  const color = colors[(name||'').charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:size*0.35, fontWeight:800, color:'#fff', flexShrink:0, border:'3px solid var(--border)' }}>
      {initials}
    </div>
  );
}

function ProfilePreviewCard({ profile, user }) {
  const assets = profile.primaryAssets?.slice(0,4) || [];
  const styleLabel = profile.tradingStyle ? profile.tradingStyle.charAt(0).toUpperCase()+profile.tradingStyle.slice(1) : null;
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', fontFamily:'var(--font)' }}>
      <div style={{ height:60, background:'linear-gradient(135deg, '+PURPLE+' 0%, #7c3aed 100%)' }}/>
      <div style={{ padding:'0 20px 20px', marginTop:-30 }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:12 }}>
          <Avatar name={profile.displayName||user?.name} size={56}/>
          {user?.verifiedBadge && (
            <div style={{ marginBottom:4, padding:'2px 10px', borderRadius:20, background:PURPLE, color:'#fff', fontSize:10, fontWeight:700 }}>✓ VERIFIED</div>
          )}
        </div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{profile.displayName || 'Your Name'}</div>
        {profile.profileSlug && <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>tradering.com/p/{profile.profileSlug}</div>}
        {profile.bio && <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom:10 }}>{profile.bio.slice(0,120)}{profile.bio.length>120?'...':''}</div>}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
          {styleLabel && <span style={{ fontSize:10, fontWeight:600, color:PURPLE, background:'rgba(79,70,229,0.1)', padding:'2px 8px', borderRadius:20, border:'1px solid rgba(79,70,229,0.2)' }}>{styleLabel}</span>}
          {assets.map(a => <span key={a} style={{ fontSize:10, color:'var(--text-muted)', background:'var(--surface2)', padding:'2px 8px', borderRadius:20, border:'1px solid var(--border)' }}>{a}</span>)}
        </div>
        <div style={{ display:'flex', gap:16, borderTop:'1px solid var(--border)', paddingTop:10 }}>
          {[
            { label:'Win Rate', value: user?.consistency?.winRate ? Math.round(user.consistency.winRate*100)+'%' : '—' },
            { label:'Trades',   value: user?.consistency?.totalTrades || '—' },
            { label:'Consistency', value: user?.consistency?.consistencyScore ? user.consistency.consistencyScore+'/100' : '—' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfileTab({ user, session }) {
  const [profile, setProfile] = useState({
    displayName:       user?.displayName || user?.name || '',
    bio:               user?.bio || '',
    tradingStyle:      user?.tradingStyle || '',
    primaryAssets:     user?.primaryAssets ? (typeof user.primaryAssets === 'string' ? JSON.parse(user.primaryAssets) : user.primaryAssets) : [],
    profileVisibility: user?.profileVisibility || 'private',
    twitterHandle:     user?.twitterHandle || '',
    instagramHandle:   user?.instagramHandle || '',
    youtubeHandle:     user?.youtubeHandle || '',
    tradingviewHandle: user?.tradingviewHandle || '',
    profileSlug:       user?.profileSlug || '',
    propFirmInterest:  user?.propFirmInterest || false,
  });
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState('');
  const [badgeStatus, setBadgeStatus]   = useState(null);
  const [checkingBadge, setCheckingBadge] = useState(false);
  const [propFirms, setPropFirms]       = useState([]);
  const [activeTab, setActiveTab]       = useState('profile');
  const [linkCopied, setLinkCopied]     = useState(false);
  const [showDanger, setShowDanger]     = useState(false);

  useEffect(() => {
    fetch('/api/prop-firms').then(r=>r.json()).then(d=>setPropFirms(d.firms||[])).catch(()=>{});
  }, []);

  const set = (k,v) => setProfile(p=>({...p,[k]:v}));

  const toggleAsset = (asset) => {
    setProfile(p => ({
      ...p,
      primaryAssets: p.primaryAssets.includes(asset)
        ? p.primaryAssets.filter(a=>a!==asset)
        : [...p.primaryAssets, asset].slice(0,5),
    }));
  };

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/profile/update', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(()=>setSaved(false), 3000);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const checkBadge = async () => {
    setCheckingBadge(true);
    const res = await fetch('/api/profile/award-badge', { method:'POST' });
    const data = await res.json();
    setBadgeStatus(data);
    setCheckingBadge(false);
  };

  const applyToFirm = async (firmSlug) => {
    const res = await fetch('/api/prop-firms', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ firmSlug }),
    });
    const data = await res.json();
    if (res.ok) setPropFirms(firms=>firms.map(f=>f.slug===firmSlug?{...f,referred:true,referralStatus:'pending'}:f));
    else alert(data.error);
  };

  const profileUrl = profile.profileSlug ? (typeof window !== 'undefined' ? window.location.origin : 'https://tradering.com') + '/p/' + profile.profileSlug : null;

  const copyLink = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    setLinkCopied(true);
    setTimeout(()=>setLinkCopied(false), 2000);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent('Check out my verified trading track record on TradeRing ' + (profileUrl||''));
    window.open('https://twitter.com/intent/tweet?text='+text, '_blank');
  };

  const metCriteria = badgeStatus ? Object.values(badgeStatus.criteria||{}).filter(Boolean).length : 0;
  const totalCriteria = BADGE_CRITERIA.length;

  const inp = {
    background:'var(--surface2)', border:'1px solid var(--border)',
    borderRadius:8, color:'var(--text)', fontFamily:'var(--font)',
    fontSize:13, padding:'9px 13px', outline:'none', width:'100%',
    transition:'border-color 0.15s', boxSizing:'border-box',
  };

  const TABS = ['profile','badge','prop firms'];

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'0 4px' }}>
      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
        <Avatar name={profile.displayName||user?.name} size={64}/>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', marginBottom:4 }}>Your Profile</div>
          <h1 style={{ fontFamily:'var(--font)', fontSize:22, fontWeight:700, color:'var(--text)', margin:'0 0 4px', letterSpacing:'-0.3px' }}>
            {user?.verifiedBadge ? '✓ ' : ''}{profile.displayName || 'Your Trader Profile'}
          </h1>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {profileUrl && (
              <>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>{profileUrl}</span>
                <button onClick={copyLink} style={{ padding:'2px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:linkCopied?'var(--green)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  {linkCopied?'✓ Copied':'Copy Link'}
                </button>
                <button onClick={()=>{ if(typeof window!=='undefined'&&window.__goToProfile&&profile.profileSlug) window.__goToProfile(profile.profileSlug); }}
                style={{ fontFamily:'var(--font)', fontSize:11, color:'#fff', fontWeight:700, background:PURPLE, padding:'4px 12px', borderRadius:6, border:'none', cursor:'pointer' }}>View My Profile →</button>
              </>
            )}
          </div>
        </div>
        {user?.plan && (
          <div style={{ padding:'5px 14px', borderRadius:20, background: user.plan==='free'?'var(--surface2)':'rgba(79,70,229,0.1)', border:'1px solid '+(user.plan==='free'?'var(--border)':'rgba(79,70,229,0.3)'), fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:user.plan==='free'?'var(--text-muted)':PURPLE, textTransform:'capitalize' }}>
            {user.plan} Plan
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>setActiveTab(t)} style={{
            background:'none', border:'none',
            borderBottom: activeTab===t ? '2px solid '+PURPLE : '2px solid transparent',
            padding:'10px 18px', marginBottom:-1,
            fontFamily:'var(--font)', fontSize:13, fontWeight:activeTab===t?700:400,
            color: activeTab===t ? PURPLE : 'var(--text-muted)',
            cursor:'pointer', textTransform:'capitalize', transition:'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'start' }}>

          {/* Left — form */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Visibility */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Profile Visibility</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {[
                  { value:'private',  label:'Private',     desc:'Only you can see', icon:'🔒' },
                  { value:'invite',   label:'Invite Only', desc:'Share via link',   icon:'🔗' },
                  { value:'public',   label:'Public',      desc:'On leaderboards',  icon:'🌍' },
                ].map(opt => (
                  <div key={opt.value} onClick={()=>set('profileVisibility',opt.value)}
                    style={{ padding:'14px 16px', borderRadius:10, cursor:'pointer', border:'1px solid '+(profile.profileVisibility===opt.value?PURPLE:'var(--border)'), background:profile.profileVisibility===opt.value?'rgba(79,70,229,0.08)':'var(--surface2)', transition:'all 0.15s', textAlign:'center' }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{opt.icon}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:profile.profileVisibility===opt.value?PURPLE:'var(--text)', marginBottom:3 }}>{opt.label}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic info */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Public Info</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Display Name</div>
                    <input style={inp} value={profile.displayName} onChange={e=>set('displayName',e.target.value)} placeholder="How you appear publicly"
                      onFocus={e=>e.target.style.borderColor=PURPLE} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Profile URL</div>
                    <div style={{ display:'flex' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', background:'var(--surface2)', border:'1px solid var(--border)', borderRight:'none', borderRadius:'8px 0 0 8px', padding:'9px 8px', whiteSpace:'nowrap' }}>tradering.com/p/</span>
                      <input style={{ ...inp, borderRadius:'0 8px 8px 0', borderLeft:'none' }} value={profile.profileSlug} onChange={e=>set('profileSlug',e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="your-name"
                        onFocus={e=>e.target.style.borderColor=PURPLE} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Bio</div>
                  <textarea style={{ ...inp, minHeight:80, resize:'vertical', lineHeight:1.7 }} value={profile.bio} onChange={e=>set('bio',e.target.value)} placeholder="Tell other traders about your approach, experience, and edge..."
                    onFocus={e=>e.target.style.borderColor=PURPLE} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Trading Style</div>
                    <select style={{ ...inp, cursor:'pointer' }} value={profile.tradingStyle} onChange={e=>set('tradingStyle',e.target.value)}>
                      <option value="">Not specified</option>
                      {TRADER_STYLES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Member Since</div>
                    <div style={{ ...inp, color:'var(--text-muted)', cursor:'default' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString([],{month:'long',year:'numeric'}) : '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Social Links</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { key:'twitterHandle',     icon:'𝕏', label:'Twitter / X',    placeholder:'yourhandle', prefix:'x.com/'           },
                  { key:'instagramHandle',   icon:'📸', label:'Instagram',       placeholder:'yourhandle', prefix:'instagram.com/'   },
                  { key:'youtubeHandle',     icon:'▶',  label:'YouTube',         placeholder:'@yourchannel', prefix:'youtube.com/'  },
                  { key:'tradingviewHandle', icon:'📈', label:'TradingView',     placeholder:'yourprofile', prefix:'tradingview.com/u/' },
                ].map(s => (
                  <div key={s.key} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{s.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{s.label}</div>
                      <div style={{ display:'flex' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', background:'var(--surface2)', border:'1px solid var(--border)', borderRight:'none', borderRadius:'8px 0 0 8px', padding:'7px 8px', whiteSpace:'nowrap' }}>{s.prefix}</span>
                        <input style={{ ...inp, borderRadius:'0 8px 8px 0', borderLeft:'none', padding:'7px 10px', fontSize:12 }} value={profile[s.key]||''} onChange={e=>set(s.key,e.target.value.replace('@',''))} placeholder={s.placeholder}
                          onFocus={e=>e.target.style.borderColor=PURPLE} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Primary Assets</div>
                <span style={{ fontSize:11, color:profile.primaryAssets.length>=5?'var(--red)':'var(--text-muted)' }}>{profile.primaryAssets.length}/5</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {ASSET_OPTIONS.map(a => (
                  <button key={a} onClick={()=>toggleAsset(a)} style={{ background:profile.primaryAssets.includes(a)?PURPLE:'var(--surface2)', border:'1px solid '+(profile.primaryAssets.includes(a)?PURPLE:'var(--border)'), borderRadius:20, padding:'4px 12px', color:profile.primaryAssets.includes(a)?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.12s' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Account Info</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'Email',        value: session?.user?.email || user?.email || '—' },
                  { label:'Plan',         value: (user?.plan||'free').charAt(0).toUpperCase()+(user?.plan||'free').slice(1) },
                  { label:'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString([],{month:'long',day:'numeric',year:'numeric'}) : '—' },
                  { label:'Username',     value: user?.username || '—' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, color:'var(--red)', fontFamily:'var(--font)', fontSize:13 }}>{error}</div>}

            <button onClick={save} disabled={saving}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', backgroundColor:saving?'var(--surface2)':saved?'var(--green)':PURPLE, color:saving?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', transition:'all 0.2s' }}>
              {saving?'Saving…':saved?'✓ Profile Saved':'Save Profile'}
            </button>

            {/* Danger zone */}
            <div style={{ background:'var(--surface)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:14, padding:'18px 20px' }}>
              <button onClick={()=>setShowDanger(s=>!s)} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--red)', padding:0, display:'flex', alignItems:'center', gap:8 }}>
                ⚠️ Danger Zone {showDanger?'▲':'▼'}
              </button>
              {showDanger && (
                <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'rgba(239,68,68,0.05)', borderRadius:8, border:'1px solid rgba(239,68,68,0.15)' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>Change Password</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Update your account password</div>
                    </div>
                    <button onClick={()=>alert('Password change — coming soon. Use the reset link in your email for now.')}
                      style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      Change
                    </button>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'rgba(239,68,68,0.05)', borderRadius:8, border:'1px solid rgba(239,68,68,0.15)' }}>
                    <div>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:2 }}>Delete Account</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Permanently delete your account and all data</div>
                    </div>
                    <button onClick={()=>{ if(window.confirm('Are you sure? This cannot be undone. All your data will be permanently deleted.')) { if(window.confirm('Last chance — delete your account permanently?')) alert('Please contact support@tradering.com to complete account deletion.'); } }}
                      style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--red)', background:'transparent', color:'var(--red)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — preview */}
          <div style={{ position:'sticky', top:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Live Preview</div>
            <ProfilePreviewCard profile={profile} user={user}/>
            {profileUrl && (
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <button onClick={copyLink} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {linkCopied?'✓ Copied!':'📋 Copy Link'}
                </button>
                <button onClick={shareTwitter} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'#000', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  𝕏 Share
                </button>
              </div>
            )}
            <div style={{ marginTop:10, padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Your Stats</div>
              {[
                { label:'Win Rate',      value: user?.consistency?.winRate ? Math.round(user.consistency.winRate*100)+'%' : '—', color:user?.consistency?.winRate>=0.5?'var(--green)':'var(--red)' },
                { label:'Total Trades',  value: user?.consistency?.totalTrades || '—',                                            color:'var(--text)' },
                { label:'Avg R:R',       value: user?.consistency?.avgRR ? user.consistency.avgRR.toFixed(2) : '—',               color:'var(--text)' },
                { label:'Consistency',   value: user?.consistency?.consistencyScore ? user.consistency.consistencyScore+'/100':'—', color:PURPLE },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{s.label}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BADGE TAB ── */}
      {activeTab === 'badge' && (
        <div style={{ maxWidth:560, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px' }}>
            {/* Badge status */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:'16px 20px', background: user?.verifiedBadge?'rgba(79,70,229,0.08)':'var(--surface2)', borderRadius:10, border:'1px solid '+(user?.verifiedBadge?'rgba(79,70,229,0.3)':'var(--border)') }}>
              <div style={{ fontSize:44, opacity:user?.verifiedBadge?1:0.3 }}>✓</div>
              <div>
                <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:user?.verifiedBadge?PURPLE:'var(--text)', marginBottom:4 }}>
                  {user?.verifiedBadge ? 'Verified Trader' : 'Not Yet Verified'}
                </div>
                <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>
                  {user?.verifiedBadge
                    ? 'Badge earned '+new Date(user.badgeEarnedAt).toLocaleDateString()
                    : 'Meet all criteria below to earn your verified badge'}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {badgeStatus && (
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:metCriteria===totalCriteria?'var(--green)':PURPLE }}>{metCriteria}/{totalCriteria} criteria met</span>
                </div>
                <div style={{ height:8, background:'var(--surface2)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:(metCriteria/totalCriteria*100)+'%', background:metCriteria===totalCriteria?'var(--green)':PURPLE, borderRadius:4, transition:'width 0.5s ease' }}/>
                </div>
              </div>
            )}

            <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Requirements</div>

            {BADGE_CRITERIA.map(c => {
              const met = badgeStatus?.criteria?.[c.key];
              return (
                <div key={c.key} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, background:met===true?'rgba(34,197,94,0.1)':met===false?'rgba(239,68,68,0.1)':'var(--surface2)', border:'1px solid '+(met===true?'rgba(34,197,94,0.3)':met===false?'rgba(239,68,68,0.3)':'var(--border)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:met===true?'var(--green)':met===false?'var(--red)':'var(--text-muted)' }}>
                    {met===true?'✓':met===false?'✗':'·'}
                  </div>
                  <div>
                    <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:500, color:'var(--text)' }}>{c.label}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.desc}</div>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop:20 }}>
              {user?.verifiedBadge ? (
                <div style={{ textAlign:'center', padding:16, background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.25)', borderRadius:10, color:PURPLE, fontFamily:'var(--font)', fontWeight:700 }}>
                  ✓ You are a Verified Trader on TradeRing
                </div>
              ) : (
                <button onClick={checkBadge} disabled={checkingBadge}
                  style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', backgroundColor:checkingBadge?'var(--surface2)':PURPLE, color:checkingBadge?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:14, fontWeight:700, cursor:checkingBadge?'not-allowed':'pointer' }}>
                  {checkingBadge?'Checking…':'Check Eligibility'}
                </button>
              )}
              {badgeStatus && !badgeStatus.alreadyVerified && (
                <div style={{ marginTop:12, fontFamily:'var(--font)', fontSize:12, color:badgeStatus.awarded?'var(--green)':'var(--text-muted)', textAlign:'center' }}>
                  {badgeStatus.awarded ? '🎉 Badge awarded! Your profile is now verified.' : 'Not eligible yet. Missing: '+badgeStatus.missing?.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Share if verified */}
          {user?.verifiedBadge && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
              <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Share your verification</div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={shareTwitter} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#000', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>𝕏 Share on X</button>
                <button onClick={copyLink} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>{linkCopied?'✓ Copied':'Copy Profile Link'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROP FIRMS TAB ── */}
      {activeTab === 'prop firms' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:'14px 18px', background:'rgba(79,70,229,0.06)', border:'1px solid rgba(79,70,229,0.2)', borderRadius:10 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:PURPLE, marginBottom:4 }}>How this works</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>
              Your verified TradeRing track record can qualify you for fast-tracked prop firm evaluations. When you apply, TradeRing sends your verified stats directly to the firm — no fake screenshots, no unverified claims.
            </div>
          </div>
          {propFirms.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontFamily:'var(--font)' }}>Loading prop firms…</div>
          ) : propFirms.map(firm => (
            <div key={firm.slug} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'18px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:'var(--text)' }}>{firm.name}</div>
                      {firm.eligible && <span style={{ fontSize:10, fontWeight:700, color:'var(--green)', background:'rgba(34,197,94,0.1)', padding:'2px 8px', borderRadius:20 }}>Eligible</span>}
                      {firm.referred && <span style={{ fontSize:10, fontWeight:700, color:'#f59e0b', background:'rgba(245,158,11,0.1)', padding:'2px 8px', borderRadius:20 }}>{firm.referralStatus}</span>}
                    </div>
                    <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{firm.description}</div>
                  </div>
                  <div style={{ marginLeft:16, flexShrink:0 }}>
                    {firm.referred ? (
                      <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--green)', fontWeight:600 }}>Applied ✓</div>
                    ) : (
                      <button onClick={()=>applyToFirm(firm.slug)} disabled={!firm.eligible}
                        style={{ padding:'8px 18px', borderRadius:8, border:'none', backgroundColor:firm.eligible?PURPLE:'var(--surface2)', color:firm.eligible?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:firm.eligible?'pointer':'not-allowed' }}>
                        {firm.eligible?'Apply Now':'Not Eligible Yet'}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {Object.entries(firm.requirements||{}).map(([key,req]) => (
                    <div key={key} style={{ padding:'10px 12px', borderRadius:8, background:req.met?'rgba(34,197,94,0.08)':'var(--surface2)', border:'1px solid '+(req.met?'rgba(34,197,94,0.2)':'var(--border)') }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:req.met?'var(--green)':'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{key.replace(/([A-Z])/g,' $1').toLowerCase()}</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:req.met?'var(--green)':'var(--text)' }}>
                        {typeof req.current==='number'&&req.current<1?Math.round(req.current*100)+'%':req.current}
                        <span style={{ color:'var(--text-muted)', marginLeft:4 }}>/ {typeof req.required==='number'&&req.required<1?Math.round(req.required*100)+'%':req.required}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
                  {(firm.fundingLevels||[]).map(l=>(
                    <span key={l} style={{ fontFamily:'var(--font-mono)', fontSize:10, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', color:'var(--text-muted)' }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
