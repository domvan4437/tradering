const fs = require('fs')
const path = require('path')

const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const SCREENER = path.join(BASE, 'CommodityScreener.js')
const OVERVIEW  = path.join(BASE, 'MarketOverview.js')

// ── 1. Patch CommodityScreener.js ───────────────────────────────────────────
// Find the MarketsLayout onSelect call and extend it to handle ('charts', sym)

let screener = fs.readFileSync(SCREENER, 'utf8')

// Patch: MarketOverview onSelect inside MarketsLayout showLanding block
// Original: onSelect={(key) => { const t = key.charAt(0).toUpperCase() + key.slice(1); setTab(t); setSubTab(key === 'commodities' ? 'Screener' : 'Overview'); }}
// We need to also handle key === 'charts' with a sym argument
const OLD_ONSELECT_LANDING = `onSelect={(key) => { const t = key.charAt(0).toUpperCase() + key.slice(1); setTab(t); setSubTab(key === 'commodities' ? 'Screener' : 'Overview'); }}`
const NEW_ONSELECT_LANDING = `onSelect={(key, sym) => {
        if (key === 'charts') { setSection('charts'); setTab(''); return; }
        const t = key.charAt(0).toUpperCase() + key.slice(1);
        setTab(t);
        setSubTab(key === 'commodities' ? 'Screener' : 'Overview');
      }}`

if (screener.includes(OLD_ONSELECT_LANDING)) {
  screener = screener.split(OLD_ONSELECT_LANDING).join(NEW_ONSELECT_LANDING)
  console.log('✓ Patched MarketsLayout showLanding onSelect')
} else {
  console.warn('⚠ Could not find showLanding onSelect — may already be patched or whitespace differs')
}

// Patch the second MarketOverview onSelect (inside commodities Overview subTab)
const OLD_ONSELECT_OVERVIEW = `onSelect={(key) => { setSubTab(key === 'commodities' ? 'Screener' : key.charAt(0).toUpperCase() + key.slice(1)); }}`
const NEW_ONSELECT_OVERVIEW = `onSelect={(key, sym) => {
              if (key === 'charts') { setSection('charts'); setTab(''); return; }
              setSubTab(key === 'commodities' ? 'Screener' : key.charAt(0).toUpperCase() + key.slice(1));
            }}`

if (screener.includes(OLD_ONSELECT_OVERVIEW)) {
  screener = screener.split(OLD_ONSELECT_OVERVIEW).join(NEW_ONSELECT_OVERVIEW)
  console.log('✓ Patched commodities Overview subTab onSelect')
} else {
  console.warn('⚠ Could not find Overview subTab onSelect — may already be patched')
}

fs.writeFileSync(SCREENER, screener, 'utf8')
console.log('✓ CommodityScreener.js saved')

// ── 2. Patch MarketOverview.js ───────────────────────────────────────────────
// Wire handleOpenChart to call onSelect('charts', sym)
// Wire sector clicks to call onSelect(sectorKey)

let overview = fs.readFileSync(OVERVIEW, 'utf8')

// Fix handleOpenChart — already defined correctly in our file, but make sure it passes sym
const OLD_OPEN_CHART = `  function handleOpenChart(asset) {
    if (onSelect) onSelect('charts', asset.sym)
  }`

if (overview.includes(OLD_OPEN_CHART)) {
  console.log('✓ handleOpenChart already wired correctly')
} else {
  // Try to find and replace a bare version
  const OLD_BARE = `function handleOpenChart(asset) {`
  if (overview.includes(OLD_BARE)) {
    overview = overview.replace(
      /function handleOpenChart\(asset\) \{[\s\S]*?\}/,
      `function handleOpenChart(asset) {\n    if (onSelect) onSelect('charts', asset.sym)\n  }`
    )
    console.log('✓ Patched handleOpenChart')
  } else {
    console.warn('⚠ handleOpenChart not found — check MarketOverview.js manually')
  }
}

// Wire sector clicks — find the sec-item onClick and add onSelect call
// The sector labels map to section keys
const OLD_SEC_ITEM = `onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}`

const NEW_SEC_ITEM = `onClick={() => onSelect && onSelect(s.label.toLowerCase())}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}`

if (overview.includes(OLD_SEC_ITEM)) {
  // Only replace the first occurrence (inside LeftPanel sectors loop)
  overview = overview.replace(OLD_SEC_ITEM, NEW_SEC_ITEM)
  console.log('✓ Wired sector click onSelect')
} else {
  console.warn('⚠ Could not find sector item hover handlers — check LeftPanel in MarketOverview.js')
}

fs.writeFileSync(OVERVIEW, overview, 'utf8')
console.log('✓ MarketOverview.js saved')

console.log('\n✅ All patches applied. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
