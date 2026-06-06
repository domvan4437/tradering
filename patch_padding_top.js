const fs = require('fs')

const files = [
  'components/AccountTab.js',
  'components/TradeZarJournal.js',
]

files.forEach(f => {
  let s = fs.readFileSync(f, 'utf8')
  
  // Reduce paddingTop from 82 to 46 (just the nav height, not nav+ticker)
  // The ticker is position:fixed so content doesn't need to account for it twice
  s = s.replace(
    `minHeight: 'calc(100vh - 82px)', paddingTop: 82`,
    `minHeight: 'calc(100vh - 82px)', paddingTop: 46`
  )
  
  fs.writeFileSync(f, s, 'utf8')
  console.log('✓ Fixed:', f)
})

// Also fix the sidebar paddingTop in both files
files.forEach(f => {
  let s = fs.readFileSync(f, 'utf8')
  
  // Sidebar paddingTop should match
  s = s.replace(/paddingTop:92/g, 'paddingTop:56')
  s = s.replace(/paddingTop: 92/g, 'paddingTop: 56')
  
  fs.writeFileSync(f, s, 'utf8')
})

console.log('✓ Sidebar paddingTop adjusted')
console.log('\nRun: rd /s /q .next & npm run dev')
