'use client'
import React, { useState } from 'react'

const PURPLE = '#4B44C8'

function Card({ children, style }) {
  return <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px 16px', ...style }}>{children}</div>
}
function Card2({ children, style }) {
  return <div style={{ background: 'var(--surface2)', borderRadius: 7, padding: '10px 12px', ...style }}>{children}</div>
}
function SH({ children, color }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color: color || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{children}</div>
}
function Row({ label, value, valueColor, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {value && <span style={{ fontWeight: 500, color: valueColor || 'var(--text)' }}>{value}</span>}
        {action}
      </div>
    </div>
  )
}
function MiniBar({ data }) {
  const max = Math.max(...data)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, borderRadius: '3px 3px 0 0', background: i === data.length - 1 ? PURPLE : 'rgba(75,68,200,0.15)' }} />
      ))}
    </div>
  )
}
function RepBar({ label, value, pct, color, note }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 500, color }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      {note && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{note}</div>}
    </div>
  )
}
function BtnP({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding: '7px 14px', background: PURPLE, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', ...style }}>{children}</button>
}
function BtnS({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--text-muted)', border: '0.5px solid var(--border2)', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)', ...style }}>{children}</button>
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function OverviewTab({ user }) {
  const stats = { followers: 0, winRate: null, trades: 0, revenue: 0, communityScore: null, profileViews: 0, postsThisWeek: 0, newFollowers: 0, tradeIdeas: 0 }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Followers',       value: stats.followers || '—',   color: undefined },
          { label: 'Win rate',        value: stats.winRate !== null ? `${stats.winRate}%` : '—', color: stats.winRate ? '#16a34a' : undefined, sub: stats.trades ? `${stats.trades} trades` : 'No trades yet' },
          { label: 'Revenue MTD',     value: `$${stats.revenue}`,      color: undefined },
          { label: 'Community score', value: stats.communityScore || '—', color: PURPLE },
        ].map(s => (
          <Card2 key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: s.color || 'var(--text)', marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            {s.sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>}
          </Card2>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Activity this week</SH>
          {[
            { label: 'Posts published',   value: stats.postsThisWeek },
            { label: 'Profile views',     value: stats.profileViews },
            { label: 'New followers',     value: `+${stats.newFollowers}`, color: '#16a34a' },
            { label: 'Trade ideas shared',value: stats.tradeIdeas },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 500, color: r.color || 'var(--text)' }}>{r.value}</span>
            </div>
          ))}
        </Card>
        <Card>
          <SH>Quick actions</SH>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <BtnP style={{ width: '100%' }}>+ New post</BtnP>
            <BtnS style={{ width: '100%' }}>Create a group</BtnS>
            <BtnS style={{ width: '100%' }}>Add trade idea</BtnS>
            <BtnS style={{ width: '100%' }}>View public profile</BtnS>
          </div>
        </Card>
      </div>
      <Card>
        <SH>Your reputation</SH>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <RepBar label="Trade accuracy" value={stats.winRate ? `${stats.winRate}%` : '—'} pct={stats.winRate || 0} color="#16a34a" note="Share trade ideas to build this score" />
          <RepBar label="Community score" value={stats.communityScore ? `${stats.communityScore}/100` : '—'} pct={stats.communityScore || 0} color={PURPLE} note="Follower count, engagement rate, time on platform" />
          <RepBar label="Content quality" value="—" pct={0} color={PURPLE} note="Upvotes, saves, and shares your posts receive" />
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Community</SH>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>Create free or paid groups, run courses, and build your audience. No follower threshold required.</div>
          <BtnP style={{ width: '100%' }}>Create your first group</BtnP>
        </Card>
        <Card>
          <SH>Broker connection</SH>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>Connect your broker to automatically verify trade history and build your track record.</div>
          <BtnS style={{ width: '100%' }}>Connect broker</BtnS>
        </Card>
      </div>
    </div>
  )
}

