const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// Replace the entire account block with AccountTab
s = s.replace(
  `{tab==='Broker' && <><TabTooltip tab='Broker' /><BrokerTab /></>}\r\n            {tab==='My Profile' && <><TabTooltip tab='My Profile' /><ProfileTab user={userInfo} session={session} /></>}\r\n            \r\n            {tab==='Settings' && <><TabTooltip tab='Settings' /><SettingsTab user={userInfo} /></>}`,
  `<div style={{ marginTop: 82 }}><AccountTab user={userInfo} /></div>`
)

if (s.includes('<AccountTab user={userInfo}')) {
  console.log('✓ AccountTab wired into account section')
} else {
  // try LF version
  s = s.replace(
    `{tab==='Broker' && <><TabTooltip tab='Broker' /><BrokerTab /></>}\n            {tab==='My Profile' && <><TabTooltip tab='My Profile' /><ProfileTab user={userInfo} session={session} /></>}\n            \n            {tab==='Settings' && <><TabTooltip tab='Settings' /><SettingsTab user={userInfo} /></>}`,
    `<div style={{ marginTop: 82 }}><AccountTab user={userInfo} /></div>`
  )
  if (s.includes('<AccountTab user={userInfo}')) {
    console.log('✓ AccountTab wired (LF version)')
  } else {
    // regex fallback
    s = s.replace(
      /\{tab==='Broker'[\s\S]*?\{tab==='Settings'.*?<\/>\}/,
      `<div style={{ marginTop: 82 }}><AccountTab user={userInfo} /></div>`
    )
    console.log('✓ AccountTab wired (regex version)')
  }
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
