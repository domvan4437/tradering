const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Fix default
s = s.replace(
  `const [historySubTab, setHistorySubTab] = useState('overview');`,
  `const [historySubTab, setHistorySubTab] = useState('h2h');`
)

// Fix sidebar history subtabs to match what MatchHistory renders
s = s.replace(
  `['overview','my trades','opponent','ai review'].map(ft => (`,
  `['h2h','group'].map(ft => (`
)

console.log('✓ History subtab keys aligned')
fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
