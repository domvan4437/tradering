const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// The stocks section is inside padding:'20px 24px' wrapper
// but the nav(46px) + ticker(36px) are both fixed/sticky = 82px total
// We need to wrap StocksOverviewTab with correct top offset

s = s.replace(
  `{section === 'stocks' && <>\r\n          {subTab==='Overview'   && <StocksOverviewTab />}`,
  `{section === 'stocks' && <>\r\n          {subTab==='Overview'   && <div style={{ marginTop: 82 }}><StocksOverviewTab /></div>}`
)

if (s.includes('marginTop: 82')) {
  console.log('✓ Added marginTop: 82 to StocksOverviewTab')
} else {
  // try LF version
  s = s.replace(
    `{section === 'stocks' && <>\n          {subTab==='Overview'   && <StocksOverviewTab />}`,
    `{section === 'stocks' && <>\n          {subTab==='Overview'   && <div style={{ marginTop: 82 }}><StocksOverviewTab /></div>}`
  )
  if (s.includes('marginTop: 82')) {
    console.log('✓ Added marginTop: 82 (LF version)')
  } else {
    console.warn('⚠ Not matched — trying regex')
    s = s.replace(
      /\{subTab==='Overview'\s+&&\s+<StocksOverviewTab \/>\}/,
      `{subTab==='Overview'   && <div style={{ marginTop: 82 }}><StocksOverviewTab /></div>}`
    )
    console.log('✓ Added marginTop: 82 via regex')
  }
}

// Also remove the paddingTop:14 from StocksSection since we're handling offset in CommodityScreener
const STOCKS_PATH = 'components/StocksSection.js'
let ss = fs.readFileSync(STOCKS_PATH, 'utf8')
ss = ss.replace(
  `<div style={{ fontFamily: 'var(--font)', paddingTop: 14 }}>`,
  `<div style={{ fontFamily: 'var(--font)' }}>`
)
fs.writeFileSync(STOCKS_PATH, ss, 'utf8')
console.log('✓ Removed paddingTop from StocksSection')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
