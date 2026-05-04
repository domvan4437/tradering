'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';

const PURPLE = '#4f46e5';

const INSTITUTIONS = [
  { id:'chase',        name:'Chase',              category:'Bank',     logo:'JP', lb:'#003087', lc:'#fff' },
  { id:'bofa',         name:'Bank of America',    category:'Bank',     logo:'BA', lb:'#e31837', lc:'#fff' },
  { id:'fidelity',     name:'Fidelity',           category:'Stocks',   logo:'FI', lb:'#006633', lc:'#fff' },
  { id:'schwab',       name:'Charles Schwab',     category:'Stocks',   logo:'CS', lb:'#00a8e0', lc:'#fff' },
  { id:'etrade',       name:'E*TRADE',            category:'Stocks',   logo:'ET', lb:'#6633cc', lc:'#fff' },
  { id:'robinhood',    name:'Robinhood',          category:'Stocks',   logo:'RH', lb:'#00c805', lc:'#1a1a2e' },
  { id:'ibkr',         name:'Interactive Brokers',category:'Stocks',   logo:'IB', lb:'#cc0000', lc:'#fff' },
  { id:'alpaca',       name:'Alpaca',             category:'Stocks',   logo:'AP', lb:'#F6C344', lc:'#1a1a2e' },
  { id:'webull',       name:'Webull',             category:'Stocks',   logo:'WB', lb:'#0e4fa8', lc:'#fff' },
  { id:'tastytrade',   name:'Tastytrade',         category:'Futures',  logo:'TT', lb:'#ff5a00', lc:'#fff' },
  { id:'tradovate',    name:'Tradovate',          category:'Futures',  logo:'TV', lb:'#0066cc', lc:'#fff' },
  { id:'coinbase',     name:'Coinbase',           category:'Crypto',   logo:'CB', lb:'#1652f0', lc:'#fff' },
  { id:'kraken',       name:'Kraken',             category:'Crypto',   logo:'KR', lb:'#5741d9', lc:'#fff' },
];

const CSV_GUIDES = {
  mt4:         'MT4 → Account History → Right-click → Save as Report (CSV)',
  mt5:         'MT5 → Toolbox → History → Right-click → Save as Report',
  ninjatrader: 'NinjaTrader → Control Center → Account Performance → Export',
  tradestation:'TradeStation → Account → Transaction History → Export',
  oanda:       'OANDA → Account → Statement → Download CSV',
  'forex.com': 'Forex.com → My Account → Reports → Transaction History → Export',
  binance:     'Binance → Orders → Trade History → Export',
  default:     'Go to your broker → Account → Transaction History → Export CSV',
};

function parseCsv(text) {
  try {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g,''));
    return lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj = {};
      headers.forEach((h,i) => obj[h] = (vals[i]||'').trim().replace(/"/g,''));
      const asset = obj.symbol||obj.asset||obj.instrument||obj.ticker||obj.security||'Unknown';
      const sideStr = (obj.side||obj.action||obj.direction||obj.type||obj.transactiontype||'buy').toLowerCase();
      const direction = sideStr.includes('buy')||sideStr.includes('long') ? 'LONG' : 'SHORT';
      const pnl = parseFloat(obj.pnl||obj.profit||obj.realizedpnl||obj.gainloss||obj.netpnl||obj.amount||'') || null;
      const entry = parseFloat(obj.entryprice||obj.price||obj.avgprice||obj.execprice||obj.fillprice||'') || null;
      const exit = parseFloat(obj.exitprice||obj.closeprice||obj.avgexitprice||'') || null;
      const date = obj.date||obj.opendate||obj.tradedate||obj.executiontime||obj.settledate||new Date().toISOString();
      return { asset, direction, pnl, entry, exit, date, source:'csv' };
    }).filter(t => t.asset !== 'Unknown');
  } catch { return []; }
}

