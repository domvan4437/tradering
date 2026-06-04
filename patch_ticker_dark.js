const fs = require('fs')
let s = fs.readFileSync('app/globals.css', 'utf8')

// Add dark mode override for ticker after the .tk-wrap block
const OLD = `.tk-wrap {
  position: fixed;
  top: 46px; left: 0; right: 0;
  height: 36px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  overflow: hidden;
  z-index: 199;
}`

const NEW = `.tk-wrap {
  position: fixed;
  top: 46px; left: 0; right: 0;
  height: 36px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  overflow: hidden;
  z-index: 199;
}
[data-theme="dark"] .tk-wrap {
  background: #1a1d27;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
[data-theme="dark"] .tk-name {
  color: rgba(255,255,255,0.7);
}
[data-theme="dark"] .tk-price {
  color: rgba(255,255,255,0.9);
}
[data-theme="dark"] .tk-div {
  color: rgba(255,255,255,0.15);
}`

if (s.includes(OLD)) {
  s = s.replace(OLD, NEW)
  console.log('✓ Dark mode ticker styles added')
} else {
  console.log('⚠ Pattern not matched')
}

fs.writeFileSync('app/globals.css', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
