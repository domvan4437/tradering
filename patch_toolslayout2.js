const fs = require('fs')

let cs = fs.readFileSync('components/CommodityScreener.js', 'utf8')

// Add ToolsLayout import if not present
if (!cs.includes("import ToolsLayout from './ToolsLayout'")) {
  cs = cs.replace(
    "import TradeRingJournal from './TradeRingJournal'",
    "import TradeRingJournal from './TradeRingJournal'\nimport ToolsLayout from './ToolsLayout'"
  )
  console.log('✓ ToolsLayout imported')
} else {
  console.log('✓ ToolsLayout already imported')
}

// Replace the tools section
const OLD = `section==='tools2' ? (\r\n          <div style={{padding:'20px 24px'}}>\r\n            {!tab && (() => { setTimeout(() => setTab('Journal'), 0); return null; })()}\r\n            {tab==='Journal'    && <TradeRingJournal />}\r\n            {tab==='Trade Calc' && <><TabTooltip tab='Trade Calc' /><TradeCalcTab /></>}\r\n            {tab==='Trade Plan Builder' && <><TabTooltip tab='Trade Plan Builder' /><TradePlanTab /></>}\r\n            {tab==='Strategy Backtest' && <><TabTooltip tab='Strategy Backtest' /><StrategyBacktestTab /></>}\r\n            {tab==='COT Alerts' && <><TabTooltip tab='COT Alerts' /><COTAlertsTab /></>}\r\n            {tab==='Screener' && <><TabTooltip tab='Screener' /><ScreenerBuilder user={userInfo} /></>}\r\n            {tab==='Import' && <><TabTooltip tab='Import' /><ImportTab /></>}\r\n          </div>\r\n        )`

const NEW = `section==='tools2' ? (\r\n          <ToolsLayout tab={tab} setTab={setTab} userInfo={userInfo} />\r\n        )`

if (cs.includes(OLD)) {
  cs = cs.replace(OLD, NEW)
  console.log('✓ Tools section replaced with ToolsLayout')
} else {
  // Try already-patched version
  if (cs.includes("<ToolsLayout tab={tab}")) {
    console.log('✓ Already using ToolsLayout')
  } else {
    console.log('⚠ Exact match failed, checking context...')
    const i = cs.indexOf("section==='tools2'")
    console.log(JSON.stringify(cs.slice(i, i+200)))
  }
}

fs.writeFileSync('components/CommodityScreener.js', cs, 'utf8')
console.log('✓ CommodityScreener saved')
console.log('\nRun: rd /s /q .next & npm run dev')
