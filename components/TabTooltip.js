'use client'
import { useState, useEffect } from 'react'

const TOOLTIPS = {
  'Feed': { icon:'📣', title:'Your trading feed', desc:'Discover ideas, strategies, and screeners shared by traders in your community. Post your own analysis and build your reputation.', pills:['Share ideas','Follow top traders','Build your following','Join the conversation'] },
  'Groups': { icon:'👥', title:'Trading community groups', desc:'Create or join private groups with dedicated rooms for chat, ideas, and analysis. Founders can charge for access and build a paid community.', pills:['Private rooms','Paid groups','Share analysis','Grow a community'] },
  'Compete': { icon:'🏆', title:'Live trading competitions', desc:'Enter real-time competitions against other traders. Top performers earn prizes, badges, and recognition on the global leaderboard.', pills:['Win prizes','Earn badges','Track performance','Prove your edge'] },
  'Leaderboard': { icon:'🎯', title:'Global leaderboard', desc:'See where you rank against traders worldwide. A strong leaderboard position builds your credibility and grows your following.', pills:['Global rankings','Win rate tracking','Build credibility','Gain followers'] },
  'Commodities': { icon:'📊', title:'Commodities overview', desc:'Screen commodities with COT positioning, seasonality, and trend data in one place. Updated daily from official CFTC reports.', pills:['COT positioning','Seasonal trends','Trend strength','Daily updates'] },
  'Futures': { icon:'📈', title:'Futures markets', desc:'Monitor futures positioning, open interest, and COT data across all major contracts. Spot institutional moves before they happen.', pills:['Open interest','COT data','Institutional flow','Market structure'] },
  'Forex': { icon:'💱', title:'Forex overview', desc:'Track currency pair positioning with COT data, key levels, and seasonal patterns to time entries with precision.', pills:['Currency COT','Key levels','Seasonal patterns','Pair analysis'] },
  'Stocks': { icon:'🏢', title:'Stocks & sectors', desc:'Monitor sector rotation, earnings calendars, and institutional positioning across equities markets.', pills:['Sector rotation','Earnings calendar','Institutional flow','Key levels'] },
  'Crypto': { icon:'🪙', title:'Crypto markets', desc:'Track crypto market structure, on-chain positioning, and community sentiment all in one view.', pills:['Market structure','Community sentiment','On-chain data','Key levels'] },
  'News': { icon:'📰', title:'Market news', desc:'Stay on top of market-moving news filtered by the assets you follow. Never miss a catalyst.', pills:['Filtered news','Asset alerts','Macro events','Economic calendar'] },
  'Screener': { icon:'🔍', title:'Custom screener', desc:'Filter markets by your exact criteria. Save your screeners and share them with the community to build your reputation.', pills:['Custom filters','Save screeners','Share publicly','AI suggestions'] },
  'Journal': { icon:'📓', title:'Trading journal', desc:'Log every trade, track your performance over time, and identify patterns in your wins and losses. The fastest way to improve.', pills:['Trade logging','Performance tracking','Pattern analysis','Weekly reviews'] },
  'Trade Calc': { icon:'🧮', title:'Trade calculator', desc:'Calculate position size, risk/reward, and profit targets instantly. Never risk more than you intend.', pills:['Position sizing','Risk/reward','Profit targets','Risk management'] },
  'Trade Plan Builder': { icon:'📋', title:'Trade plan builder', desc:'Build structured trade plans before you enter. Define your thesis, entry, stop, target, and share it with your community.', pills:['Structured planning','Entry & exit','Share plans','Stay disciplined'] },
  'Strategy Backtest': { icon:'⏪', title:'Strategy backtester', desc:'Test your trading strategies against historical data before risking real capital. Validate your edge before you trade it.', pills:['Historical testing','Edge validation','Performance stats','Optimize entries'] },
  'COT Alerts': { icon:'🔔', title:'COT alerts', desc:'Get notified the moment COT positioning crosses your thresholds. Never miss a major institutional positioning shift again.', pills:['Custom thresholds','Instant alerts','Email & push','Never miss a move'] },
  'Creator Studio': { icon:'🎨', title:'Creator studio', desc:'Build and monetize your trading brand. Create paid groups, publish content, and grow a following of traders who trust your analysis.', pills:['Paid groups','Content publishing','Monetize your edge','Grow followers'] },
  'Notes': { icon:'✏️', title:'Trading notes', desc:'Capture your market observations, trade ideas, and analysis in a structured notes system. Searchable and shareable.', pills:['Quick capture','Organize by asset','Search notes','Share insights'] },
  'Review': { icon:'🔄', title:'Weekly review', desc:"Run structured weekly reviews of your trading. Identify what worked, what didn't, and where to focus next week.", pills:['Weekly check-in','Win/loss review','Identify patterns','Set intentions'] },
  'Trade Log': { icon:'📊', title:'Trade log', desc:'Every trade you take, logged automatically. Filter by asset, date, strategy, or outcome to find your edge.', pills:['Auto-logging','Filter & sort','P&L tracking','Find your edge'] },
  'Import': { icon:'📥', title:'Import trades', desc:'Import your trade history from any broker in seconds. Get instant performance analytics without manual entry.', pills:['Broker import','CSV support','Instant analytics','All brokers'] },
  'Broker': { icon:'🏦', title:'Broker integration', desc:'Connect your broker account to sync trades automatically and see real-time P&L inside TradeRing.', pills:['Auto-sync','Real-time P&L','All major brokers','Secure connection'] },
  'My Profile': { icon:'⭐', title:'Your trading profile', desc:'Your public trading profile. Showcase your win rate, top trades, and content. The more you share, the more your following grows.', pills:['Public profile','Win rate display','Top trades','Grow following'] },
  'Settings': { icon:'⚙️', title:'Settings', desc:'Customize your TradeRing experience — notifications, display preferences, privacy settings, and subscription management.', pills:['Notifications','Privacy','Display','Subscription'] },
  'Workspace': { icon:'🖥️', title:'Chart workspace', desc:'Your personal charting workspace. Analyze markets with a full suite of tools and save your chart layouts.', pills:['Custom layouts','Drawing tools','Save workspaces','Multi-chart'] },
}

