const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const PATH = path.join(BASE, 'StocksSection.js')
let s = fs.readFileSync(PATH, 'utf8')

// 1. Fix two-column grid: 60/40 split with independent scroll
s = s.replace(
  `{/* Two-column layout */}\n      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 12 }}>`,
  `{/* Two-column layout */}\n      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 12, height: 'calc(100vh - 180px)', overflow: 'hidden' }}>`
)
console.log('✓ Grid set to 60/40 with fixed height')

// 2. Make left column independently scrollable
s = s.replace(
  `{/* LEFT: Sector-grouped table */}\n        <div>`,
  `{/* LEFT: Sector-grouped table */}\n        <div style={{ overflowY: 'auto', height: '100%' }}>`
)
console.log('✓ Left column independently scrollable')

// 3. Make right earnings panel independently scrollable
s = s.replace(
  `{/* RIGHT: Earnings panel */}\n        <EarningsPanel watchlist={watchlist} onAddWatchlist={sym => setWatchlist(w => [...new Set([...w, sym])])} />`,
  `{/* RIGHT: Earnings panel */}\n        <div style={{ overflowY: 'auto', height: '100%' }}>\n          <EarningsPanel watchlist={watchlist} onAddWatchlist={sym => setWatchlist(w => [...new Set([...w, sym])])} />\n        </div>`
)
console.log('✓ Right column independently scrollable')

// 4. Tighten number columns — price, % chg, cap, watchlist btn
s = s.replace(
  `<th style={{ width: 48, ...thStyle }}>Sym</th>\n                <th style={thStyle}>Company</th>\n                <th style={{ width: 68, ...thStyle }}>Price</th>\n                <th style={{ width: 58, ...thStyle }}>% Chg</th>\n                <th style={{ width: 52, ...thStyle }}>Cap</th>\n                <th style={{ width: 34, ...thStyle }}></th>`,
  `<th style={{ width: 46, ...thStyle }}>Sym</th>\n                <th style={thStyle}>Company</th>\n                <th style={{ width: 72, ...thStyle, textAlign: 'right' }}>Price</th>\n                <th style={{ width: 58, ...thStyle, textAlign: 'right' }}>% Chg</th>\n                <th style={{ width: 48, ...thStyle, textAlign: 'right' }}>Cap</th>\n                <th style={{ width: 28, ...thStyle }}></th>`
)
console.log('✓ Column widths tightened')

// 5. Right-align number cells
s = s.replace(
  `<td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 11 }}>\n                          {stockLoading ? '—' : d?.price ? \`$\${d.price.toFixed(2)}\` : '—'}\n                        </td>`,
  `<td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>\n                          {stockLoading ? '—' : d?.price ? \`$\${d.price.toFixed(2)}\` : '—'}\n                        </td>`
)
s = s.replace(
  `<td style={{ ...tdStyle, fontSize: 11, fontWeight: 500, color: isPos ? 'var(--green)' : 'var(--red)' }}>\n                          {d ? \`\${isPos ? '+' : ''}\${d.changePct?.toFixed(2)}%\` : '—'}\n                        </td>`,
  `<td style={{ ...tdStyle, fontSize: 11, fontWeight: 500, color: isPos ? 'var(--green)' : 'var(--red)', textAlign: 'right' }}>\n                          {d ? \`\${isPos ? '+' : ''}\${d.changePct?.toFixed(2)}%\` : '—'}\n                        </td>`
)
s = s.replace(
  `<td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-muted)' }}>{stock.cap}</td>`,
  `<td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{stock.cap}</td>`
)
console.log('✓ Number cells right-aligned')

// 6. Remove subtabs bar from StocksOverviewTab — it's rendered by MarketsLayout, not here
// The subtabs are in CommodityScreener MarketsLayout, not StocksSection — nothing to remove here
// But we need to remove the padding wrapper that creates the white bar gap
s = s.replace(
  `<div style={{ padding: '0 0 40px', fontFamily: 'var(--font)' }}>`,
  `<div style={{ fontFamily: 'var(--font)' }}>`
)
console.log('✓ Removed top padding')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ StocksSection.js saved\n')

// 7. Remove the subtab nav bar from MarketsLayout in CommodityScreener
const SCREENER_PATH = path.join(BASE, 'CommodityScreener.js')
let cs = fs.readFileSync(SCREENER_PATH, 'utf8')

// Hide the subtabs bar specifically for stocks section
const OLD_SUBTABS = `      {subTabs.length > 0 && (
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 24px', background:'var(--surface)', position:'sticky', top:46, zIndex:50, overflowX:'auto' }}>
          {subTabs.map(t => (`
const NEW_SUBTABS = `      {subTabs.length > 0 && section !== 'stocks' && (
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 24px', background:'var(--surface)', position:'sticky', top:46, zIndex:50, overflowX:'auto' }}>
          {subTabs.map(t => (`

if (cs.includes(OLD_SUBTABS)) {
  cs = cs.replace(OLD_SUBTABS, NEW_SUBTABS)
  fs.writeFileSync(SCREENER_PATH, cs, 'utf8')
  console.log('✓ Stocks subtab bar hidden in CommodityScreener.js')
} else {
  console.warn('⚠ Could not find subtabs bar in CommodityScreener — may need manual check')
}

console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
