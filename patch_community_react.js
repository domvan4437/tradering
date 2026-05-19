const fs = require('fs')
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// Add React import at the top
c = c.replace(
  "'use client'\r\nimport { useState",
  "'use client'\r\nimport React, { useState"
)
// Also try LF version
c = c.replace(
  "'use client'\nimport { useState",
  "'use client'\nimport React, { useState"
)

// Also replace React.useState/useRef in CommSidebar with named imports
// since CommunityLayout already uses useState/useEffect from destructured import
c = c.replace(
  'const [open, setOpen] = React.useState(false)',
  'const [open, setOpen] = useState(false)'
)
c = c.replace(
  'const [pinned, setPinned] = React.useState(false)',
  'const [pinned, setPinned] = useState(false)'
)
c = c.replace(
  'const timer = React.useRef(null)',
  'const timer = useRef(null)'
)

// Make sure useRef is in the import
if (!c.includes('useRef')) {
  c = c.replace(
    "import React, { useState, useEffect, useRef }",
    "import React, { useState, useEffect, useRef }"
  )
  // Add useRef if missing
  c = c.replace(
    /import React, \{ useState, useEffect \}/,
    "import React, { useState, useEffect, useRef }"
  )
  c = c.replace(
    /import React, \{ useState \}/,
    "import React, { useState, useEffect, useRef }"
  )
}

if (c.includes('import React')) {
  console.log('✓ React imported')
} else {
  console.log('⚠ React import not added')
}

fs.writeFileSync('components/CommunityLayout.js', c, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
