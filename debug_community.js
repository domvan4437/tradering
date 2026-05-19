const fs = require('fs')
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')
const lines = c.split('\n')

// The main component closing is at line 567 (index 566)
// Line 564: "      </div>  <- closes inner content div (added by previous patch)
// Line 565: "    </div>   <- closes outer flex row div  
// Line 566: "  );"
// Line 567: "}"

// We need to:
// 1. Remove the bad closing we added (lines 564-567 were modified by previous patch)
// 2. Replace with correct closing

// Find the exact closing sequence of the main export function
// It should be:
//   </div>   <- close inner content wrapper
//   </div>   <- close outer flex row
//   );
// }

// Current lines 564-567:
console.log('Current lines 563-568:')
lines.slice(562,568).forEach((l,i) => console.log(563+i, JSON.stringify(l)))

// The problem: previous patch added an extra </div> closing a non-existent inner wrapper
// Let's check what's actually there now
const mainClose = c.indexOf('  );\r\n}\r\n\r\nfunction RightSidebar')
if (mainClose === -1) {
  const mainClose2 = c.indexOf('  );\n}\n\nfunction RightSidebar')
  console.log('mainClose2:', mainClose2)
} else {
  console.log('mainClose at:', mainClose)
}

// Check if CommSidebar and inner div wrapper are in place
const hasSidebar = c.includes('<CommSidebar')
const hasInnerDiv = c.includes('<div style={{ flex:1, display:\'flex\', flexDirection:\'column\', overflow:\'hidden\' }}>')
console.log('Has CommSidebar:', hasSidebar)
console.log('Has inner wrapper div:', hasInnerDiv)

// Show what's around line 540-567
console.log('\nLines 538-568:')
lines.slice(537,568).forEach((l,i) => console.log(538+i, JSON.stringify(l)))
