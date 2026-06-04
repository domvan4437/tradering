const fs = require('fs')
let s = fs.readFileSync('components/LocalTradersTab.js', 'utf8')

// Add flag field to each mock trader
s = s.replace(`n:'goldtrader', full:'Marcus T.', city:'St. Louis, MO'`, `n:'goldtrader', full:'Marcus T.', flag:'🇺🇸', city:'St. Louis, MO'`)
s = s.replace(`n:'cotmaster', full:'James R.', city:'Chesterfield, MO'`, `n:'cotmaster', full:'James R.', flag:'🇺🇸', city:'Chesterfield, MO'`)
s = s.replace(`n:'fxswing99', full:'Sarah K.', city:'Clayton, MO'`, `n:'fxswing99', full:'Sarah K.', flag:'🇬🇧', city:'Clayton, MO'`)
s = s.replace(`n:'esscalper', full:'Derek M.', city:'Belleville, IL'`, `n:'esscalper', full:'Derek M.', flag:'🇺🇸', city:'Belleville, IL'`)
s = s.replace(`n:'graintrader', full:'Tom W.'`, `n:'graintrader', full:'Tom W.', flag:'🇨🇦'`)
console.log('✓ Flags added to mock data')

// Show flag in TraderCard next to name
s = s.replace(
  `<span style={{ fontSize:16, fontWeight:600, color:'var(--text,#111)' }}>{trader.full}</span>`,
  `<span style={{ fontSize:16, fontWeight:600, color:'var(--text,#111)' }}>{trader.full}</span>{trader.flag && <span style={{ fontSize:16 }}>{trader.flag}</span>}`
)
console.log('✓ Flag added to TraderCard')

// Show flag in list rows next to name
s = s.replace(
  `<span style={{ fontSize:13, fontWeight:500, color:'var(--text,#111)' }}>{t.full}</span>`,
  `<span style={{ fontSize:13, fontWeight:500, color:'var(--text,#111)' }}>{t.full}</span>{t.flag && <span style={{ fontSize:14 }}>{t.flag}</span>}`
)
console.log('✓ Flag added to list rows')

// Show flag in map pin tooltip - add flag to the bottom info bar
s = s.replace(
  `{filtered.length} trader{filtered.length!==1?'s':''} nearby · St. Louis area`,
  `{filtered.length} trader{filtered.length!==1?'s':''} nearby · St. Louis area`
)

fs.writeFileSync('components/LocalTradersTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
