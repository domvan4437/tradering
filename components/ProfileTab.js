
'use client';
import { useState, useEffect } from 'react';
import { Panel, PanelHeader, Btn, Badge, StatCard } from './DS';

const TRADER_STYLES = ['scalper','daytrader','swing','position','macro'];
const ASSET_OPTIONS = ['Gold','Silver','Crude Oil','Natural Gas','Wheat','Corn','EUR/USD','GBP/USD','USD/JPY','S&P 500','Nasdaq','Bitcoin','Ethereum'];

const BADGE_CRITERIA = [
  { key: 'isPublic',     label: 'Profile set to Public',     desc: 'Required to earn the badge' },
  { key: 'accountAge',  label: 'Account 90+ days old',       desc: 'Builds trust over time' },
  { key: 'enoughTrades',label: '50+ verified trade calls',   desc: 'Enough data to be meaningful' },
  { key: 'winRate',      label: 'Win rate 50%+',             desc: 'Consistent profitability' },
  { key: 'avgRR',        label: 'Average R:R 1.2+',          desc: 'Quality over quantity' },
];

export default function ProfileTab({ user, session }) {
  const [profile, setProfile] = useState({
    displayName: user?.displayName || user?.name || '',
    bio: user?.bio || '',
    tradingStyle: user?.tradingStyle || '',
    primaryAssets: user?.primaryAssets ? JSON.parse(user.primaryAssets) : [],
    profileVisibility: user?.profileVisibility || 'private',
    twitterHandle: user?.twitterHandle || '',
    profileSlug: user?.profileSlug || '',
    propFirmInterest: user?.propFirmInterest || false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [badgeStatus, setBadgeStatus] = useState(null);
  const [checkingBadge, setCheckingBadge] = useState(false);
  const [propFirms, setPropFirms] = useState([]);
  const [propTab, setPropTab] = useState('firms');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetch('/api/prop-firms').then(r => r.json()).then(d => setPropFirms(d.firms || [])).catch(() => {});
  }, []);

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const toggleAsset = (asset) => {
    setProfile(p => ({
      ...p,
      primaryAssets: p.primaryAssets.includes(asset)
        ? p.primaryAssets.filter(a => a !== asset)
        : [...p.primaryAssets, asset].slice(0, 5),
    }));
  };

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const checkBadge = async () => {
    setCheckingBadge(true);
    const res = await fetch('/api/profile/award-badge', { method: 'POST' });
    const data = await res.json();
    setBadgeStatus(data);
    setCheckingBadge(false);
  };

  const applyToFirm = async (firmSlug) => {
    const res = await fetch('/api/prop-firms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firmSlug }),
    });
    const data = await res.json();
    if (res.ok) {
      setPropFirms(firms => firms.map(f => f.slug === firmSlug ? { ...f, referred: true, referralStatus: 'pending' } : f));
    } else {
      alert(data.error);
    }
  };

  const profileUrl = profile.profileSlug
    ? `${window?.location?.origin}/p/${profile.profileSlug}`
    : null;

  const inp = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font)',
    fontSize: 13, padding: '9px 13px', outline: 'none', width: '100%',
    transition: 'border-color 0.15s',
  };

  const TABS = ['profile', 'badge', 'prop firms'];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
          Your Profile
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>
            {user?.verifiedBadge ? '✓ ' : ''}{profile.displayName || 'Your Trader Profile'}
          </h1>
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.06em' }}>
              View public profile →
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            background: 'none', border: 'none',
            borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
            padding: '10px 18px', marginBottom: -1,
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: activeTab === t ? 600 : 400,
            color: activeTab === t ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Visibility selector */}
          <Panel>
            <PanelHeader title="profile visibility" />
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { value: 'private',  label: 'Private',     desc: 'Only you can see your stats', icon: '◉' },
                  { value: 'invite',   label: 'Invite Only', desc: 'Share via link with anyone',  icon: '◈' },
                  { value: 'public',   label: 'Public',      desc: 'Listed on leaderboards',      icon: '⬡' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => set('profileVisibility', opt.value)}
                    style={{
                      padding: '16px 18px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${profile.profileVisibility === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: profile.profileVisibility === opt.value ? 'var(--accent-bg)' : 'var(--surface2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{opt.icon}</div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: profile.profileVisibility === opt.value ? 'var(--accent)' : 'var(--text)', marginBottom: 4 }}>{opt.label}</div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
              {profile.profileVisibility === 'invite' && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface3)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  Your profile link: {profileUrl || 'Set a profile URL below to generate your link'}
                </div>
              )}
            </div>
          </Panel>

          {/* Basic info */}
          <Panel>
            <PanelHeader title="public info" />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Display Name</label>
                  <input style={inp} value={profile.displayName} onChange={e => set('displayName', e.target.value)} placeholder="How you appear on leaderboards" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Profile URL</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface3)', border: '1px solid var(--border2)', borderRight: 'none', borderRadius: '6px 0 0 6px', padding: '9px 10px', whiteSpace: 'nowrap' }}>tradering.com/p/</span>
                    <input style={{ ...inp, borderRadius: '0 6px 6px 0' }} value={profile.profileSlug} onChange={e => set('profileSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="your-name" />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bio</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={profile.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell other traders about your approach, experience, and edge..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Trading Style</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={profile.tradingStyle} onChange={e => set('tradingStyle', e.target.value)}>
                    <option value="">Not specified</option>
                    {TRADER_STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Twitter / X Handle</label>
                  <input style={inp} value={profile.twitterHandle} onChange={e => set('twitterHandle', e.target.value.replace('@', ''))} placeholder="yourhandle" />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Primary Assets (up to 5)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ASSET_OPTIONS.map(a => (
                    <button key={a} onClick={() => toggleAsset(a)} style={{
                      background: profile.primaryAssets.includes(a) ? 'var(--accent-bg)' : 'var(--surface2)',
                      border: `1px solid ${profile.primaryAssets.includes(a) ? 'var(--accent-border)' : 'var(--border2)'}`,
                      borderRadius: 5, padding: '5px 12px',
                      color: profile.primaryAssets.includes(a) ? 'var(--accent)' : 'var(--text-muted)',
                      fontFamily: 'var(--font)', fontSize: 12, cursor: 'pointer', transition: 'all 0.12s',
                    }}>{a}</button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {error && <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 6, padding: '10px 14px', color: 'var(--red)', fontFamily: 'var(--font)', fontSize: 13 }}>{error}</div>}

          <Btn onClick={save} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
          </Btn>
        </div>
      )}

      {/* BADGE TAB */}
      {activeTab === 'badge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <PanelHeader title="verified trader badge" />
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px 20px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 40, opacity: user?.verifiedBadge ? 1 : 0.3 }}>✓</div>
                <div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color: user?.verifiedBadge ? 'var(--accent)' : 'var(--text)', marginBottom: 4 }}>
                    {user?.verifiedBadge ? 'Verified Trader' : 'Not Yet Verified'}
                  </div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {user?.verifiedBadge
                      ? `Badge earned ${new Date(user.badgeEarnedAt).toLocaleDateString()}`
                      : 'Meet all criteria below to earn your verified badge'}
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Requirements</div>

              {BADGE_CRITERIA.map(c => {
                const met = badgeStatus?.criteria?.[c.key];
                return (
                  <div key={c.key} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: met === true ? 'var(--green-bg)' : met === false ? 'var(--red-bg)' : 'var(--surface3)',
                      border: `1px solid ${met === true ? 'var(--green-border)' : met === false ? 'var(--red-border)' : 'var(--border2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 11,
                      color: met === true ? 'var(--green)' : met === false ? 'var(--red)' : 'var(--text-dim)',
                    }}>
                      {met === true ? '✓' : met === false ? '✗' : '·'}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.label}</div>
                      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 20 }}>
                {user?.verifiedBadge ? (
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 8, color: 'var(--green)', fontFamily: 'var(--font)', fontWeight: 600 }}>
                    ✓ You are a verified trader on TradeRing
                  </div>
                ) : (
                  <Btn onClick={checkBadge} disabled={checkingBadge}>
                    {checkingBadge ? 'Checking…' : 'Check Eligibility'}
                  </Btn>
                )}
                {badgeStatus && !badgeStatus.alreadyVerified && (
                  <div style={{ marginTop: 12, fontFamily: 'var(--font)', fontSize: 12, color: badgeStatus.awarded ? 'var(--green)' : 'var(--text-muted)' }}>
                    {badgeStatus.awarded
                      ? '🎉 Badge awarded! Your profile is now verified.'
                      : `Not eligible yet. Missing: ${badgeStatus.missing?.join(', ')}`}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* PROP FIRMS TAB */}
      {activeTab === 'prop firms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '14px 18px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>How this works</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your verified TradeRing track record can qualify you for fast-tracked prop firm evaluations.
              When you apply below, TradeRing sends your verified stats directly to the firm.
              No fake screenshots, no unverified claims — just your real performance data.
            </div>
          </div>

          {propFirms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Loading prop firms…</div>
          ) : (
            propFirms.map(firm => (
              <Panel key={firm.slug}>
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{firm.name}</div>
                        {firm.eligible && <Badge type="buy">Eligible</Badge>}
                        {firm.referred && <Badge type="watch">{firm.referralStatus}</Badge>}
                      </div>
                      <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>{firm.description}</div>
                    </div>
                    <div style={{ marginLeft: 16, flexShrink: 0 }}>
                      {firm.referred ? (
                        <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Applied ✓</div>
                      ) : (
                        <Btn onClick={() => applyToFirm(firm.slug)} disabled={!firm.eligible}>
                          {firm.eligible ? 'Apply Now' : 'Not Eligible Yet'}
                        </Btn>
                      )}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {Object.entries(firm.requirements).map(([key, req]) => (
                      <div key={key} style={{
                        padding: '10px 14px', borderRadius: 6,
                        background: req.met ? 'var(--green-bg)' : 'var(--surface2)',
                        border: `1px solid ${req.met ? 'var(--green-border)' : 'var(--border)'}`,
                      }}>
                        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: req.met ? 'var(--green)' : 'var(--text-muted)', marginBottom: 4 }}>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: req.met ? 'var(--green)' : 'var(--text)' }}>
                          {typeof req.current === 'number' && req.current < 1 ? `${(req.current * 100).toFixed(0)}%` : req.current}
                          <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>/ {typeof req.required === 'number' && req.required < 1 ? `${(req.required * 100).toFixed(0)}%` : req.required}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {firm.fundingLevels.map(l => (
                      <span key={l} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', color: 'var(--text-muted)' }}>{l}</span>
                    ))}
                  </div>
                </div>
              </Panel>
            ))
          )}
        </div>
      )}
    </div>
  );
}
