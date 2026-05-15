const fs = require('fs')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const PATH = BASE + '\\StocksSection.js'
let s = fs.readFileSync(PATH, 'utf8')

// Fix 1: close React.Fragment properly and remove the stray )
s = s.replace(
  `                      )}\n                    )\n                  })}\n                </>`,
  `                      )}\n                    </React.Fragment>\n                  })}\n                </>`
)

if (s.includes('</React.Fragment>')) {
  console.log('✓ Fragment closed correctly')
} else {
  console.warn('⚠ Fragment fix not matched')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
