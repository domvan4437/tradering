const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// ── WIRE LEADERBOARD TAB ────────────────────────────────────
const lbStart = s.indexOf('function LeaderboardTab()')
const lbEnd = s.indexOf('\nfunction CompeteHome')

const oldLb = s.slice(lbStart, lbEnd)

const newLb = `function LeaderboardTab() {
  const [period, setPeriod] = React.useState('1M');
  const [market, setMarket] = React.useState('All');
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState([]);

  const PERIODS = ['1W','1M','3M','1Y','All Time'];
  const MARKETS = ['All','Forex','Commodities','Futures','Stocks','Crypto'];
  const periodMap = {'1W':'week','1M':'month','3M':'month','1Y':'year','All Time':'year'};

  const load = React.useCallback(() => {
    setLoading(true);
    fetch('/api/leaderboard?period='+(periodMap[period]||'month'))
      .then(r=>r.json())
      .then(d=>{
        if (!d.error) {
          setRows((d.leaderboard||[]).map((e,i)=>({
            rank: e.rank||i+1,
            name: e.name,
            pnl: (e.pnl>=0?'+':'')+'$'+Math.abs(e.pnl).toFixed(0),
            dollar: (e.pnl>=0?'+':'')+'$'+Math.abs(e.pnl).toFixed(0),
            trades: e.trades||0,
            style: '—',
            market: market==='All'?'Mixed':market,
            broker: '—',
            verified: false,
            streak: 0,
            badge: i===0?'🥇':i===1?'🥈':i===2?'🥉':'',
            isMe: e.isMe||false,
            winRate: e.winRate||0,
            h2hWins: e.h2wWins||0,
            h2hMatches: e.h2hMatches||0,
          })));
        }
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [period, market]);

  React.useEffect(()=>{ load(); }, [load]);

`

// Find the return statement of leaderboard
const lbReturnIdx = oldLb.lastIndexOf('  return (')
const lbReturn = oldLb.slice(lbReturnIdx)

const newLbFull = newLb + lbReturn

s = s.slice(0, lbStart) + newLbFull + s.slice(lbEnd)
console.log('✓ LeaderboardTab wired to API')

// Now replace DATA[period] references with rows
s = s.replace(
  /DATA\[period\]\.filter\([^)]+\)/g,
  'rows'
)
s = s.replace(/DATA\[period\]/g, 'rows')
s = s.replace(/const filteredData = rows/, 'const filteredData = rows')
// Handle case where it filters inline
if (s.includes('DATA[')) {
  s = s.replace(/DATA\['[^']+'\]/g, 'rows')
  console.log('✓ Replaced remaining DATA[] references')
}
console.log('✓ Replaced DATA[period] with rows')

fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved CompeteTab.js')

// ── WIRE GroupContest.js ─────────────────────────────────────
let gc = fs.readFileSync('components/GroupContest.js', 'utf8')

// Add fetch at top of component
const gcFnStart = gc.indexOf('export default function GroupContest')
if (gcFnStart === -1) {
  console.log('⚠ GroupContest export not found, trying default export pattern')
} else {
  const gcStateStart = gc.indexOf('  const [', gcFnStart)
  const fetchCode = `
  const [contests, setContests] = React.useState(null);
  const [myContestIds, setMyContestIds] = React.useState([]);
  const [apiLoading, setApiLoading] = React.useState(true);

  React.useEffect(()=>{
    fetch('/api/group-contests').then(r=>r.json()).then(d=>{
      if (!d.error) {
        setContests(d.contests||[]);
        setMyContestIds(d.myContestIds||[]);
      }
    }).catch(()=>{}).finally(()=>setApiLoading(false));
  }, []);

  const joinContest = async (contestId) => {
    await fetch('/api/group-contests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'join',contestId})});
    const d = await fetch('/api/group-contests').then(r=>r.json());
    if (!d.error) { setContests(d.contests||[]); setMyContestIds(d.myContestIds||[]); }
  };

`
  gc = gc.slice(0, gcStateStart) + fetchCode + gc.slice(gcStateStart)
  console.log('✓ GroupContest fetch added')
}

// Replace MOCK_CONTESTS with contests || MOCK_CONTESTS fallback
gc = gc.replace(/MOCK_CONTESTS/g, '(contests||MOCK_CONTESTS)')
console.log('✓ GroupContest uses real data with mock fallback')

fs.writeFileSync('components/GroupContest.js', gc, 'utf8')
console.log('✓ Saved GroupContest.js')

// ── WIRE MatchHistory.js ─────────────────────────────────────
let mh = fs.readFileSync('components/MatchHistory.js', 'utf8')
const mhFnStart = mh.indexOf('export default function MatchHistory')
if (mhFnStart > -1) {
  const mhStateStart = mh.indexOf('  const [', mhFnStart)
  const mhFetchCode = `
  const [history, setHistory] = React.useState([]);
  const [histLoading, setHistLoading] = React.useState(true);

  React.useEffect(()=>{
    fetch('/api/challenges?status=completed').then(r=>r.json()).then(d=>{
      if (d.completed) setHistory(d.completed);
    }).catch(()=>{}).finally(()=>setHistLoading(false));
  }, []);

`
  mh = mh.slice(0, mhStateStart) + mhFetchCode + mh.slice(mhStateStart)
  fs.writeFileSync('components/MatchHistory.js', mh, 'utf8')
  console.log('✓ MatchHistory fetch added')
}

console.log('\nAll done! Run: rd /s /q .next & npm run dev')
