"use client";
import React from "react";
const CARDS = [
  { key:"Broker",     title:"Broker",     desc:"Connect your brokerage accounts to sync trades, verify your track record, and unlock Creator verification.", color:"var(--green)",  bg:"var(--green-bg)",        border:"var(--green-border)"         },
  { key:"My Profile", title:"My Profile", desc:"Set your visibility, build your public trading profile, and start your path to Creator verification.",      color:"var(--accent)", bg:"var(--accent-bg)",       border:"var(--accent-border)"        },
  { key:"Settings",   title:"Settings",   desc:"Theme, notifications, display preferences, and account management all in one place.",                       color:"#6b7280",       bg:"rgba(107,114,128,0.08)", border:"rgba(107,114,128,0.2)"       },
];
export function AccountLanding({ onSelect, onViewProfile }) {
  return (
    <div style={{ fontFamily:"var(--font)" }}>
      <div style={{ padding:"28px 28px 22px", borderBottom:"1px solid var(--border)" }}>
        {onViewProfile && (
          <button onClick={onViewProfile}
            style={{ marginBottom:16, padding:'10px 20px', borderRadius:10, border:'none', background:'#4f46e5', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
            {'👤 View My Public Profile →'}
          </button>
        )}
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", marginBottom:10 }}>Account</div>
        <div style={{ fontSize:26, fontWeight:700, color:"var(--text)", letterSpacing:"-0.6px", marginBottom:8 }}>Your account hub.</div>
        <div style={{ fontSize:14, color:"var(--text-muted)", maxWidth:520, lineHeight:1.6 }}>Connect your brokers, build your public profile, and manage your settings.</div>
      </div>
      <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {CARDS.map(card => (
          <div key={card.key} onClick={() => onSelect(card.key)}
            style={{ border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=card.color; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; }}
          >
            <div style={{ height:90, background:"var(--surface2)", borderBottom:"1px solid var(--border)", padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color:card.color, letterSpacing:"0.1em", textTransform:"uppercase" }}>{card.title}</div>
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
export default AccountLanding;
