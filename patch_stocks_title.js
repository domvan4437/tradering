const fs = require('fs')
const PATH = 'components/StocksSection.js'
let s = fs.readFileSync(PATH, 'utf8')

s = s.replace(
  `<div style={{ fontFamily: 'var(--font)' }}>`,
  `<div style={{ fontFamily: 'var(--font)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Stocks</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>NYSE · NASDAQ · S&P 500</span>
      </div>`
)

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Stocks title added')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
