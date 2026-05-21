const fs = require('fs')
let s = fs.readFileSync('components/FeedTab.js', 'utf8')
const lines = s.split('\n')

// Line 458 (index 457): "      </div>\r"  <- this closes the outer div too early
// Line 459-461: blank lines
// Line 462: floating button starts
// Line 467: "      </div>\r"  <- closes floating button wrapper
// Line 468: "  );\r"
// Line 469: "}"

// We need to move line 458's </div> to AFTER the floating button
// i.e. swap so the outer div closes after the button

// Remove the </div> at line 458 and add it after line 467
lines[457] = '' // remove early outer </div>

// After line 467 (</div> of floating btn wrapper), add the outer </div>
// Line 467 is index 466
lines[466] = lines[466] + '\r\n    </div>'

s = lines.join('\n')
fs.writeFileSync('components/FeedTab.js', s, 'utf8')
console.log('✓ Floating button moved inside outer div')
console.log('\nRun: rd /s /q .next & npm run dev')
