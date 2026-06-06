const fs = require('fs')
let s = fs.readFileSync('components/MatchHistory.js', 'utf8')

// Replace the function signature and internal tab state to use the prop
s = s.replace(
  `export default function MatchHistory({ onExportNote }) {\n  const [selected, setSelected] = useState(null);\n  const [filter, setFilter] = useState('all');\n  const [historyTab, setHistoryTab] = useState('h2h');`,
  `export default function MatchHistory({ onExportNote, subTab, setSubTab }) {\n  const [selected, setSelected] = useState(null);\n  const [filter, setFilter] = useState('all');\n  const historyTab = subTab || 'h2h';\n  const setHistoryTab = (t) => { if (setSubTab) setSubTab(t); };`
)

console.log('✓ MatchHistory now uses subTab prop')
fs.writeFileSync('components/MatchHistory.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
