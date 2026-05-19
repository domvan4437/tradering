const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Fix the extra </div> in BattleBar (line 31)
// Current:
//       </div>   <- closes justifyContent flex row (line 27)
//       </div>   <- EXTRA - should not be here
//     </div>     <- closes outer div (line 22)
// 
const OLD_BATTLE = `      </div>\r\n      </div>\r\n    </div>\r\n  );\r\n}\r\n\r\n// Tab accent colors`
const NEW_BATTLE = `      </div>\r\n    </div>\r\n  );\r\n}\r\n\r\n// Tab accent colors`

if (s.includes(OLD_BATTLE)) {
  s = s.replace(OLD_BATTLE, NEW_BATTLE)
  console.log('✓ Extra </div> removed from BattleBar (CRLF)')
} else {
  const OLD_LF = `      </div>\n      </div>\n    </div>\n  );\n}\n\n// Tab accent colors`
  const NEW_LF = `      </div>\n    </div>\n  );\n}\n\n// Tab accent colors`
  if (s.includes(OLD_LF)) {
    s = s.replace(OLD_LF, NEW_LF)
    console.log('✓ Extra </div> removed from BattleBar (LF)')
  } else {
    console.log('⚠ BattleBar pattern not matched, checking manually...')
    const i = s.indexOf('// Tab accent colors')
    console.log('Before accent colors:', JSON.stringify(s.slice(i-150, i)))
  }
}

fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