// ─── ANALYTICS + COMMUNITY ────────────────────────────────────────────────────
function AnalyticsCommunityTab() {
  const followerData = [30, 44, 38, 55, 62, 72, 100]
  const reachData = [20, 35, 48, 42, 60, 55, 88]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top 6 stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
        {[
          { label: 'Followers',     value: '—', sub: '+0 this week' },
          { label: 'Profile views', value: '—', sub: '+0 this week' },
          { label: 'Posts (30d)',   value: '0',  sub: '0 avg views' },
          { label: 'Engage rate',   value: '—',  sub: 'likes + comments', color: PURPLE },
          { label: 'Group members', value: '0',  sub: '+0 this week' },
          { label: '30d retention', value: '—',  sub: 'group members', color: '#16a34a' },
        ].map(s => (
          <Card2 key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: s.color || 'var(--text)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
          </Card2>
        ))}
      </div>

      {/* 3-column middle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Follower growth</SH>
          <MiniBar data={followerData} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, marginBottom: 8 }}><span>6 weeks ago</span><span>Now</span></div>
          <div style={{ fontSize: 11 }}>Net new this month: <strong style={{ color: '#16a34a' }}>+0</strong></div>
        </Card>
        <Card>
          <SH>Post reach (top posts)</SH>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>No posts yet. Start posting to see your reach data here.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Post 1', 'Post 2', 'Post 3'].map((p, i) => (
              <div key={p}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{p}</span>
                  <span style={{ fontWeight: 500 }}>— views</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SH>Engagement breakdown</SH>
          {[
            { label: 'Avg views / post',    value: '—' },
            { label: 'Avg likes / post',    value: '—' },
            { label: 'Avg comments / post', value: '—' },
            { label: 'Avg saves / post',    value: '—', color: PURPLE },
            { label: 'Profile clicks',      value: '—' },
            { label: 'Save rate',           value: '—', color: PURPLE },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 500, color: r.color || 'var(--text)' }}>{r.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Bottom 2-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Audience interests</SH>
          {[
            { label: 'Commodities', pct: 0, color: '#633806' },
            { label: 'Forex',       pct: 0, color: '#085041' },
            { label: 'Crypto',      pct: 0, color: '#3C3489' },
            { label: 'Stocks',      pct: 0, color: '#791F1F' },
            { label: 'Futures',     pct: 0, color: '#444441' },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontWeight: 500 }}>{r.pct}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>Based on your followers' activity on TradeRing</div>
        </Card>
        <Card>
          <SH>Group & community stats</SH>
          {[
            { label: 'Active groups',           value: '0' },
            { label: 'Total group members',     value: '0' },
            { label: 'Active members (7d)',     value: '0' },
            { label: 'Posts in groups (7d)',    value: '0' },
            { label: '30-day retention',        value: '—', color: '#16a34a' },
            { label: 'New members this month',  value: '+0', color: '#16a34a' },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 500, color: r.color || 'var(--text)' }}>{r.value}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ─── MONETIZATION ─────────────────────────────────────────────────────────────
function MonetizationTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
        {[
          { label: 'This month',      value: '$0' },
          { label: 'Last month',      value: '$0' },
          { label: 'All time',        value: '$0' },
          { label: 'Paid subscribers',value: '0' },
          { label: 'Pending payout',  value: '$0', color: '#dc2626' },
        ].map(s => (
          <Card2 key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: s.color || 'var(--text)', marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </Card2>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Payout method</SH>
          <div style={{ padding: '8px 10px', borderRadius: 6, border: '0.5px solid #dc2626', background: 'rgba(220,38,38,0.05)', fontSize: 11, color: '#dc2626', marginBottom: 10 }}>
            No payout method connected. Set one up to receive earnings.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <BtnP style={{ width: '100%' }}>Connect Stripe</BtnP>
            <BtnS style={{ width: '100%' }}>Connect bank account</BtnS>
          </div>
        </Card>
        <Card>
          <SH>Available monetization</SH>
          {[
            { label: 'Paid groups',          status: 'Available', available: true },
            { label: 'Paid courses',          status: 'Available', available: true },
            { label: 'Tips / donations',      status: 'Available', available: true },
            { label: 'Signal subscriptions',  status: 'Available', available: true },
            { label: 'Revenue share (content)',status: 'Pro only', available: false },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 12 }}>
              <span>{r.label}</span>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: r.available ? 'rgba(22,163,74,0.1)' : 'rgba(180,83,9,0.1)', color: r.available ? '#15803d' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.status}</span>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Your paid products</SH>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>No paid products yet. Create a paid group, course, or signal service to start earning.</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <BtnP style={{ fontSize: 10 }}>+ Paid group</BtnP>
            <BtnS style={{ fontSize: 10 }}>+ Paid course</BtnS>
            <BtnS style={{ fontSize: 10 }}>+ Signals</BtnS>
          </div>
        </Card>
        <Card>
          <SH>Subscriber management</SH>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>No paid subscribers yet. Manage cancellations, refunds, and messages here once you do.</div>
          {[
            { label: 'Active subscribers',    value: '0' },
            { label: 'Cancelled this month',  value: '0' },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 500 }}>{r.value}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SH>Payout history</SH>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No payouts yet. Earnings are paid out on the 1st of each month once you've connected a payout method and reached the $25 minimum threshold.</div>
      </Card>
    </div>
  )
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const SETTINGS_SECTIONS = ['Account', 'Appearance', 'Notifications', 'Privacy', 'Broker', 'Billing', 'Danger zone']

function SettingsContent({ section, user }) {
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>{section}</div>

        {section === 'Account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
                <div style={{ display: 'flex', gap: 6 }}><input defaultValue={user?.email || ''} style={{ flex: 1, padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }} /><BtnS>Change</BtnS></div>
              </div>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Username</div>
                <input defaultValue={user?.name || ''} style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Nationality</div>
                <select style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                  <option value="">Select country</option>
                  {['🇺🇸 United States','🇬🇧 United Kingdom','🇨🇦 Canada','🇦🇺 Australia','🇩🇪 Germany','🇫🇷 France','🇯🇵 Japan','🇳🇱 Netherlands','🇸🇬 Singapore','🇦🇪 UAE','🇿🇦 South Africa','🇧🇷 Brazil','🇮🇳 India','🇳🇿 New Zealand','🇨🇭 Switzerland','🇸🇪 Sweden','🇳🇴 Norway','🇩🇰 Denmark','🇵🇹 Portugal','🇦🇹 Austria','🇲🇽 Mexico','🇦🇷 Argentina','🇰🇷 South Korea','🇹🇷 Turkey','🇮🇱 Israel','🇵🇱 Poland','🇪🇸 Spain','🇮🇹 Italy','🇭🇰 Hong Kong','🇹🇭 Thailand','Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Timezone</div>
                <select style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                  {['UTC-12','UTC-11','UTC-10','UTC-9','UTC-8 Pacific','UTC-7 Mountain','UTC-6 Central','UTC-5 Eastern','UTC-4','UTC-3','UTC-2','UTC-1','UTC+0 London','UTC+1 Paris','UTC+2','UTC+3 Dubai','UTC+4','UTC+5','UTC+5:30 India','UTC+6','UTC+7','UTC+8 Singapore','UTC+9 Tokyo','UTC+10 Sydney','UTC+11','UTC+12'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Password</div>
              <div style={{ display: 'flex', gap: 6 }}><input type="password" defaultValue="••••••••" style={{ flex: 1, padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }} /><BtnS>Update</BtnS></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '0.5px solid var(--border)' }}>
              <div><div style={{ fontSize: 12, fontWeight: 500 }}>Two-factor authentication</div><div style={{ fontSize: 10, color: '#dc2626' }}>Currently off</div></div>
              <BtnS>Enable 2FA</BtnS>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '0.5px solid var(--border)' }}>
              <div><div style={{ fontSize: 12, fontWeight: 500 }}>Plan: Free</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Upgrade for analytics, revenue share, and more</div></div>
              <BtnP>Upgrade to Pro</BtnP>
            </div>
            <BtnP style={{ width: 120 }}>Save changes</BtnP>
          </div>
        )}

        {section === 'Appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Theme</div>
              <select style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                <option>System default</option><option>Light</option><option>Dark</option>
              </select>
            </div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Default market section on load</div>
              <select style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                <option>Commodities</option><option>Stocks</option><option>Forex</option><option>Crypto</option><option>Futures</option>
              </select>
            </div>
            <BtnP style={{ width: 120 }}>Save</BtnP>
          </div>
        )}

        {section === 'Notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'New followers', sub: 'When someone follows you' },
              { label: 'Post likes & comments', sub: 'When someone engages with your posts' },
              { label: 'Trade idea results', sub: 'When your public trade ideas hit targets' },
              { label: 'Group activity', sub: 'New posts in your groups' },
              { label: 'New subscribers', sub: 'When someone subscribes to a paid product' },
              { label: 'Platform updates', sub: 'New features and announcements' },
            ].map((n, i, a) => (
              <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div><div style={{ fontSize: 12 }}>{n.label}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.sub}</div></div>
                <input type="checkbox" defaultChecked style={{ cursor: 'pointer', width: 16, height: 16 }} />
              </div>
            ))}
          </div>
        )}

        {section === 'Privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Show profile on leaderboards', sub: 'Let others find you in rankings' },
              { label: 'Show trade history publicly', sub: 'Others can see your win rate and trade log' },
              { label: 'Allow direct messages', sub: "From users you don't follow" },
              { label: 'Show online status', sub: "Let others see when you're active" },
            ].map((n, i, a) => (
              <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div><div style={{ fontSize: 12 }}>{n.label}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.sub}</div></div>
                <input type="checkbox" defaultChecked style={{ cursor: 'pointer', width: 16, height: 16 }} />
              </div>
            ))}
          </div>
        )}

        {section === 'Broker' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>Connect your brokerage account to automatically track and verify your trade history.</div>
            <BtnP style={{ marginBottom: 10 }}>Connect broker</BtnP>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports: Interactive Brokers, TD Ameritrade, TradeStation, MetaTrader 4/5, and more.</div>
          </div>
        )}

        {section === 'Billing' && (
          <div>
            <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Current plan: <span style={{ color: PURPLE }}>Free</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upgrade to Pro for advanced analytics, revenue share, and priority support.</div>
            </div>
            <BtnP style={{ marginBottom: 10 }}>Upgrade to Pro</BtnP>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No active subscriptions or payment methods on file.</div>
          </div>
        )}

        {section === 'Danger zone' && (
          <div style={{ padding: '12px', background: 'rgba(220,38,38,0.05)', border: '0.5px solid rgba(220,38,38,0.3)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#dc2626', marginBottom: 4 }}>Delete account</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Permanently delete your TradeRing account. This cannot be undone.</div>
            <button style={{ padding: '7px 14px', background: 'transparent', color: '#dc2626', border: '0.5px solid #dc2626', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)' }}>Delete my account</button>
          </div>
        )}
    </div>
  )
}

function SettingsTab({ user }) { return null }

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SETTINGS_ICONS = {
  'Account': 'ti-user', 'Appearance': 'ti-palette', 'Notifications': 'ti-bell',
  'Privacy': 'ti-lock', 'Broker': 'ti-plug-connected', 'Billing': 'ti-credit-card',
  'Danger zone': 'ti-trash'
}

const ACCOUNT_TABS = [
  { key: 'overview',     label: 'Overview',              icon: 'ti-layout-dashboard' },
  { key: 'analytics',    label: 'Analytics & Community', icon: 'ti-chart-bar' },
  { key: 'monetization', label: 'Monetization',          icon: 'ti-currency-dollar' },
  { key: 'settings',     label: 'Settings',              icon: 'ti-settings' },
]

export default function AccountTab({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [settingsSection, setSettingsSection] = useState('Account')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const hoverTimer = React.useRef(null)
  const isOpen = sidebarOpen || sidebarPinned

  function handleMouseEnter() {
    clearTimeout(hoverTimer.current)
    setSidebarOpen(true)
  }
  function handleMouseLeave() {
    hoverTimer.current = setTimeout(() => { if (!sidebarPinned) setSidebarOpen(false) }, 180)
  }

  return (
    <div style={{ fontFamily: 'var(--font)', display: 'flex', minHeight: 'calc(100vh - 82px)' }}>

      {/* ── SIDEBAR ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: isOpen ? 200 : 54,
          minWidth: isOpen ? 200 : 54,
          borderRight: '0.5px solid var(--border)',
          background: 'var(--surface2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '10px 6px',
          transition: 'width 0.18s ease, min-width 0.18s ease',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 20,
        }}>

        {/* Hamburger */}
        <div onClick={() => setSidebarPinned(p => !p)}
          style={{ width: 42, height: 38, background: PURPLE, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginBottom: 8 }}>
          <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
        </div>

        {/* Main nav tabs */}
        {ACCOUNT_TABS.map(t => {
          const isActive = activeTab === t.key
          return (
            <React.Fragment key={t.key}>
              <button onClick={() => setActiveTab(t.key)}
                title={!isOpen ? t.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: isOpen ? 8 : 0,
                  padding: '8px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(75,68,200,0.1)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                  width: isOpen ? '100%' : 42,
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  position: 'relative', flexShrink: 0,
                }}>
                {isActive && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 22, background: PURPLE, borderRadius: '0 3px 3px 0' }} />}
                <i className={`ti ${t.icon}`} style={{ fontSize: 19, color: isActive ? PURPLE : 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
                {isOpen && <span style={{ fontSize: 12, color: isActive ? '#3C3489' : 'var(--text-muted)', fontWeight: isActive ? 500 : 400, whiteSpace: 'nowrap' }}>{t.label}</span>}
              </button>

              {/* Settings subtabs — shown inline when settings is active and sidebar open */}
              {t.key === 'settings' && isActive && isOpen && (
                <div style={{ width: '100%', paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
                  {SETTINGS_SECTIONS.map(sec => (
                    <button key={sec} onClick={() => setSettingsSection(sec)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '6px 8px', borderRadius: 6,
                        background: settingsSection === sec ? 'rgba(75,68,200,0.08)' : 'transparent',
                        border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                        width: '100%', textAlign: 'left',
                      }}>
                      <i className={`ti ${SETTINGS_ICONS[sec] || 'ti-circle'}`}
                        style={{ fontSize: 14, color: sec === 'Danger zone' ? '#dc2626' : settingsSection === sec ? PURPLE : 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ fontSize: 11, color: sec === 'Danger zone' ? '#dc2626' : settingsSection === sec ? '#3C3489' : 'var(--text-muted)', fontWeight: settingsSection === sec ? 500 : 400, whiteSpace: 'nowrap' }}>
                        {sec}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          )
        })}

        {/* User info — only when open */}
        {isOpen && (
          <div style={{ marginTop: 'auto', padding: '10px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 8, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                {(user?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Free plan</div>
              </div>
            </div>
            <BtnP style={{ width: '100%', fontSize: 10, padding: '6px' }}>Upgrade to Pro</BtnP>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: activeTab === 'settings' ? '16px 24px' : '16px 24px' }}>
        {activeTab === 'overview'     && <OverviewTab user={user} />}
        {activeTab === 'analytics'    && <AnalyticsCommunityTab />}
        {activeTab === 'monetization' && <MonetizationTab />}
        {activeTab === 'settings'     && <SettingsContent section={settingsSection} user={user} />}
      </div>
    </div>
  )
}
