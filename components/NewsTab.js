
'use client';
import { useState } from 'react';

const DAYS = ['Mon','Tue','Wed','Thu','Fri'];
const TODAY_IDX = 1; // Tuesday

const COUNTRIES = [
  { code:'US', flag:'🇺🇸', label:'USD' },
  { code:'EU', flag:'🇪🇺', label:'EUR' },
  { code:'GB', flag:'🇬🇧', label:'GBP' },
  { code:'JP', flag:'🇯🇵', label:'JPY' },
  { code:'CA', flag:'🇨🇦', label:'CAD' },
  { code:'AU', flag:'🇦🇺', label:'AUD' },
  { code:'CH', flag:'🇨🇭', label:'CHF' },
  { code:'NZ', flag:'🇳🇿', label:'NZD' },
];

const MARKET_FILTERS = ['All Markets','Forex','Commodities','Futures','Stocks','Crypto'];

const EVENTS = [
  // Tuesday
  { day:1, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'CPI m/m',                    sub:'Consumer Price Index · Inflation',              market:'Forex',       prev:'0.4%',  fore:'0.3%',  actual:'0.4%',  actualUp:true  },
  { day:1, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'Core CPI m/m',               sub:'Excluding food and energy',                     market:'Forex',       prev:'0.4%',  fore:'0.3%',  actual:'0.3%',  actualUp:null  },
  { day:1, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Existing Home Sales',        sub:'Monthly housing market data',                   market:'Stocks',      prev:'4.26M', fore:'4.13M', actual:'4.02M', actualUp:false },
  { day:1, time:'10:30', country:'US', flag:'🇺🇸', impact:'high',   name:'EIA Crude Oil Inventories',  sub:'Weekly crude inventory change · Crude Oil',     market:'Commodities', prev:'-2.1M', fore:'-1.4M', actual:null,    actualUp:null  },
  { day:1, time:'13:15', country:'EU', flag:'🇪🇺', impact:'high',   name:'ECB Rate Decision',          sub:'European Central Bank interest rate · EUR',     market:'Forex',       prev:'4.50%', fore:'4.25%', actual:null,    actualUp:null  },
  { day:1, time:'13:45', country:'EU', flag:'🇪🇺', impact:'high',   name:'ECB Press Conference',       sub:'ECB President statement and Q&A',               market:'Forex',       prev:null,    fore:null,    actual:null,    actualUp:null  },
  { day:1, time:'14:00', country:'GB', flag:'🇬🇧', impact:'medium', name:'UK Retail Sales m/m',        sub:'Monthly retail spending change · GBP',          market:'Forex',       prev:'0.2%',  fore:'0.3%',  actual:null,    actualUp:null  },
  // Wednesday
  { day:2, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'Jobless Claims',             sub:'Weekly unemployment filings · USD',             market:'Forex',       prev:'215K',  fore:'210K',  actual:null,    actualUp:null  },
  { day:2, time:'10:30', country:'US', flag:'🇺🇸', impact:'high',   name:'EIA Natural Gas Storage',    sub:'Weekly nat gas inventory change · Nat Gas',     market:'Commodities', prev:'-62B',  fore:'-48B',  actual:null,    actualUp:null  },
  { day:2, time:'14:00', country:'US', flag:'🇺🇸', impact:'high',   name:'FOMC Meeting Minutes',       sub:'Federal Reserve policy notes · USD, Equities',  market:'Futures',     prev:null,    fore:null,    actual:null,    actualUp:null  },
  { day:2, time:'15:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Fed Chair Speech',           sub:'Powell remarks on monetary policy outlook',     market:'Forex',       prev:null,    fore:null,    actual:null,    actualUp:null  },
  // Thursday
  { day:3, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'GDP q/q (Prelim)',           sub:'Preliminary GDP growth estimate · USD',         market:'Forex',       prev:'3.2%',  fore:'2.8%',  actual:null,    actualUp:null  },
  { day:3, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'PCE Price Index q/q',        sub:'Fed preferred inflation measure',               market:'Forex',       prev:'1.8%',  fore:'2.1%',  actual:null,    actualUp:null  },
  { day:3, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'CB Consumer Confidence',     sub:'Consumer sentiment survey',                     market:'Stocks',      prev:'92.9',  fore:'94.1',  actual:null,    actualUp:null  },
  { day:3, time:'All Day',country:'US', flag:'🇺🇸', impact:'high',  name:'USDA Weekly Export Sales',   sub:'Grain and soybean export data · Grains',        market:'Commodities', prev:null,    fore:null,    actual:null,    actualUp:null  },
  // Friday
  { day:4, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'Core PCE Price Index m/m',   sub:'Fed inflation target measure · USD, Gold',      market:'Forex',       prev:'0.3%',  fore:'0.3%',  actual:null,    actualUp:null  },
  { day:4, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'Personal Spending m/m',      sub:'Consumer spending data',                        market:'Stocks',      prev:'0.4%',  fore:'0.5%',  actual:null,    actualUp:null  },
  { day:4, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Michigan Consumer Sentiment', sub:'University of Michigan survey final',          market:'Stocks',      prev:'57.0',  fore:'54.5',  actual:null,    actualUp:null  },
  { day:4, time:'15:30', country:'US', flag:'🇺🇸', impact:'high',   name:'CFTC COT Report',            sub:'Commitment of Traders positioning data',        market:'Futures',     prev:null,    fore:null,    actual:null,    actualUp:null  },
];

const DAY_LABELS = ['Monday Apr 21','Tuesday Apr 22','Wednesday Apr 23','Thursday Apr 24','Friday Apr 25'];
const DAY_SHORT  = ['Mon','Tue','Wed','Thu','Fri'];

const IMPACT_COLORS = {
  high:   { dot:'#dc2626', pill:'#fee2e2', text:'#991b1b', label:'HIGH'   },
  medium: { dot:'#d97706', pill:'#FEF3C7', text:'#78350f', label:'MED'    },
  low:    { dot:'#9ca3af', pill:'#F9FAFB', text:'#6b7280', label:'LOW'    },
};

export default function NewsTab({ initialTab }) {
  const [dayIdx,      setDayIdx]      = useState(TODAY_IDX);
  const [showImpact,  setShowImpact]  = useState({ high:true, medium:true, low:false });
  const [activeCCs,   setActiveCCs]   = useState({ US:true, EU:true, GB:true, JP:false, CA:false, AU:false, CH:false, NZ:false });
  const [mktFilter,   setMktFilter]   = useState(initialTab || 'All Markets');
  const [viewMode,    setViewMode]    = useState('week'); // 'day' | 'week'

  const daysToShow = viewMode === 'day' ? [dayIdx] : [0,1,2,3,4];

  const filtered = EVENTS.filter(e => {
    if (!daysToShow.includes(e.day)) return false;
    if (!showImpact[e.impact]) return false;
    if (!activeCCs[e.country]) return false;
    if (mktFilter !== 'All Markets' && e.market !== mktFilter) return false;
    return true;
  });

  const byDay = daysToShow.map(d => ({
    dayIdx: d,
    label: DAY_LABELS[d],
    isToday: d === TODAY_IDX,
    events: filtered.filter(e => e.day === d),
    highCount: filtered.filter(e => e.day === d && e.impact === 'high').length,
  }));

  const toggleCC = (cc) => setActiveCCs(p => ({ ...p, [cc]: !p[cc] }));
  const toggleImpact = (k) => setShowImpact(p => ({ ...p, [k]: !p[k] }));

  const colStyle = (align='left') => ({
    fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', textAlign: align, padding: '0 10px',
  });

  return (
    <div style={{ fontFamily: 'var(--font)' }}>

      {/* ── Top bar ── */}
      <div style={{ padding:'12px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
          <span style={{ fontSize:22, fontWeight:800, color:'var(--accent)', letterSpacing:'-0.5px' }}>News</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>
            {DAY_LABELS[dayIdx].split(' ')[0]} · New York Session
          </span>
        </div>
        {/* Market tabs */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {MARKET_FILTERS.map(f => (
            <button key={f} onClick={() => setMktFilter(f)} style={{
              padding:'5px 12px', borderRadius:20, border:'1px solid var(--border2)',
              background: mktFilter===f ? 'var(--accent)' : 'var(--surface)',
              color: mktFilter===f ? '#fff' : 'var(--text-muted)',
              fontFamily:'var(--font)', fontSize:11, fontWeight: mktFilter===f?600:400,
              cursor:'pointer', transition:'all 0.15s',
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ padding:'10px 22px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>

        {/* Date nav */}
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <button onClick={() => setDayIdx(d => Math.max(0, d-1))} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontSize:13, color:'var(--text-muted)' }}>‹</button>
          {DAYS.map((d,i) => (
            <button key={d} onClick={() => { setDayIdx(i); setViewMode('day'); }} style={{
              padding:'5px 12px', borderRadius:6,
              border: dayIdx===i && viewMode==='day' ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: dayIdx===i && viewMode==='day' ? 'var(--accent)' : 'var(--surface)',
              color: dayIdx===i && viewMode==='day' ? '#fff' : 'var(--text-muted)',
              fontFamily:'var(--font)', fontSize:11, fontWeight: dayIdx===i && viewMode==='day' ? 600 : 400,
              cursor:'pointer', transition:'all 0.12s',
            }}>{d}</button>
          ))}
          <button onClick={() => setDayIdx(d => Math.min(4, d+1))} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontSize:13, color:'var(--text-muted)' }}>›</button>
          <button onClick={() => setViewMode('week')} style={{
            marginLeft:4, padding:'5px 12px', borderRadius:6,
            border: viewMode==='week' ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: viewMode==='week' ? 'var(--accent-bg)' : 'var(--surface)',
            color: viewMode==='week' ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily:'var(--font)', fontSize:11, fontWeight: viewMode==='week' ? 600 : 400,
            cursor:'pointer', transition:'all 0.12s',
          }}>This Week</button>
        </div>

        <div style={{ width:1, height:20, background:'var(--border)' }} />

        {/* Impact filters */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)' }}>Impact</span>
          {Object.entries(IMPACT_COLORS).map(([k, v]) => (
            <button key={k} onClick={() => toggleImpact(k)} style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'4px 10px', borderRadius:6,
              border: showImpact[k] ? `1px solid ${v.dot}50` : '1px solid var(--border)',
              background: showImpact[k] ? `${v.dot}12` : 'var(--surface)',
              cursor:'pointer', transition:'all 0.12s',
            }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background: showImpact[k] ? v.dot : 'var(--text-dim)', transition:'background 0.12s' }} />
              <span style={{ fontFamily:'var(--font)', fontSize:11, color: showImpact[k] ? v.dot : 'var(--text-muted)', fontWeight: showImpact[k] ? 600 : 400 }}>{v.label}</span>
            </button>
          ))}
        </div>

        <div style={{ width:1, height:20, background:'var(--border)' }} />

        {/* Country filters */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)' }}>Country</span>
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => toggleCC(c.code)} style={{
              padding:'4px 10px', borderRadius:6,
              border: activeCCs[c.code] ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              background: activeCCs[c.code] ? 'var(--accent-bg)' : 'var(--surface)',
              color: activeCCs[c.code] ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily:'var(--font)', fontSize:11, fontWeight: activeCCs[c.code] ? 600 : 400,
              cursor:'pointer', transition:'all 0.12s',
            }}>{c.flag} {c.label}</button>
          ))}
        </div>
      </div>

      {/* ── Column headers ── */}
      <div style={{ display:'grid', gridTemplateColumns:'80px 36px 36px 1fr 70px 90px 90px 90px', padding:'8px 0', background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
        <div style={colStyle()}>Time</div>
        <div style={colStyle('center')}></div>
        <div style={colStyle('center')}></div>
        <div style={colStyle()}>Event</div>
        <div style={colStyle('right')}>Impact</div>
        <div style={colStyle('right')}>Previous</div>
        <div style={colStyle('right')}>Forecast</div>
        <div style={colStyle('right')}>Actual</div>
      </div>

      {/* ── Event rows ── */}
      {byDay.map(({ dayIdx: di, label, isToday, events, highCount }) => (
        <div key={di}>
          {/* Day header */}
          <div style={{ padding:'7px 22px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text)' }}>{label}</span>
            {isToday && <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, color:'var(--accent)', background:'var(--accent-bg)', padding:'2px 8px', borderRadius:3, letterSpacing:'0.1em', textTransform:'uppercase' }}>Today</span>}
            {highCount > 0 && (
              <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'#dc2626', background:'#fee2e2', padding:'2px 9px', borderRadius:3 }}>
                {highCount} High Impact
              </span>
            )}
            {events.length === 0 && <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-dim)' }}>No events matching filters</span>}
          </div>

          {events.map((e, i) => {
            const ic = IMPACT_COLORS[e.impact];
            const hasActual = e.actual != null;
            const actualColor = hasActual
              ? (e.actualUp === true ? 'var(--green)' : e.actualUp === false ? 'var(--red)' : 'var(--text)')
              : 'var(--text-dim)';

            return (
              <div key={i}
                style={{ display:'grid', gridTemplateColumns:'80px 36px 36px 1fr 70px 90px 90px 90px', padding:'11px 0', borderBottom:'1px solid var(--border)', alignItems:'center', transition:'background 0.1s', cursor:'pointer' }}
                onMouseEnter={e2 => e2.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e2 => e2.currentTarget.style.background = 'transparent'}
              >
                {/* Time */}
                <div style={{ padding:'0 10px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>{e.time}</div>

                {/* Flag */}
                <div style={{ textAlign:'center', fontSize:16 }}>{e.flag}</div>

                {/* Impact dot */}
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:ic.dot }} />
                </div>

                {/* Event name */}
                <div style={{ padding:'0 10px' }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{e.name}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{e.sub}</div>
                </div>

                {/* Impact pill */}
                <div style={{ textAlign:'right', padding:'0 10px' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, background:ic.pill, color:ic.text, padding:'2px 7px', borderRadius:3 }}>{ic.label}</span>
                </div>

                {/* Previous */}
                <div style={{ textAlign:'right', padding:'0 10px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)' }}>{e.prev || '—'}</div>

                {/* Forecast */}
                <div style={{ textAlign:'right', padding:'0 10px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-secondary)' }}>{e.fore || '—'}</div>

                {/* Actual */}
                <div style={{ textAlign:'right', padding:'0 10px' }}>
                  {hasActual ? (
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:actualColor }}>
                      {e.actual} {e.actualUp === true ? '▲' : e.actualUp === false ? '▼' : ''}
                    </span>
                  ) : (
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-dim)' }}>
                      {di === TODAY_IDX ? 'Pending' : di > TODAY_IDX ? '—' : '—'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Footer */}
      <div style={{ padding:'10px 22px', borderTop:'1px solid var(--border)', background:'var(--surface2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>
          {filtered.length} events · {filtered.filter(e=>e.impact==='high').length} high impact
        </span>
        <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>
          Times shown in your local timezone
        </span>
      </div>
    </div>
  );
}
