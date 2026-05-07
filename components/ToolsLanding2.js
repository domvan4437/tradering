"use client";
import React from "react";

const PRIORITY_TOOLS = [
  {
    key:"Journal",
    title:"Journal",
    icon:"📓",
    desc:"Log trades, write reviews, and build your track record. Daily, weekly, monthly and annual reviews with full customization.",
    color:"#10b981",
    bg:"rgba(16,185,129,0.08)",
    border:"rgba(16,185,129,0.25)",
    badge:"Core",
  },
];

const TRADING_TOOLS = [
  { key:"Trade Calc",         title:"Trade Calculator",   icon:"🧮", desc:"Position sizing, risk/reward, and P&L targets. Auto-calculates as you type.",      color:"var(--accent)", bg:"var(--accent-bg)",      border:"var(--accent-border)" },
  { key:"Trade Plan Builder", title:"Trade Plan Builder", icon:"📋", desc:"AI-assisted trade plans for any asset class. Fully customizable sections.",        color:"#d97706",       bg:"rgba(217,119,6,0.08)",  border:"rgba(217,119,6,0.25)" },
  { key:"Strategy Backtest",  title:"Strategy Backtest",  icon:"📈", desc:"Build strategies with conditions and run them against years of real price data.",  color:"#7c3aed",       bg:"rgba(124,58,237,0.08)", border:"rgba(124,58,237,0.25)" },
  { key:"COT Alerts",         title:"COT Alerts",         icon:"🔔", desc:"Monitor COT positioning across commodities, forex, and financials. Auto-loads.",   color:"#dc2626",       bg:"rgba(220,38,38,0.06)",  border:"rgba(220,38,38,0.2)"  },
  { key:"Screener",           title:"Custom Screener",    icon:"🔍", desc:"Build screeners filtering assets by COT, seasonal, technical, and price signals.", color:"#0891b2",       bg:"rgba(8,145,178,0.08)",  border:"rgba(8,145,178,0.25)" },
  { key:"Import",             title:"Import Data",        icon:"📥", desc:"Bring in notes from Notion, Obsidian, Evernote, Bear, OneNote and 10+ platforms.", color:"#4f46e5",       bg:"rgba(79,70,229,0.08)",  border:"rgba(79,70,229,0.25)" },
];

const PURPLE = '#4f46e5';

export function ToolsLanding2({ onSelect }) {
  return (
    <div style={{ fontFamily:"var(--font)" }}>
      {/* Header */}
      <div style={{ padding:"28px 28px 24px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", marginBottom:8 }}>Tools</div>
        <div style={{ fontSize:26, fontWeight:700, color:"var(--text)", letterSpacing:"-0.6px", marginBottom:6 }}>Your trading toolkit.</div>
        <div style={{ fontSize:14, color:"var(--text-muted)", maxWidth:520, lineHeight:1.6 }}>Everything you need to plan, track, analyze, and improve — all in one place.</div>
      </div>

      {/* Journal — priority section */}
      <div style={{ padding:"24px 28px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#10b981", display:"inline-block" }}/>
          Core Tools
        </div>
        <div
          onClick={() => onSelect('Journal')}
          style={{ border:"1px solid rgba(16,185,129,0.3)", borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all 0.18s", background:"rgba(16,185,129,0.03)", maxWidth:480 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(16,185,129,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(16,185,129,0.3)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
          <div style={{ padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ fontSize:36 }}>📓</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:17, fontWeight:700, color:"var(--text)" }}>Journal</span>
                <span style={{ fontSize:10, fontWeight:700, color:"#10b981", background:"rgba(16,185,129,0.1)", padding:"2px 8px", borderRadius:20, border:"1px solid rgba(16,185,129,0.2)" }}>Core</span>
              </div>
              <div style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.6 }}>Log trades, write reviews across every timeframe, and build your verified track record. The foundation of your trading career on TradeRing.</div>
            </div>
            <div style={{ fontSize:18, color:"var(--text-muted)", flexShrink:0 }}>→</div>
          </div>
        </div>
      </div>

      {/* Trading toolkit */}
      <div style={{ padding:"24px 28px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:PURPLE, display:"inline-block" }}/>
          Trading Toolkit
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {TRADING_TOOLS.map(t => (
            <div key={t.key}
              onClick={() => onSelect(t.key)}
              style={{ border:"1px solid var(--border)", borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"all 0.18s", background:"var(--surface)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=t.color; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ height:72, background:"var(--surface2)", borderBottom:"1px solid var(--border)", padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22 }}>{t.icon}</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, color:t.color, letterSpacing:"0.08em", textTransform:"uppercase" }}>{t.title}</span>
              </div>
              <div style={{ padding:"12px 16px 14px" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:5 }}>{t.title}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.6, marginBottom:10 }}>{t.desc}</div>
                <div style={{ textAlign:"right" }}><span style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)" }}>Open →</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ToolsLanding2;