function calcStats(trades) {
  const closed = trades.filter(t => t.realizedPnL != null || t.pnl != null);
  const getPnl = t => t.realizedPnL ?? t.pnl ?? 0;
  const total = closed.length;
  const wins = closed.filter(t => getPnl(t) > 0);
  const losses = closed.filter(t => getPnl(t) < 0);
  const totalPnl = closed.reduce((s,t) => s+getPnl(t), 0);
  const avgWin = wins.length ? wins.reduce((s,t)=>s+getPnl(t),0)/wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s,t)=>s+getPnl(t),0)/losses.length : 0;
  const pf = losses.length && avgLoss ? Math.abs(wins.reduce((s,t)=>s+getPnl(t),0) / losses.reduce((s,t)=>s+getPnl(t),0)) : null;
  const allPnls = closed.map(getPnl);
  const best = allPnls.length ? Math.max(...allPnls) : null;
  const worst = allPnls.length ? Math.min(...allPnls) : null;
  let cur=0, bestStreak=0;
  closed.forEach(t => { if(getPnl(t)>0){cur++;bestStreak=Math.max(bestStreak,cur);}else cur=0; });
  const winRate = total ? Math.round((wins.length/total)*100) : null;
  return { total, wins:wins.length, losses:losses.length, totalPnl, avgWin, avgLoss, pf, best, worst, bestStreak, winRate };
}

// ── Plaid Link Button ─────────────────────────────────────────
function PlaidLinkButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);

  const getLinkToken = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plaid/create-link-token', { method:'POST' });
      const data = await res.json();
      if (data.error) { onError(data.error); setLoading(false); return; }
      setLinkToken(data.link_token);
    } catch(e) { onError('Failed to initialize. Check Plaid credentials.'); setLoading(false); }
  };

  useEffect(() => {
    if (!linkToken) return;
    // Load Plaid Link script
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.onload = () => {
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (public_token, metadata) => {
          setLoading(true);
          try {
            const res = await fetch('/api/plaid/exchange-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                public_token,
                institution_name: metadata.institution?.name,
                institution_id: metadata.institution?.institution_id,
                accounts: metadata.accounts,
              })
            });
            const data = await res.json();
            if (data.error) onError(data.error);
            else onSuccess(data);
          } catch(e) { onError('Connection failed'); }
          setLoading(false);
        },
        onExit: () => setLoading(false),
      });
      handler.open();
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [linkToken]);

  return (
    <button onClick={getLinkToken} disabled={loading}
      style={{ width:'100%', padding:'14px', borderRadius:10, border:'none', backgroundColor:loading?'var(--surface2)':PURPLE, color:loading?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.2s' }}>
      {loading ? (
        <><span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }}/> Connecting...</>
      ) : (
        <>'🔗 Connect Your Broker / Bank</>
      )}
    </button>
  );
}

