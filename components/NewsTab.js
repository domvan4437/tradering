
'use client';
import { useState, useEffect, useRef } from 'react';

const DAYS = ['Mon','Tue','Wed','Thu','Fri'];
const TODAY_IDX = Math.max(0,Math.min(4,new Date().getDay()-1));

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
  // ── MONDAY APR 21 ──
  { day:0, time:'00:30', country:'AU', flag:'🇦🇺', impact:'medium', name:'ANZ Job Advertisements m/m',          sub:'Monthly job ads change · AUD',                          market:'Forex',       prev:'-0.8%',  fore:null,    actual:'-0.3%', actualUp:true  },
  { day:0, time:'02:00', country:'CN', flag:'🇨🇳', impact:'high',   name:'Chinese GDP q/q',                      sub:'Quarterly GDP growth · CNY',                            market:'Forex',       prev:'5.4%',   fore:'5.2%',  actual:'5.3%',  actualUp:true  },
  { day:0, time:'02:00', country:'CN', flag:'🇨🇳', impact:'medium', name:'Chinese Retail Sales y/y',             sub:'Monthly retail spending · CNY',                         market:'Stocks',      prev:'4.0%',   fore:'4.2%',  actual:'5.9%',  actualUp:true  },
  { day:0, time:'02:00', country:'CN', flag:'🇨🇳', impact:'medium', name:'Chinese Industrial Production y/y',    sub:'Industrial output · CNY',                               market:'Commodities', prev:'5.9%',   fore:'5.8%',  actual:'7.7%',  actualUp:true  },
  { day:0, time:'05:00', country:'DE', flag:'🇩🇪', impact:'medium', name:'German GfK Consumer Climate',          sub:'Consumer confidence survey · EUR',                      market:'Forex',       prev:'-28.1',  fore:'-26.0', actual:'-25.8', actualUp:true  },
  { day:0, time:'06:01', country:'GB', flag:'🇬🇧', impact:'low',    name:'CBI Realized Sales',                   sub:'Retail sales survey · GBP',                             market:'Forex',       prev:'-52',    fore:'-42',   actual:'-68',   actualUp:false },
  { day:0, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'CPI m/m',                              sub:'Consumer Price Index · Inflation',                      market:'Forex',       prev:'0.4%',   fore:'0.3%',  actual:'0.4%',  actualUp:true  },
  { day:0, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'Core CPI m/m',                         sub:'CPI excluding food & energy',                           market:'Forex',       prev:'0.4%',   fore:'0.3%',  actual:'0.3%',  actualUp:null  },
  { day:0, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Existing Home Sales',                  sub:'Monthly housing market data',                           market:'Stocks',      prev:'4.26M',  fore:'4.13M', actual:'4.02M', actualUp:false },
  { day:0, time:'10:30', country:'US', flag:'🇺🇸', impact:'high',   name:'EIA Crude Oil Inventories',            sub:'Weekly crude inventory change · Crude Oil',             market:'Commodities', prev:'-2.1M',  fore:'-1.4M', actual:null,    actualUp:null  },
  { day:0, time:'13:15', country:'EU', flag:'🇪🇺', impact:'high',   name:'ECB Rate Decision',                    sub:'European Central Bank interest rate · EUR',             market:'Forex',       prev:'4.50%',  fore:'4.25%', actual:null,    actualUp:null  },
  { day:0, time:'13:45', country:'EU', flag:'🇪🇺', impact:'high',   name:'ECB Press Conference',                 sub:'ECB President statement and Q&A',                       market:'Forex',       prev:null,     fore:null,    actual:null,    actualUp:null  },
  { day:0, time:'14:00', country:'GB', flag:'🇬🇧', impact:'medium', name:'UK Retail Sales m/m',                  sub:'Monthly retail spending change · GBP',                  market:'Forex',       prev:'0.2%',   fore:'0.3%',  actual:null,    actualUp:null  },
  { day:0, time:'18:01', country:'GB', flag:'🇬🇧', impact:'low',    name:'BRC Shop Price Index y/y',             sub:'British Retail Consortium prices · GBP',                market:'Forex',       prev:'1.2%',   fore:null,    actual:'1.4%',  actualUp:true  },

  // ── TUESDAY APR 22 ──
  { day:1, time:'02:00', country:'ES', flag:'🇪🇸', impact:'medium', name:'Spanish Unemployment Rate',            sub:'Quarterly unemployment · EUR',                          market:'Forex',       prev:'9.9%',   fore:'9.8%',  actual:null,    actualUp:null  },
  { day:1, time:'03:30', country:'AU', flag:'🇦🇺', impact:'medium', name:'Monetary Policy Meeting Minutes',      sub:'RBA meeting minutes · AUD',                             market:'Forex',       prev:null,     fore:null,    actual:null,    actualUp:null  },
  { day:1, time:'05:00', country:'EU', flag:'🇪🇺', impact:'low',    name:'Consumer Confidence Flash',            sub:'Monthly consumer confidence · EUR',                     market:'Forex',       prev:'-14.5',  fore:'-14.0', actual:null,    actualUp:null  },
  { day:1, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'Building Permits',                     sub:'Monthly construction permits',                          market:'Stocks',      prev:'1.46M',  fore:'1.45M', actual:null,    actualUp:null  },
  { day:1, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'Housing Starts',                       sub:'New residential construction',                          market:'Stocks',      prev:'1.50M',  fore:'1.42M', actual:null,    actualUp:null  },
  { day:1, time:'08:55', country:'US', flag:'🇺🇸', impact:'medium', name:'Redbook y/y',                          sub:'Weekly retail sales index',                             market:'Stocks',      prev:'5.5%',   fore:null,    actual:null,    actualUp:null  },
  { day:1, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Richmond Manufacturing Index',         sub:'Manufacturing activity survey',                         market:'Futures',     prev:'-4',     fore:'-3',    actual:null,    actualUp:null  },
  { day:1, time:'13:00', country:'US', flag:'🇺🇸', impact:'medium', name:'US 2-Year Note Auction',               sub:'Treasury auction yield result',                         market:'Futures',     prev:'4.27%',  fore:null,    actual:null,    actualUp:null  },

  // ── WEDNESDAY APR 23 ──
  { day:2, time:'00:30', country:'AU', flag:'🇦🇺', impact:'medium', name:'CPI q/q',                              sub:'Quarterly consumer prices · AUD',                       market:'Forex',       prev:'0.2%',   fore:'0.8%',  actual:null,    actualUp:null  },
  { day:2, time:'01:30', country:'FR', flag:'🇫🇷', impact:'low',    name:'French Flash Manufacturing PMI',       sub:'Manufacturing activity · EUR',                          market:'Forex',       prev:'48.5',   fore:'49.0',  actual:null,    actualUp:null  },
  { day:2, time:'01:30', country:'FR', flag:'🇫🇷', impact:'low',    name:'French Flash Services PMI',            sub:'Services activity · EUR',                               market:'Forex',       prev:'50.9',   fore:'51.0',  actual:null,    actualUp:null  },
  { day:2, time:'02:00', country:'DE', flag:'🇩🇪', impact:'medium', name:'German Flash Manufacturing PMI',       sub:'Manufacturing activity · EUR',                          market:'Forex',       prev:'48.3',   fore:'49.0',  actual:null,    actualUp:null  },
  { day:2, time:'02:00', country:'DE', flag:'🇩🇪', impact:'medium', name:'German Flash Services PMI',            sub:'Services activity · EUR',                               market:'Forex',       prev:'50.9',   fore:'51.5',  actual:null,    actualUp:null  },
  { day:2, time:'02:30', country:'EU', flag:'🇪🇺', impact:'medium', name:'Flash Manufacturing PMI',              sub:'Eurozone manufacturing activity',                        market:'Forex',       prev:'48.6',   fore:'49.3',  actual:null,    actualUp:null  },
  { day:2, time:'02:30', country:'EU', flag:'🇪🇺', impact:'medium', name:'Flash Services PMI',                   sub:'Eurozone services activity',                            market:'Forex',       prev:'51.0',   fore:'51.5',  actual:null,    actualUp:null  },
  { day:2, time:'03:30', country:'GB', flag:'🇬🇧', impact:'medium', name:'Flash Manufacturing PMI',              sub:'UK manufacturing activity · GBP',                       market:'Forex',       prev:'44.9',   fore:'45.5',  actual:null,    actualUp:null  },
  { day:2, time:'03:30', country:'GB', flag:'🇬🇧', impact:'medium', name:'Flash Services PMI',                   sub:'UK services activity · GBP',                            market:'Forex',       prev:'52.5',   fore:'52.8',  actual:null,    actualUp:null  },
  { day:2, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'Flash Manufacturing PMI',              sub:'US manufacturing activity',                             market:'Futures',     prev:'50.2',   fore:'50.5',  actual:null,    actualUp:null  },
  { day:2, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'Flash Services PMI',                   sub:'US services activity',                                  market:'Futures',     prev:'54.4',   fore:'54.0',  actual:null,    actualUp:null  },
  { day:2, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'New Home Sales',                       sub:'Monthly new home sales data',                           market:'Stocks',      prev:'676K',   fore:'682K',  actual:null,    actualUp:null  },
  { day:2, time:'10:30', country:'US', flag:'🇺🇸', impact:'high',   name:'EIA Natural Gas Storage',              sub:'Weekly nat gas inventory change · Nat Gas',             market:'Commodities', prev:'-62B',   fore:'-48B',  actual:null,    actualUp:null  },
  { day:2, time:'14:00', country:'US', flag:'🇺🇸', impact:'high',   name:'FOMC Meeting Minutes',                 sub:'Federal Reserve policy notes · USD Equities',           market:'Futures',     prev:null,     fore:null,    actual:null,    actualUp:null  },
  { day:2, time:'15:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Fed Chair Speech',                     sub:'Powell remarks on monetary policy outlook',             market:'Forex',       prev:null,     fore:null,    actual:null,    actualUp:null  },

  // ── THURSDAY APR 24 ──
  { day:3, time:'02:00', country:'DE', flag:'🇩🇪', impact:'medium', name:'German IFO Business Climate',          sub:'Business confidence survey · EUR',                      market:'Forex',       prev:'86.7',   fore:'87.0',  actual:null,    actualUp:null  },
  { day:3, time:'03:00', country:'EU', flag:'🇪🇺', impact:'medium', name:'M3 Money Supply y/y',                  sub:'Eurozone money supply growth · EUR',                    market:'Forex',       prev:'3.0%',   fore:'3.1%',  actual:null,    actualUp:null  },
  { day:3, time:'03:00', country:'EU', flag:'🇪🇺', impact:'low',    name:'Private Loans y/y',                    sub:'Eurozone private sector lending · EUR',                 market:'Forex',       prev:'3.0%',   fore:'3.1%',  actual:null,    actualUp:null  },
  { day:3, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'GDP q/q (Advance)',                    sub:'First GDP growth estimate · USD',                       market:'Forex',       prev:'2.4%',   fore:'2.1%',  actual:null,    actualUp:null  },
  { day:3, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'Jobless Claims',                       sub:'Weekly unemployment filings · USD',                     market:'Forex',       prev:'215K',   fore:'222K',  actual:null,    actualUp:null  },
  { day:3, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'Core PCE Price Index q/q',             sub:'Fed preferred inflation measure · USD',                 market:'Forex',       prev:'2.0%',   fore:'2.3%',  actual:null,    actualUp:null  },
  { day:3, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'Goods Trade Balance',                  sub:'Monthly trade deficit data',                            market:'Forex',       prev:'-147.9B',fore:'-145B', actual:null,    actualUp:null  },
  { day:3, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Pending Home Sales m/m',               sub:'Monthly pending home sales index',                      market:'Stocks',      prev:'-4.6%',  fore:'1.0%',  actual:null,    actualUp:null  },
  { day:3, time:'10:30', country:'US', flag:'🇺🇸', impact:'high',   name:'EIA Crude Oil Inventories',            sub:'Weekly crude inventory change · Crude Oil',             market:'Commodities', prev:'-2.1M',  fore:'-1.0M', actual:null,    actualUp:null  },
  { day:3, time:'All Day', country:'EU', flag:'🇪🇺', impact:'low',  name:'Italian 10-Year Bond Auction',         sub:'Italian government bond yield result',                  market:'Futures',     prev:'3.85%',  fore:null,    actual:null,    actualUp:null  },
  { day:3, time:'All Day', country:'DE', flag:'🇩🇪', impact:'medium',name:'German 10-Year Bond Auction',         sub:'German Bund yield result',                              market:'Futures',     prev:'2.75%',  fore:null,    actual:null,    actualUp:null  },

  // ── FRIDAY APR 25 ──
  { day:4, time:'01:30', country:'FR', flag:'🇫🇷', impact:'medium', name:'French Consumer Spending m/m',         sub:'Monthly consumer spending · EUR',                       market:'Forex',       prev:'-1.4%',  fore:'0.7%',  actual:null,    actualUp:null  },
  { day:4, time:'01:30', country:'FR', flag:'🇫🇷', impact:'medium', name:'French Prelim GDP q/q',                sub:'Preliminary GDP estimate · EUR',                        market:'Forex',       prev:'0.2%',   fore:'0.2%',  actual:null,    actualUp:null  },
  { day:4, time:'02:00', country:'DE', flag:'🇩🇪', impact:'medium', name:'German Import Prices m/m',             sub:'Import price change · EUR',                             market:'Forex',       prev:'0.3%',   fore:'3.6%',  actual:null,    actualUp:null  },
  { day:4, time:'02:00', country:'DE', flag:'🇩🇪', impact:'medium', name:'German Retail Sales m/m',              sub:'Monthly retail spending · EUR',                         market:'Forex',       prev:'-0.6%',  fore:'-0.3%', actual:null,    actualUp:null  },
  { day:4, time:'02:45', country:'FR', flag:'🇫🇷', impact:'medium', name:'French Prelim CPI m/m',                sub:'Preliminary consumer prices · EUR',                     market:'Forex',       prev:'1.0%',   fore:'0.9%',  actual:null,    actualUp:null  },
  { day:4, time:'03:00', country:'ES', flag:'🇪🇸', impact:'medium', name:'Spanish Flash CPI y/y',                sub:'Preliminary inflation · EUR',                           market:'Forex',       prev:'3.3%',   fore:'3.5%',  actual:null,    actualUp:null  },
  { day:4, time:'03:00', country:'ES', flag:'🇪🇸', impact:'medium', name:'Spanish Flash GDP q/q',                sub:'Preliminary GDP estimate · EUR',                        market:'Forex',       prev:'0.8%',   fore:'0.5%',  actual:null,    actualUp:null  },
  { day:4, time:'03:55', country:'DE', flag:'🇩🇪', impact:'medium', name:'German Unemployment Change',           sub:'Change in unemployed persons · EUR',                    market:'Forex',       prev:'0K',     fore:'4K',    actual:null,    actualUp:null  },
  { day:4, time:'04:00', country:'DE', flag:'🇩🇪', impact:'high',   name:'German Prelim GDP q/q',                sub:'Preliminary GDP growth · EUR',                          market:'Forex',       prev:'0.3%',   fore:'0.1%',  actual:null,    actualUp:null  },
  { day:4, time:'04:00', country:'EU', flag:'🇪🇺', impact:'high',   name:'Core CPI Flash Estimate y/y',          sub:'Eurozone core inflation flash · EUR',                   market:'Forex',       prev:'2.3%',   fore:'2.2%',  actual:null,    actualUp:null  },
  { day:4, time:'04:00', country:'EU', flag:'🇪🇺', impact:'high',   name:'CPI Flash Estimate y/y',               sub:'Eurozone headline inflation flash · EUR',               market:'Forex',       prev:'2.6%',   fore:'3.0%',  actual:null,    actualUp:null  },
  { day:4, time:'04:00', country:'EU', flag:'🇪🇺', impact:'high',   name:'Prelim Flash GDP q/q',                 sub:'Eurozone preliminary GDP · EUR',                        market:'Forex',       prev:'0.2%',   fore:'0.2%',  actual:null,    actualUp:null  },
  { day:4, time:'04:00', country:'EU', flag:'🇪🇺', impact:'medium', name:'Unemployment Rate',                    sub:'Eurozone unemployment rate · EUR',                      market:'Forex',       prev:'6.2%',   fore:'6.2%',  actual:null,    actualUp:null  },
  { day:4, time:'08:30', country:'US', flag:'🇺🇸', impact:'high',   name:'Core PCE Price Index m/m',             sub:'Fed preferred inflation measure monthly · USD Gold',    market:'Forex',       prev:'0.4%',   fore:'0.1%',  actual:null,    actualUp:null  },
  { day:4, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'Personal Income m/m',                  sub:'Monthly personal income change',                        market:'Stocks',      prev:'0.7%',   fore:'0.4%',  actual:null,    actualUp:null  },
  { day:4, time:'08:30', country:'US', flag:'🇺🇸', impact:'medium', name:'Personal Spending m/m',                sub:'Monthly consumer spending change',                      market:'Stocks',      prev:'0.4%',   fore:'0.5%',  actual:null,    actualUp:null  },
  { day:4, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Michigan Consumer Sentiment',          sub:'University of Michigan sentiment final',                market:'Stocks',      prev:'57.0',   fore:'54.5',  actual:null,    actualUp:null  },
  { day:4, time:'10:00', country:'US', flag:'🇺🇸', impact:'medium', name:'Michigan Inflation Expectations',      sub:'1-Year inflation expectations survey',                  market:'Forex',       prev:'5.0%',   fore:null,    actual:null,    actualUp:null  },
  { day:4, time:'15:30', country:'US', flag:'🇺🇸', impact:'high',   name:'CFTC COT Report',                      sub:'Commitment of Traders positioning data',                market:'Futures',     prev:null,     fore:null,    actual:null,    actualUp:null  },
  { day:4, time:'15:30', country:'US', flag:'🇺🇸', impact:'medium', name:'CFTC Speculative Positions',           sub:'Net speculative positions by asset class',              market:'Futures',     prev:null,     fore:null,    actual:null,    actualUp:null  },
];


const DAY_LABELS = ["Monday Apr 27","Tuesday Apr 28","Wednesday Apr 29","Thursday Apr 30","Friday May 1"];
const DAY_SHORT  = ['Mon','Tue','Wed','Thu','Fri'];

const IMPACT_COLORS = {
  high:   { dot:'#dc2626', pill:'#fee2e2', text:'#991b1b', label:'HIGH'   },
  medium: { dot:'#d97706', pill:'#fef08a', text:'#713f12', label:'MED'    },
  low:    { dot:'#16a34a', pill:'#dcfce7', text:'#166534', label:'LOW'    },
};

export default function NewsTab({ initialTab }) {
  const [liveEvents, setLiveEvents] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetch('/api/economic-calendar')
      .then(r => r.json())
      .then(data => {
        if (data.events && data.events.length > 0) {
          setLiveEvents(data.events);
        }
        setLoadingEvents(false);
      })
      .catch(() => setLoadingEvents(false));
  }, []);

  const allEvents = liveEvents || EVENTS;
  const [selectedMonday,setSelectedMonday]=useState(null);
  const weekMondayRef = useRef(null);
  const WDAYS=['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const baseMonday = (() => {
    const mon = weekMondayRef.current || selectedMonday;
    if(mon) {
      const p=mon.split('-');
      return new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));
    }
    const t=new Date(); const d=t.getDay();
    const m=new Date(t); m.setDate(t.getDate()-(d===0?6:d-1)); return m;
  })();
  const dynLabels = WDAYS.map((d,i) => {
    const dt=new Date(baseMonday); dt.setDate(baseMonday.getDate()+i);
    return d+' '+dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  });
  const dynWeekStart = new Date(baseMonday); dynWeekStart.setHours(0,0,0,0);

  function getFridayFrom(m){const p=m.split('-');const d=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));d.setDate(d.getDate()+4);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function getMondayOf(s){const p=s.split('-');const d=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));const day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function fetchWeek(fromDate){
    if(fromDate) weekMondayRef.current = fromDate;
    const url=fromDate?'/api/economic-calendar?from='+fromDate+'&to='+getFridayFrom(fromDate):'/api/economic-calendar';
    fetch(url).then(r=>r.json()).then(data=>{if(data.events&&data.events.length>0)setLiveEvents(data.events);}).catch(()=>{});
  }

  const [dayIdx,      setDayIdx]      = useState(TODAY_IDX);
  const [showImpact,  setShowImpact]  = useState({ high:true, medium:true, low:false });
  const [activeCCs,   setActiveCCs]   = useState({ US:true, EU:true, GB:true, JP:false, CA:false, AU:false, CH:false, NZ:false });
  const [mktFilter,   setMktFilter]   = useState(initialTab || 'All Markets');
  const [viewMode,    setViewMode]    = useState('week');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // 'day' | 'week'

  const daysToShow = viewMode === 'day' ? [dayIdx] : [0,1,2,3,4];

  const today=new Date();
  const todayDay=today.getDay();
  const weekStart=new Date(today);
  weekStart.setDate(today.getDate()-(todayDay===0?6:todayDay-1));
  weekStart.setHours(0,0,0,0);const filtered=allEvents.filter(e=>{if(e.date){const parts=e.date.split('-');const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));const diff=Math.round((d-dynWeekStart)/(1000*60*60*24));e.day=diff<0?0:diff>4?4:diff;}
    if (!daysToShow.includes(e.day)) return false;
    if (!showImpact[e.impact]) return false;
    if (!activeCCs[e.country]) return false;
    if (mktFilter !== 'All Markets' && e.market !== mktFilter) return false;
    return true;
  });

  const byDay = daysToShow.map(d => ({
    dayIdx: d,
    label: dynLabels[d],
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
            {dynLabels[dayIdx].split(' ')[0]} · New York Session
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
          <div style={{ position:'relative', marginRight:8 }}>
            <button onClick={() => { const cur=weekMondayRef.current||(()=>{const t=new Date();const d=t.getDay();const m=new Date(t);m.setDate(t.getDate()-(d===0?6:d-1));return m.getFullYear()+'-'+String(m.getMonth()+1).padStart(2,'0')+'-'+String(m.getDate()).padStart(2,'0');})();const pts=cur.split('-');const dt=new Date(parseInt(pts[0]),parseInt(pts[1])-1,parseInt(pts[2]));dt.setDate(dt.getDate()-7);const ms=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');weekMondayRef.current=ms;setSelectedMonday(ms);fetchWeek(ms);setDayIdx(0);setViewMode('week'); }} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>
              ← Prev Week
            </button>
            <button onClick={() => { weekMondayRef.current=null;setSelectedMonday(null);fetchWeek(null);setDayIdx(TODAY_IDX);setViewMode('week'); }} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--accent)', background:'var(--accent-bg)', cursor:'pointer', fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', fontWeight:600 }}>This Week</button>
            <button onClick={() => { const cur=weekMondayRef.current||(()=>{const t=new Date();const d=t.getDay();const m=new Date(t);m.setDate(t.getDate()-(d===0?6:d-1));return m.getFullYear()+'-'+String(m.getMonth()+1).padStart(2,'0')+'-'+String(m.getDate()).padStart(2,'0');})();const pts=cur.split('-');const dt=new Date(parseInt(pts[0]),parseInt(pts[1])-1,parseInt(pts[2]));dt.setDate(dt.getDate()+7);const ms=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');weekMondayRef.current=ms;setSelectedMonday(ms);fetchWeek(ms);setDayIdx(0);setViewMode('week'); }} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Next Week →</button>
            <button onClick={() => setCalendarOpen(o=>!o)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>📅 Jump to date
            </button>
            {calendarOpen && (
              <div style={{ position:'absolute', top:'110%', left:0, zIndex:300, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:12, boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
                <input type="date" autoFocus onChange={e => {
                  if(!e.target.value) return;
                  const monday = getMondayOf(e.target.value);
                  const parts=e.target.value.split('-');
                  const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
                  const day=d.getDay();
                  const idx={1:0,2:1,3:2,4:3,5:4,6:4,0:0}[day];
                  setDayIdx(idx);
                  setViewMode('day');
                  setSelectedMonday(monday);
                  fetchWeek(monday);
                  setCalendarOpen(false);
                }} style={{ padding:'8px 12px', border:'1px solid var(--border)', borderRadius:8, fontFamily:'var(--font)', fontSize:13, color:'var(--text)', background:'var(--surface2)', outline:'none' }} />
              </div>
            )}
          </div>
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
