const fs = require('fs')
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')
const lines = c.split('\n')

// Line 564 (index 563): "      </div>  <- closes the tab content div (line 543)
// Line 565 (index 564): "    </div>    <- should close outer flex row div
// Line 566 (index 565): "  );"
// Line 567 (index 566): "}"
//
// But we have an unclosed inner wrapper div from line 528:
// <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
// This needs to be closed before the outer </div>

// Replace line 564 (the </div> before </div>);}) with two closing divs
// Current:
//   </div>   <- closes tab content flex div (line 543)
//   </div>   <- closes outer row div
//   );
// Needed:
//   </div>   <- closes tab content flex div
//   </div>   <- closes inner wrapper div (flex:1 column)
//   </div>   <- closes outer row div
//   );

// Find the exact closing sequence
const OLD_CLOSE = "      </div>\r\n    </div>\r\n  );\r\n}\r\n\r\nfunction RightSidebar"
const NEW_CLOSE = "      </div>\r\n      </div>\r\n    </div>\r\n  );\r\n}\r\n\r\nfunction RightSidebar"

if (c.includes(OLD_CLOSE)) {
  c = c.replace(OLD_CLOSE, NEW_CLOSE)
  console.log('✓ Inner wrapper div closing added (CRLF)')
} else {
  const OLD_CLOSE_LF = "      </div>\n    </div>\n  );\n}\n\nfunction RightSidebar"
  const NEW_CLOSE_LF = "      </div>\n      </div>\n    </div>\n  );\n}\n\nfunction RightSidebar"
  if (c.includes(OLD_CLOSE_LF)) {
    c = c.replace(OLD_CLOSE_LF, NEW_CLOSE_LF)
    console.log('✓ Inner wrapper div closing added (LF)')
  } else {
    // Try mixed
    const idx = c.indexOf('function RightSidebar')
    const before = c.slice(idx - 200, idx)
    console.log('Context before RightSidebar:', JSON.stringify(before))
  }
}

fs.writeFileSync('components/CommunityLayout.js', c, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
