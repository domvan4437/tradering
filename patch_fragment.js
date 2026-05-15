const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const PATH = path.join(BASE, 'StocksSection.js')
let s = fs.readFileSync(PATH, 'utf8')

// The problem: inside the stocks.map(), we have two <tr> elements side by side
// which needs a React fragment wrapper <>...</>
// Find the stock row tr opening and wrap both trs in a fragment

s = s.replace(
  `                    <tr\n                        key={stock.symbol}\n                        style={{ cursor: 'pointer' }}\n                        onClick`,
  `                    <React.Fragment key={stock.symbol}>\n                    <tr\n                        style={{ cursor: 'pointer' }}\n                        onClick`
)

// Find the closing of the expandable drawer tr and add fragment close
s = s.replace(
  `                      )}\n                      </tr>\n                      )}\n`,
  `                      )}\n                      </tr>\n                      )}\n                    </React.Fragment>\n`
)

// Also need to add React import if not present
if (!s.includes("import React")) {
  s = s.replace("'use client'\nimport {", "'use client'\nimport React, {")
  console.log('✓ Added React import')
} else {
  console.log('✓ React already imported')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Fragment wrapper added around stock rows')
console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
