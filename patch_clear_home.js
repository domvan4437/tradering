const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Clear openChallenges array
s = s.replace(
  `  const openChallenges = [
    { name: 'seasonalace', wr: '76%', league: 'gold', color: '#d97706', asset: 'Commodities', dur: '1 Week', stake: '$50', desc: 'COT setups only' },
    { name: 'fxswing99', wr: '67%', league: 'silver', color: '#0891b2', asset: 'Forex', dur: '3 Days', stake: '$25', desc: 'Major pairs only' },
  ];`,
  `  const openChallenges = [];`
)

// Clear activity array
s = s.replace(
  `  const activity = [
    { type: 'Won', bg: '#EAF3DE', color: '#27500A', text: 'Beat swingking in 7-day gold challenge', time: '2d ago' },
    { type: 'Joined', bg: '#FAEEDA', color: '#633806', text: 'Entered COT Weekly Contest', time: '3d ago' },
    { type: 'Lost', bg: '#FCEBEB', color: '#791F1F', text: 'Challenged by cotmaster — forex duel', time: '5d ago' },
  ];`,
  `  const activity = [];`
)

// Check for any other mock arrays
const remaining = ['seasonalace','fxswing99','cotmaster','edgefinder','newtrader']
remaining.forEach(m => {
  const i = s.indexOf(m)
  if (i > -1) console.log('Still found:', m, 'at line', s.slice(0,i).split('\n').length)
})

console.log('✓ Mock data cleared')
fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