function getSeenSet() {
  try { return new Set(JSON.parse(localStorage.getItem('tr_tooltip_seen') || '[]')) } catch { return new Set() }
}
function markSeen(tab) {
  try { const s = getSeenSet(); s.add(tab); localStorage.setItem('tr_tooltip_seen', JSON.stringify([...s])) } catch {}
}

export default function TabTooltip({ tab }) {
  const [visible, setVisible] = useState(false)
  const tip = TOOLTIPS[tab]

  useEffect(() => {
    if (!tip) return
    if (!getSeenSet().has(tab)) setVisible(true)
  }, [tab])

  if (!visible || !tip) return null

  const dismiss = () => { markSeen(tab); setVisible(false) }

  return (
    <div style={{ background:'var(--surface,#fff)', border:'1px solid var(--border,#e5e7eb)', borderTop:'3px solid #4f46e5', borderRadius:'0 0 12px 12px', padding:'18px 22px', display:'flex', alignItems:'flex-start', gap:14, animation:'tr-slide 0.2s ease' }}>
      <style>{`@keyframes tr-slide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:38, height:38, borderRadius:10, background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{tip.icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text,#1a1a2e)', marginBottom:4 }}>{tip.title}</div>
        <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted,#6b7280)', lineHeight:1.55, marginBottom:10 }}>{tip.desc}</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {tip.pills.map(p => <span key={p} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'#EEEDFE', color:'#3C3489', border:'0.5px solid #AFA9EC', fontFamily:'var(--font)' }}>{p}</span>)}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
        <button onClick={dismiss} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted,#9ca3af)', fontSize:20, lineHeight:1, padding:0 }}>×</button>
        <button onClick={dismiss} style={{ fontSize:12, fontWeight:600, color:'#4f46e5', background:'none', border:'none', cursor:'pointer', padding:0, whiteSpace:'nowrap' }}>Got it ✓</button>
      </div>
    </div>
  )
}
