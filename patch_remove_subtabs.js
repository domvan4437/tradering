const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

s = s.replace(
  `commodities: ['Overview','Screener','COT Index','Seasonal','Watchlist','Positions','Journal','Ideas','Economic Calendar','Analytics','Alerts','Checklist'],\r\n    forex:       ['Overview','COT Data','Key Levels','Economic Calendar'],\r\n    stocks:      ['Overview','Sectors','Earnings','Key Levels'],\r\n    crypto:      ['Overview'],\r\n    futures:     ['Overview','Financial COT','Yield Curve','Key Levels'],`,
  `commodities: ['Overview'],\r\n    forex:       ['Overview'],\r\n    stocks:      ['Overview','Sectors','Earnings','Key Levels'],\r\n    crypto:      ['Overview'],\r\n    futures:     ['Overview'],`
)

if (s.includes(`commodities: ['Overview'],`)) {
  console.log('✓ Subtabs cleared for commodities, forex, futures, crypto')
} else {
  console.warn('⚠ Pattern not matched — trying CRLF-agnostic regex')
  s = s.replace(
    /commodities: \[.*?\],/s,
    `commodities: ['Overview'],`
  )
  s = s.replace(
    /forex:\s+\[.*?\],/,
    `forex:       ['Overview'],`
  )
  s = s.replace(
    /futures:\s+\[.*?\],/,
    `futures:     ['Overview'],`
  )
  console.log('✓ Applied via regex')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
