const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Add rows state right before the filtered line in LeaderboardTab
s = s.replace(
  `  const filtered = (rows||[]).filter(r => !market || market==='All' || r.market===market);`,
  `  const [rows, setRows] = useState([]);
  const [lbLoading, setLbLoading] = useState(true);

  useEffect(() => {
    const periodMap = {'1W':'week','1M':'month','3M':'month','1Y':'year','All Time':'year'};
    setLbLoading(true);
    fetch('/api/leaderboard?period='+(periodMap[period]||'month'))
      .then(r=>r.json())
      .then(d=>{
        if (!d.error) setRows((d.leaderboard||[]).map((e,i)=>({
          rank: e.rank||i+1, name: e.name, isYou: e.isMe,
          pnl: (e.pnl>=0?'+':'')+e.pnl.toFixed(1)+'%',
          dollar: (e.pnl>=0?'+':'')+'$'+Math.abs(e.pnl).toFixed(0),
          trades: e.trades||0, style:'—', market:'Mixed',
          broker:'—', verified:false, streak:' ', change:0,
          winRate: e.winRate+'%', maxDD:'—', h2h:(e.h2wWins||0)+'-'+((e.h2hMatches||0)-(e.h2wWins||0)),
        })));
      })
      .catch(()=>{})
      .finally(()=>setLbLoading(false));
  }, [period, market]);

  const filtered = (rows||[]).filter(r => !market || market==='All' || r.market===market);`
)

console.log('✓ rows state added inside LeaderboardTab')
fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
