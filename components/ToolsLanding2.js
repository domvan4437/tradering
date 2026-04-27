"use client";
import React from "react";

const TOOLS = [
  { key:"Trade Calc",         title:"Trade Calculator",   desc:"Position sizing, risk/reward, and P&L calculation for any market.",                 color:"var(--accent)", bg:"var(--accent-bg)",      border:"var(--accent-border)" },
  { key:"Trade Plan Builder", title:"Trade Plan Builder", desc:"Build a complete trade plan before you press the button.",                          color:"#10b981",       bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.25)" },
  { key:"Strategy Backtest",  title:"Strategy Backtest",  desc:"Custom entry/exit conditions run against years of real price data.",               color:"#d97706",       bg:"rgba(217,119,6,0.08)",  border:"rgba(217,119,6,0.25)" },
  { key:"COT Alerts",         title:"COT Alerts",         desc:"Get notified when COT positioning reaches your defined thresholds.",               color:"#dc2626",       bg:"rgba(220,38,38,0.06)",  border:"rgba(220,38,38,0.2)" },
  { key:"Screener",           title:"Custom Screener",    desc:"Build screeners filtering every asset by COT, seasonal, price and more.",          color:"#7c3aed",       bg:"rgba(124,58,237,0.08)", border:"rgba(124,58,237,0.25)" },
];

export function ToolsLanding2({ onSelect }) {
  return (
    <div style={{ fontFamily:"var(--font)" }}>
      <div style={{ padding:"28px 28px 22px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", marginBottom:10 }}>Tools</div>
        <div style={{ fontSize:26, fontWeight:700, color:"var(--text)", letterSpacing:"-0.6px", marginBottom:8 }}>Your trading toolkit.</div>
        <div style={{ fontSize:14, color:"var(--text-muted)", maxWidth:520, lineHeight:1.6 }}>Plan trades, build strategies, backtest ideas, and set alerts.</div>
      </div>
      <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:14 }}>
        {TOOLS.slice(0,3).map(t => (
          <div key={t.key} onClick={() => onSelect(t.key)}
            style={{ border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=t.color; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; }}
          >
            <div style={{ height:90, background:"var(--surface2)", borderBottom:"1px solid var(--border)", padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color:t.color, letterSpacing:"0.1em", textTransform:"uppercase" }}>{t.title}</div>
            </div>
            <div style={{ padding:"14px 18px 16px" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>{t.title}</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6, marginBottom:12 }}>{t.desc}</div>
              <div style={{ textAlign:"right" }}><span style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)" }}>Open →</span></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"0 24px 20px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {TOOLS.slice(3).map(t => (
          <div key={t.key} onClick={() => onSelect(t.key)}
            style={{ border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=t.color; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; }}
          >
            <div style={{ height:90, background:"var(--surface2)", borderBottom:"1px solid var(--border)", padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color:t.color, letterSpacing:"0.1em", textTransform:"uppercase" }}>{t.title}</div>
            </div>
            <div style={{ padding:"14px 18px 16px" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>{t.title}</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6, marginBottom:12 }}>{t.desc}</div>
              <div style={{ textAlign:"right" }}><span style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)" }}>Open →</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default ToolsLanding2;