// ── Manual Trade Modal ────────────────────────────────────────
function ManualTradeModal({ onSave, onClose }) {
  const [form, setForm] = useState({ asset:'', direction:'LONG', entry:'', exit:'', pnl:'', date:new Date().toISOString().slice(0,10), notes:'' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const inp = { width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)', boxSizing:'border-box', borderRadius:8 };

  const save = async () => {
    if (!form.asset) return;
    setSaving(true);
    try {
      await fetch('/api/plaid/manual-trade', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      });
      onSave(form);
      onClose();
    } catch { onSave(form); onClose(); }
    setSaving(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:500, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>Log Trade Manually</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:22 }}>×</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Asset / Symbol *</div>
            <input value={form.asset} onChange={e=>set('asset',e.target.value)} placeholder="e.g. GC=F, AAPL, BTC/USD" style={inp}/>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Direction</div>
            <div style={{ display:'flex', gap:6 }}>
              {['LONG','SHORT'].map(d => (
                <button key={d} onClick={()=>set('direction',d)} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer', background:form.direction===d?(d==='LONG'?'var(--green)':'var(--red)'):'var(--surface2)', color:form.direction===d?'#fff':'var(--text-muted)' }}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Date</div>
            <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} style={inp}/>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Entry Price</div>
            <input type="number" value={form.entry} onChange={e=>set('entry',e.target.value)} placeholder="0.00" style={inp}/>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Exit Price</div>
            <input type="number" value={form.exit} onChange={e=>set('exit',e.target.value)} placeholder="0.00 (optional)" style={inp}/>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>P&L ($)</div>
            <input type="number" value={form.pnl} onChange={e=>set('pnl',e.target.value)} placeholder="+250.00 or -75.50" style={inp}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving||!form.asset} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer', opacity:!form.asset?0.5:1 }}>
            {saving?'Saving...':'Save Trade'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CSV Import Modal ──────────────────────────────────────────
function CsvImportModal({ onImport, onClose }) {
  const [broker, setBroker] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [parsed, setParsed] = useState([]);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const trades = parseCsv(e.target.result);
      setParsed(trades);
      setPreview({ name: file.name, count: trades.length });
    };
    reader.readAsText(file);
  };

  const guide = CSV_GUIDES[broker?.toLowerCase()] || CSV_GUIDES.default;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:540, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.4)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>Import from CSV</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:22 }}>×</button>
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Your Broker</div>
          <input value={broker} onChange={e=>setBroker(e.target.value)} placeholder="e.g. MT4, NinjaTrader, Binance..."
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }}/>
        </div>

        {broker && (
          <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>
            💡 {guide}
          </div>
        )}

        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>document.getElementById('csv-upload')?.click()}
          style={{ border:'2px dashed '+(dragOver?PURPLE:'var(--border)'), borderRadius:12, padding:'36px 24px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(79,70,229,0.05)':'transparent', transition:'all 0.15s', marginBottom:14 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📄</div>
          <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Drop your CSV file here</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>or click to browse · Works with any broker format</div>
          <input id="csv-upload" type="file" accept=".csv,.txt,.xlsx" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
        </div>

        {preview && (
          <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--green)', marginBottom:3 }}>✅ {preview.count} trades detected in {preview.name}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Click Import to add them to your trade history.</div>
          </div>
        )}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { if(parsed.length) { onImport(broker||'CSV', parsed); onClose(); } }} disabled={!parsed.length}
            style={{ flex:2, padding:'11px', borderRadius:10, border:'none', backgroundColor:parsed.length?PURPLE:'var(--surface2)', color:parsed.length?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:parsed.length?'pointer':'not-allowed' }}>
            {parsed.length ? 'Import '+parsed.length+' Trades' : 'No trades detected yet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trade History ─────────────────────────────────────────────
function TradeHistory({ trades, onDelete, onAddManual, onCsvImport }) {
  const [search, setSearch] = useState('');
  const [filterDir, setFilterDir] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');

  const stats = useMemo(() => calcStats(trades), [trades]);

  const getPnl = t => t.realizedPnL ?? t.pnl ?? null;

  const filtered = trades
    .filter(t => {
      if (filterDir!=='All' && t.direction!==filterDir) return false;
      if (search && !(t.asset||t.symbol||'').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a,b) => {
      const dateA = new Date(a.openedAt||a.date||0), dateB = new Date(b.openedAt||b.date||0);
      if (sortBy==='date_desc') return dateB-dateA;
      if (sortBy==='date_asc')  return dateA-dateB;
      if (sortBy==='pnl_desc')  return (getPnl(b)||0)-(getPnl(a)||0);
      if (sortBy==='pnl_asc')   return (getPnl(a)||0)-(getPnl(b)||0);
      return 0;
    });

  return (
    <div>
      {trades.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
          {[
            { label:'Total Trades',  value:stats.total,                                                                            color:'var(--text)'   },
            { label:'Win Rate',      value:stats.winRate!==null?stats.winRate+'%':'—',                                             color:stats.winRate>=50?'var(--green)':'var(--red)' },
            { label:'Total P&L',     value:stats.totalPnl?(stats.totalPnl>=0?'+$':'-$')+Math.abs(stats.totalPnl).toFixed(2):'—', color:stats.totalPnl>=0?'var(--green)':'var(--red)' },
            { label:'Profit Factor', value:stats.pf!==null?stats.pf.toFixed(2):'—',                                               color:stats.pf&&stats.pf>=1?'var(--green)':'var(--red)' },
            { label:'Avg Win',       value:stats.avgWin?'+$'+stats.avgWin.toFixed(2):'—',                                         color:'var(--green)'  },
            { label:'Avg Loss',      value:stats.avgLoss?'-$'+Math.abs(stats.avgLoss).toFixed(2):'—',                             color:'var(--red)'    },
            { label:'Best Trade',    value:stats.best!=null?'+$'+stats.best.toFixed(2):'—',                                        color:'var(--green)'  },
            { label:'Worst Trade',   value:stats.worst!=null?'-$'+Math.abs(stats.worst).toFixed(2):'—',                           color:'var(--red)'    },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search asset..."
          style={{ flex:1, minWidth:120, padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }}/>
        {['All','LONG','SHORT'].map(d => (
          <button key={d} onClick={()=>setFilterDir(d)}
            style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+(filterDir===d?PURPLE:'var(--border)'), background:filterDir===d?PURPLE:'transparent', color:filterDir===d?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
            {d}
          </button>
        ))}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          style={{ padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', cursor:'pointer' }}>
          <option value='date_desc'>Newest First</option>
          <option value='date_asc'>Oldest First</option>
          <option value='pnl_desc'>Best P&L</option>
          <option value='pnl_asc'>Worst P&L</option>
        </select>
        <button onClick={onAddManual} style={{ padding:'7px 14px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>+ Manual</button>
        <button onClick={onCsvImport} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>📄 CSV</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>{trades.length===0?'No trades yet':'No trades match your filters'}</div>
          {trades.length===0 && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Connect your broker, import a CSV, or log trades manually.</div>}
        </div>
      ) : (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.5fr 80px 90px 90px 100px 100px 36px', padding:'10px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
            {['Asset','Dir','Entry','Exit','P&L','Date',''].map(h => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
            ))}
          </div>
          <div style={{ maxHeight:500, overflowY:'auto' }}>
            {filtered.map((t,i) => {
              const pnl = getPnl(t);
              return (
                <div key={t.id||i}
                  style={{ display:'grid', gridTemplateColumns:'1.5fr 80px 90px 90px 100px 100px 36px', padding:'10px 16px', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none', alignItems:'center', borderLeft:pnl>0?'2px solid rgba(34,197,94,0.4)':pnl<0?'2px solid rgba(239,68,68,0.4)':'2px solid transparent' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.asset||t.symbol||'—'}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:t.direction==='LONG'?'var(--green)':'var(--red)' }}>{t.direction==='LONG'?'▲ L':'▼ S'}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{t.entryPrice||t.entry ? (t.entryPrice||t.entry).toFixed(2) : '—'}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{t.exitPrice||t.exit ? (t.exitPrice||t.exit).toFixed(2) : '—'}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:pnl>0?'var(--green)':pnl<0?'var(--red)':'var(--text-muted)' }}>
                    {pnl!=null?(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2):'—'}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(t.openedAt||t.date||0).toLocaleDateString()}</div>
                  <button onClick={()=>onDelete(t.id)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16 }}
                    onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                    onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function BrokerTab() {
  const [view, setView] = useState('connect');
  const [connections, setConnections] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [syncing, setSyncing] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plaid/connections');
      const data = await res.json();
      if (!data.error) {
        setConnections(data.connections || []);
        setTrades(data.trades || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePlaidSuccess = async (data) => {
    setSuccess('✅ ' + (data.label || 'Account') + ' connected successfully! Trades are syncing...');
    setTimeout(() => setSuccess(''), 4000);
    await loadData();
    setView('trades');
  };

  const handleDisconnect = async (connectionId) => {
    if (!window.confirm('Disconnect this account? Your trade history will be kept.')) return;
    await fetch('/api/plaid/connections', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({connectionId}) });
    await loadData();
  };

  const handleSync = async (connectionId) => {
    setSyncing(connectionId);
    const res = await fetch('/api/plaid/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({connectionId}) });
    const data = await res.json();
    if (!data.error) { setSuccess('Synced '+data.synced+' trades'); setTimeout(()=>setSuccess(''),3000); await loadData(); }
    setSyncing(null);
  };

  const handleManualSave = async () => { await loadData(); };

  const handleCsvImport = async (brokerName, parsedTrades) => {
    // Save locally for display (full DB save would need a batch endpoint)
    const tagged = parsedTrades.map((t,i) => ({ ...t, id:'csv_'+Date.now()+i, source:brokerName }));
    setTrades(prev => [...tagged, ...prev]);
    setSuccess(parsedTrades.length+' trades imported from '+brokerName+' CSV');
    setTimeout(()=>setSuccess(''),4000);
    setView('trades');
  };

  const handleDeleteTrade = async (id) => {
    if (!window.confirm('Delete this trade?')) return;
    try { await fetch('/api/plaid/manual-trade', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) }); } catch {}
    setTrades(prev => prev.filter(t => t.id!==id));
  };

  return (
    <div style={{ fontFamily:'var(--font)', maxWidth:720, margin:'0 auto' }}>
      {showManual && <ManualTradeModal onSave={handleManualSave} onClose={()=>setShowManual(false)}/>}
      {showCsv && <CsvImportModal onImport={handleCsvImport} onClose={()=>setShowCsv(false)}/>}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom:24, textAlign:'center' }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>Account</div>
        <h2 style={{ fontSize:28, fontWeight:700, color:'var(--text)', margin:'0 0 8px', letterSpacing:'-0.5px' }}>Connect Your Broker</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:'0 auto', maxWidth:480, lineHeight:1.7 }}>
          Securely connect your brokerage account to automatically sync your trades, track your performance, and verify your track record.
        </p>
      </div>

      {/* Trust bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {[
          { icon:'🔒', label:'Bank-Level Encryption', desc:'256-bit SSL' },
          { icon:'👁️', label:'Read-Only Access',      desc:'We cannot move funds' },
          { icon:'🏦', label:'Powered by Plaid',      desc:'Used by 8,000+ apps' },
          { icon:'🛡️', label:'SOC 2 Certified',       desc:'Enterprise security' },
        ].map(t => (
          <div key={t.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:5 }}>{t.icon}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{t.label}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(success||error) && (
        <div style={{ marginBottom:14, padding:'10px 16px', borderRadius:10, background:error?'rgba(239,68,68,0.08)':'rgba(34,197,94,0.08)', border:'1px solid '+(error?'rgba(239,68,68,0.25)':'rgba(34,197,94,0.25)'), fontSize:13, fontWeight:600, color:error?'var(--red)':'var(--green)' }}>
          {error||success}
        </div>
      )}

      {/* View tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--surface2)', borderRadius:10, padding:3, marginBottom:20, width:'fit-content', margin:'0 auto 20px' }}>
        {[['connect','🔗 Connect'],['trades','📋 Trades ('+trades.length+')'],['connected','✅ Connected ('+connections.length+')']].map(([v,label]) => (
          <button key={v} onClick={()=>setView(v)}
            style={{ padding:'7px 16px', borderRadius:7, border:'none', background:view===v?PURPLE:'transparent', color:view===v?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CONNECT VIEW ── */}
      {view === 'connect' && (
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          {/* Security badge */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'18px 20px', marginBottom:20 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <span>🔒</span> How your connection is protected
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:'✅', text:'Your broker login goes directly to Plaid encrypted servers — TradeRing never sees your username or password' },
                { icon:'✅', text:'Read-only access only — we can view your trades but cannot place orders, move money, or make any changes' },
                { icon:'✅', text:'Plaid is trusted by Coinbase, Robinhood, Venmo, and 8,000+ financial apps with millions of users' },
                { icon:'✅', text:'You can disconnect at any time — removing access takes one click' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:13, flexShrink:0, marginTop:1 }}>{item.icon}</span>
                  <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plaid connect button */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'24px 28px', marginBottom:16, textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Connect in 30 seconds</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:20, lineHeight:1.7, maxWidth:400, margin:'0 auto 20px' }}>
              Search for your broker, log in with your normal credentials through Plaid's secure popup, and your trades sync automatically.
            </div>

            {/* Supported institutions preview */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18, justifyContent:'center' }}>
              {INSTITUTIONS.slice(0,8).map(inst => (
                <div key={inst.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, background:'var(--surface2)', border:'1px solid var(--border)' }}>
                  <div style={{ width:18, height:18, borderRadius:4, background:inst.lb, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:inst.lc, flexShrink:0 }}>{inst.logo}</div>
                  <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{inst.name}</span>
                </div>
              ))}
              <div style={{ padding:'4px 10px', borderRadius:20, background:'var(--surface2)', border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>+12,000 more</div>
            </div>

            <PlaidLinkButton onSuccess={handlePlaidSuccess} onError={setError}/>
            <div style={{ marginTop:14, fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textAlign:'center', lineHeight:1.7 }}>
              🔒 Your credentials go directly to Plaid — TradeRing never sees them.<br/>
              Disconnect anytime. No commitment.
            </div>
          </div>

          {/* Alternative methods */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:14, textAlign:'center' }}>Don't want to use Plaid? No problem.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={()=>setShowCsv(true)}
                style={{ padding:'14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=PURPLE}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <div style={{ fontSize:22, marginBottom:6 }}>📄</div>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:3 }}>CSV Import</div>
                <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>Export from MT4, NinjaTrader, or any broker and drag-drop your file.</div>
              </button>
              <button onClick={()=>setShowManual(true)}
                style={{ padding:'14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=PURPLE}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <div style={{ fontSize:22, marginBottom:6 }}>✍️</div>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:3 }}>Manual Entry</div>
                <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>Log any trade by hand. Works for any asset, any broker, anywhere.</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TRADES VIEW ── */}
      {view === 'trades' && (
        <TradeHistory
          trades={trades}
          onDelete={handleDeleteTrade}
          onAddManual={()=>setShowManual(true)}
          onCsvImport={()=>setShowCsv(true)}
        />
      )}

      {/* ── CONNECTED VIEW ── */}
      {view === 'connected' && (
        <div>
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading connections...</div>
          ) : connections.length === 0 ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🔗</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>No connections yet</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Connect your broker to get started.</div>
              <button onClick={()=>setView('connect')} style={{ padding:'9px 20px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Connect Now</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {connections.map(conn => (
                <div key={conn.id} style={{ background:'var(--surface)', border:'1px solid rgba(79,70,229,0.3)', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:'rgba(79,70,229,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🔗</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{conn.label || conn.broker}</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>
                        {conn._count?.brokerTrades || 0} trades · Last synced {conn.lastSynced ? new Date(conn.lastSynced).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>handleSync(conn.id)} disabled={syncing===conn.id}
                        style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {syncing===conn.id ? '⏳' : '↻ Sync'}
                      </button>
                      <button onClick={()=>handleDisconnect(conn.id)}
                        style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}
                        onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.borderColor='var(--red)';}}
                        onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.borderColor='var(--border)';}}>
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setView('connect')}
                style={{ padding:'12px', borderRadius:10, border:'1px dashed var(--border)', background:'transparent', color:PURPLE, fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                + Connect Another Account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
