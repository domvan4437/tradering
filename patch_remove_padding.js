const fs = require('fs')

const files = [
  'components/AccountTab.js',
  'components/TradeZarJournal.js',
]

files.forEach(f => {
  let s = fs.readFileSync(f, 'utf8')

  // Remove paddingTop from outer wrapper entirely
  s = s.replace(
    `minHeight: 'calc(100vh - 82px)', paddingTop: 46`,
    `minHeight: 'calc(100vh - 82px)'`
  )
  s = s.replace(
    `minHeight: 'calc(100vh - 82px)', paddingTop: 82`,
    `minHeight: 'calc(100vh - 82px)'`
  )

  fs.writeFileSync(f, s, 'utf8')
  console.log('✓ paddingTop removed from outer wrapper:', f)
})

console.log('\nRun: rd /s /q .next & npm run dev')
