const fs = require('fs')
let s = fs.readFileSync('app/globals.css', 'utf8')

// Add Google Fonts import at the top if not already there
if (!s.includes('Space+Grotesk')) {
  s = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Fira+Code:wght@400;500;600&display=swap');\n` + s
  console.log('✓ Google Fonts import added')
}

// Update tk-name font
s = s.replace(
  `.tk-name {\n  font-family: 'DM Sans', sans-serif;\n  font-size: 12px;\n  font-weight: 600;\n  color: #111827;\n  letter-spacing: -0.1px;\n}`,
  `.tk-name {\n  font-family: 'Space Grotesk', sans-serif;\n  font-size: 12px;\n  font-weight: 500;\n  color: var(--text-muted, #6b7280);\n  letter-spacing: 0;\n}`
)

// Update tk-price font
s = s.replace(
  `.tk-price {\n  font-family: 'IBM Plex Mono', monospace;\n  font-size: 12px;\n  font-weight: 500;\n  color: #374151;\n}`,
  `.tk-price {\n  font-family: 'Fira Code', monospace;\n  font-size: 12px;\n  font-weight: 500;\n  color: #111827;\n}`
)

// Update tk-change font
s = s.replace(
  `.tk-change {\n  font-family: 'IBM Plex Mono', monospace;\n  font-size: 11px;\n  font-weight: 600;\n}`,
  `.tk-change {\n  font-family: 'Fira Code', monospace;\n  font-size: 11px;\n  font-weight: 500;\n}`
)

fs.writeFileSync('app/globals.css', s, 'utf8')
console.log('✓ Ticker fonts updated to Space Grotesk + Fira Code')
console.log('\nRun: rd /s /q .next & npm run dev')
