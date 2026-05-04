"use client";
import React from "react";
const CARDS = [
  { key:"Notes", label:"NOTES", title:"Notes", desc:"Quick notes tied to markets, dates, and trade ideas. Your scratchpad for observations.", color:"var(--accent)", bg:"var(--accent-bg)", border:"var(--accent-border)" },
  { key:"Review", label:"REVIEW", title:"Journal Review", desc:"Daily, weekly, monthly, quarterly, and annual reviews. Fully customizable blocks to match your trading style.", color:"#10b981", bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.25)" },
  { key:"Trade Log", label:"TRADE LOG", title:"Trade Log", desc:"Log every trade with full stats — win rate, P&L, profit factor. List view and calendar heatmap.", color:"#4f46e5", bg:"rgba(79,70,229,0.08)", border:"rgba(79,70,229,0.25)" },
];
export function JournalLanding({ onSelect }) {
  return (
    <div style={{ fontFamily:"var(--font)" }}>
      <div style={{ padding:"28px 28px 22px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", marginBottom:10 }}>Journal</div>
        <div style={{ fontSize:26, fontWeight:700, color:"var(--text)", letterSpacing:"-0.6px", marginBottom:8 }}>Your trading record.</div>
        <div style={{ fontSize:14, color:"var(--text-muted)", maxWidth:520, lineHeight:1.6 }}>Log your trades, review your performance, and track your growth over time.</div>
      </div>
      <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {CARDS.map(card => (
          <div key={card.key} onClick={() => onSelect(card.key)}
            style={{ border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=card.color; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; }}
          >
            <div style={{ height:90, background:"var(--surface2)", borderBottom:"1px solid var(--border)", padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color:card.color, letterSpacing:"0.1em", textTransform:"uppercase" }}>{card.label}</div>
            </div>
            <div style={{ padding:"14px 18px 16px" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>{card.title}</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6, marginBottom:12 }}>{card.desc}</div>
              <div style={{ textAlign:"right" }}><span style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)" }}>Open →</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default JournalLanding;
