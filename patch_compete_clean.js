const fs = require('fs')
const { execSync } = require('child_process')

// Restore CompeteTab from last known good commit
execSync('git show 210804c:components/CompeteTab.js > components/CompeteTab.js')
console.log('✓ CompeteTab restored from git')

let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Add useCallback to imports
s = s.replace(
  "import React, { useState, useEffect, useRef } from 'react';",
  "import React, { useState, useEffect, useRef, useCallback } from 'react';"
)

// Find the exact block to replace in H2HTab
const matchStart = s.indexOf('  const MY_MATCHES = [')
const liveArrayEnd = s.indexOf('];', s.indexOf('  const LIVE = [')) + 2
console.log('matchStart:', matchStart, 'liveArrayEnd:', liveArrayEnd)

if (matchStart > -1 && liveArrayEnd > matchStart) {
  const newDataBlock = `  const [loading, setLoading] = useState(false);
  const [MY_MATCHES, setMyMatches] = useState([]);
  const [INVITES, setInvites] = useState([]);
  const [OPEN, setOpen] = useState([]);
  const LIVE = [];

  function getTimeLeft(end) {
    const diff = new Date(end) - new Date();
    if (diff <= 0) return 'Ended';
    const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
    return d > 0 ? d+'d '+h+'h' : h+'h';
  }
  function timeAgo(dt) {
    const diff = Date.now() - new Date(dt);
    const m2 = Math.floor(diff/60000), h2 = Math.floor(diff/3600000), d2 = Math.floor(diff/86400000);
    return d2 > 0 ? d2+'d ago' : h2 > 0 ? h2+'h ago' : m2+'m ago';
  }

  const loadData = useCallback(() => {
    setLoading(true);
    fetch('/api/challenges').then(r=>r.json()).then(d=>{
      if (!d.error) {
        setMyMatches((d.myMatches||[]).map(m=>({
          id:m.id, matchId:m.id,
          opponent: m.opponentName||'Waiting...',
          asset: (m.assetClasses||['Any']).join(', '),
          duration:'—',
          stake: m.buyIn>0?'$'+m.buyIn:'For fun',
          myPnl: (parseFloat(m.myPnl||0)>=0?'+':'')+'$'+parseFloat(m.myPnl||0).toFixed(2),
          oppPnl:'+$0.00',
          timeLeft: m.endDate?getTimeLeft(m.endDate):'—',
          status: parseFloat(m.myPnl||0)>=0?'winning':'losing',
        })));
        setInvites((d.invites||[]).map(i=>({
          id:i.id, matchId:i.id,
          from:i.challengerName||'Trader',
          league:'silver',
          asset:(i.assetClasses||['Any']).join(', '),
          duration:'—',
          stake:i.buyIn>0?'$'+i.buyIn:'For fun',
          message:i.description||'Open challenge',
          received:i.createdAt?timeAgo(i.createdAt):'',
        })));
        setOpen((d.open||[]).map(c=>({
          id:c.id, tournamentId:c.id,
          poster:c.creatorName||'Trader',
          league:'silver',
          asset:(c.assetClasses||['Any']).join(', '),
          duration:'—',
          stake:c.buyIn>0?'$'+c.buyIn:'For fun',
          desc:c.description||'Open challenge',
          posted:c.createdAt?timeAgo(c.createdAt):'',
          accepts:0, max:1, winRate:0, wins:0,
        })));
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  useEffect(()=>{ loadData(); }, [loadData]);

  const acceptChallenge = async (matchId) => {
    await fetch('/api/challenges',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({matchId,action:'accept'})});
    loadData();
  };
  const declineChallenge = async (matchId) => {
    await fetch('/api/challenges',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({matchId,action:'decline'})});
    loadData();
  };
  const postChallenge = async (form) => {
    await fetch('/api/challenges',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset:form.asset,duration:form.duration,stake:form.stake,stakeType:'real',description:form.desc})});
    loadData();
  };`

  s = s.slice(0, matchStart) + newDataBlock + s.slice(liveArrayEnd)
  console.log('✓ H2HTab data replaced with API calls')
} else {
  console.log('⚠ Could not find mock data block')
}

// Wire decline button
s = s.replace(
  `<button style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Decline</button>`,
  `<button onClick={()=>declineChallenge(inv.matchId||inv.id)} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Decline</button>`
)

// Wire accept button in invites
s = s.replace(
  `<button onClick={() => setAccepted(inv)} style={{ flex:2, padding:'9px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Accept \u2192</button>`,
  `<button onClick={()=>{setAccepted(inv);acceptChallenge(inv.matchId||inv.id);}} style={{ flex:2, padding:'9px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Accept \u2192</button>`
)

// Wire post challenge button
s = s.replace(
  `<button onClick={() => form.desc.trim() && (setAccepted({from:'posted',duration:form.duration,stake:form.stake}),setSubTab('my matches'))} disabled={!form.desc.trim()}`,
  `<button onClick={()=>{ if(!form.desc.trim()) return; postChallenge(form).then(()=>setSubTab('my matches')); }} disabled={!form.desc.trim()}`
)

// Add empty state for browse
s = s.replace(
  `{subTab==='browse' && (\r\n        <div style={{ padding:'20px' }}>\r\n          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Open challenges matched to your league (Silver \xb11)</div>\r\n          <div style={{ display:'grid'`,
  `{subTab==='browse' && (\r\n        <div style={{ padding:'20px' }}>\r\n          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Open challenges matched to your league (Silver \xb11)</div>\r\n          {loading && <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13 }}>Loading...</div>}\r\n          {!loading && OPEN.length===0 && <div style={{ textAlign:'center', padding:'60px' }}><div style={{ fontSize:36 }}>\u2694\ufe0f</div><div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)', marginTop:12 }}>No open challenges yet</div><div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginTop:8 }}>Be the first to post one!</div></div>}\r\n          {!loading && OPEN.length>0 && <div style={{ display:'grid'`
)
s = s.replace(
  `          </div>\r\n        </div>\r\n      )}\r\n\r\n      {subTab==='my matches'`,
  `          </div>}\r\n        </div>\r\n      )}\r\n\r\n      {subTab==='my matches'`
)

fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ CompeteTab saved')
console.log('\nRun: rd /s /q .next & npm run dev')
