const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Add import
if (!s.includes('TradeZarJournal')) {
  s = s.replace(
    `import { JournalLanding } from './JournalLanding'`,
    `import { JournalLanding } from './JournalLanding'\nimport TradeZarJournal from './TradeZarJournal'`
  )
  console.log('✓ TradeZarJournal import added')
} else {
  console.log('✓ Already imported')
}

// 2. Replace Journal subtab rendering — replace JournalLanding + Notes + Review + Trade Log
// with just TradeZarJournal (which handles its own subtabs internally)
s = s.replace(
  `{tab==='Journal'    && <div style={{padding:'20px 24px'}}><JournalLanding onSelect={t=>setTab(t)} /></div>}\r\n            {tab==='Notes'      && <div style={{padding:'20px 24px'}}><NotesTab /></div>}\r\n            {tab==='Review'     && <div style={{padding:'20px 24px'}}><JournalReviewTab /></div>}\r\n            {tab==='Trade Log'  && <div style={{padding:'20px 24px'}}><JournalTradeLogTab /></div>}`,
  `{tab==='Journal'    && <TradeZarJournal />}`
)

if (s.includes('<TradeZarJournal />')) {
  console.log('✓ TradeZarJournal wired in')
} else {
  // try LF
  s = s.replace(
    `{tab==='Journal'    && <div style={{padding:'20px 24px'}}><JournalLanding onSelect={t=>setTab(t)} /></div>}\n            {tab==='Notes'      && <div style={{padding:'20px 24px'}}><NotesTab /></div>}\n            {tab==='Review'     && <div style={{padding:'20px 24px'}}><JournalReviewTab /></div>}\n            {tab==='Trade Log'  && <div style={{padding:'20px 24px'}}><JournalTradeLogTab /></div>}`,
    `{tab==='Journal'    && <TradeZarJournal />}`
  )
  if (s.includes('<TradeZarJournal />')) {
    console.log('✓ Wired (LF version)')
  } else {
    s = s.replace(
      /\{tab==='Journal'\s+&&[\s\S]*?\{tab==='Trade Log'[\s\S]*?<\/div>\}/,
      `{tab==='Journal'    && <TradeZarJournal />}`
    )
    console.log('✓ Wired (regex version)')
  }
}

// 3. Remove Notes, Review, Trade Log from journal subtabs
s = s.replace(
  `journal:     ['Notes','Review','Trade Log'],`,
  `journal:     ['Journal'],`
)
s = s.replace(
  `journal:     ['Notes','Review','Trade Log'],\r\n`,
  `journal:     ['Journal'],\r\n`
)
console.log('✓ Journal subtabs simplified')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
