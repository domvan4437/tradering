const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Fix the broken dollar line
s = s.replace(
  `dollar: (e.pnl>=0?'+':'')+'`,
  `dollar: (e.pnl>=0?'+':'-')+'USD'+Math.abs(e.pnl).toFixed(0), _broken:`
)

// Actually let's just find and fix line 583 directly
const lines = s.split('\n')
const brokenIdx = lines.findIndex(l => l.includes(`dollar: (e.pnl>=0?'+':'')+`))
if (brokenIdx > -1) {
  lines[brokenIdx] = `          dollar: '$'+Math.abs(e.pnl||0).toFixed(0),`
  console.log('✓ Fixed dollar line at', brokenIdx+1)
}
s = lines.join('\n')

fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
