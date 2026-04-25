'use client';
import { useState } from 'react';

const BROKERS = [
  { id:'alpaca',     name:'Alpaca',             type:'Stocks & Crypto',         desc:'Commission-free API-first broker. Best for automated tracking and real-time P&L sync.',          logo:'A',  lc:'#FFCF40', lb:'#1a1a2e', sup:['Stocks','Crypto','Options'],              trust:'SEC & FINRA regulated · SIPC insured up to $500K',         pop:true,  api:true  },
  { id:'ibkr',       name:'Interactive Brokers', type:'Stocks, Futures & Forex', desc:'Professional-grade broker with access to every major market. Industry standard for serious traders.', logo:'IB', lc:'#fff',    lb:'#cc0000', sup:['Stocks','Futures','Forex','Options'], trust:'FINRA/SIPC member · $10B+ in client assets · Est. 1978',    pop:true,  api:true  },
  { id:'tradovate',  name:'Tradovate',           type:'Futures',                 desc:'Cloud-native futures broker with flat-rate commissions. Perfect for commodity futures traders.',  logo:'TV', lc:'#fff',    lb:'#0066cc', sup:['Futures','Micro Futures'],               trust:'NFA registered · CFTC regulated',                          pop:false, api:true  },
  { id:'schwab',     name:'Charles Schwab',      type:'Stocks & ETFs',           desc:'One of the largest US brokers. Trusted by millions of retail and institutional investors.',       logo:'CS', lc:'#fff',    lb:'#00a8e0', sup:['Stocks','ETFs','Options'],               trust:'FINRA/SIPC member · $8.5T in client assets',               pop:true,  api:false },
  { id:'robinhood',  name:'Robinhood',           type:'Stocks & Crypto',         desc:'Commission-free investing for beginners and casual investors. Most popular casual platform.',     logo:'RH', lc:'#00c805', lb:'#f0f0f0', sup:['Stocks','ETFs','Crypto'],                trust:'FINRA/SIPC member · SEC registered',                       pop:true,  api:false },
  { id:'coinbase',   name:'Coinbase',            type:'Crypto',                  desc:'The most trusted crypto exchange in the US. Verify all your crypto trades and holdings.',         logo:'CB', lc:'#fff',    lb:'#1652f0', sup:['Bitcoin','Ethereum','Altcoins'],         trust:'Publicly traded (COIN) · FinCEN registered · SOC2 certified', pop:true, api:true  },
];

function Card({ b, connected, onConnect, onDisconnect }) {
  const [open, setOpen] = useState(false);
  const [key, setKey]   = useState('');
  const [sec, setSec]   = useState('');
  return (
    <div style={{ border:'1px solid '+(connected?'var(--green-border)':'var(--border)'), borderRadius:14, overflow:'hidden', background: connected?'rgba(22,163,74,0.03)':'var(--surface)' }}>
      <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'48px 1fr auto', gap:14, alignItems:'center' }}>
        <div style={{ width:48, height:48, borderRadius:12, background:b.lb, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color:b.lc }}>{b.logo}</div>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <span style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)' }}>{b.name}</span>
            {b.pop && <span style={{ fontSize:9, fontWeight:600, color:'var(--accent)', background:'var(--accent-bg)', padding:'2px 7px', borderRadius:10 }}>Popular</span>}
            {connected && <span style={{ fontSize:10, fontWeight:600, color:'var(--green)', background:'var(--green-bg)', padding:'2px 9px', borderRadius:20 }}>Connected</span>}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:5 }}>{b.type}</div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {b.sup.map(s => <span key={s} style={{ fontSize:10, color:'var(--text-muted)', background:'var(--surface2)', padding:'1px 7px', borderRadius:10, border:'1px solid var(--border)' }}>{s}</span>)}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
          {connected
            ? <button onClick={() => onDisconnect(b.id)} style={{ padding:'7px 14px', background:'var(--surface2)', color:'var(--text-muted)', border:'1px solid var(--border)', borderRadius:8, fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>Disconnect</button>
            : <button onClick={() => setOpen(!open)} style={{ padding:'7px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Connect</button>
          }
          <span style={{ fontSize:10, color:'var(--text-muted)' }}>{b.api ? 'API' : 'CSV import'}</span>
        </div>
      </div>
      <div style={{ padding:'8px 20px', background:'var(--surface2)', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font)' }}>
        Trusted: {b.trust}
      </div>
      {open && !connected && (
        <div style={{ padding:'18px 20px', borderTop:'1px solid var(--border)', background:'var(--surface2)' }}>
          {b.api ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input value={key} onChange={e=>setKey(e.target.value)} placeholder='API Key (Read-Only)' style={{ padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none' }} />
              <input type='password' value={sec} onChange={e=>setSec(e.target.value)} placeholder='API Secret' style={{ padding:'10px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none' }} />
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>Read-only access only. TradeRing can never place trades on your behalf.</div>
              <button onClick={() => { onConnect(b.id); setOpen(false); }} style={{ padding:'10px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Connect {b.name}</button>
            </div>
          ) : (
            <div>
              <div style={{ border:'2px dashed var(--border)', borderRadius:10, padding:'24px', textAlign:'center', cursor:'pointer', marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Drop your CSV file here</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>or click to browse</div>
              </div>
              <button onClick={() => { onConnect(b.id); setOpen(false); }} style={{ width:'100%', padding:'10px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Import Trades</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrokerTab() {
  const [connected, setConnected] = useState([]);
  const connect    = id => setConnected(p => [...p, id]);
  const disconnect = id => setConnected(p => p.filter(x => x !== id));
  return (
    <div style={{ fontFamily:'var(--font)', maxWidth:900, margin:'0 auto', padding:'28px 24px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>Tools</div>
        <div style={{ fontSize:24, fontWeight:700, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:6 }}>Broker Connections</div>
        <div style={{ fontSize:13, color:'var(--text-muted)', maxWidth:540, lineHeight:1.6 }}>Connect your brokerage accounts to sync trades and verify your track record. TradeRing uses read-only access only.</div>
      </div>
      <div style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:12, padding:'14px 18px', marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--green)', marginBottom:4 }}>Your money never moves through TradeRing</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>We connect with read-only API keys or CSV imports only. We are not a broker or custodian. Your assets stay exactly where they are.</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {BROKERS.map(b => <Card key={b.id} b={b} connected={connected.includes(b.id)} onConnect={connect} onDisconnect={disconnect} />)}
      </div>
      <div style={{ marginTop:16, padding:'14px 18px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>Don't see your broker?</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Most brokers support CSV export. Use that to import your trades manually.</div>
        </div>
        <button style={{ padding:'8px 16px', background:'var(--surface)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', marginLeft:16 }}>Request Integration</button>
      </div>
    </div>
  );
}