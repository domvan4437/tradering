const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Clear BracketTab left/right arrays
s = s.replace(
  /const left = \[\s*[\s\S]*?\];(\s*const right = \[\s*[\s\S]*?\];)/m,
  'const left = [];\n  const right = [];'
)

// Clear ContestTab leaderboard array
s = s.replace(
  /const leaderboard = \[\s*[\s\S]*?\];(\s*const rankColors)/m,
  'const leaderboard = [];\n  const rankColors'
)

// Clear ContestTab traders array  
s = s.replace(
  /const traders = \[\s*[\s\S]*?\];(\s*const badge)/m,
  'const traders = [];\n  const badge'
)

// Clear GroupBattleTab teamA members and teamB members
s = s.replace(
  /members: \[\s*\{ letter: 'D'[\s\S]*?\],/m,
  'members: [],'
)
s = s.replace(
  /members: \[\s*\{ letter: 'C'[\s\S]*?\],/m,
  'members: [],'
)

// Verify clean
const mocks = ['seasonalace','fxswing99','cotmaster','edgefinder','newtrader','swingking','alpharesearch','graintrader','pittrader','rookie_fx','cotbasic','goldtrader','fxpro_trader','energydesk','alphatrader','forexking','mktmover','grainbull','seasonaltrader']
let found = false
mocks.forEach(m => {
  const i = s.indexOf(m)
  if (i > -1) { console.log('Still found:', m, 'line', s.slice(0,i).split('\n').length); found = true }
})
if (!found) console.log('✓ All mock data cleared')

fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
