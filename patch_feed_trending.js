const fs = require('fs')
let s = fs.readFileSync('components/FeedTab.js', 'utf8')

// Find and empty the TRENDING array
const tStart = s.indexOf('TRENDING = [')
let depth = 0, tEnd = tStart
for (let i = tStart; i < s.length; i++) {
  if (s[i] === '[') depth++
  if (s[i] === ']') { depth--; if (depth === 0) { tEnd = i; break } }
}
s = s.slice(0, tStart) + 'TRENDING = []' + s.slice(tEnd + 1)
console.log('✓ TRENDING mock data cleared')

// Also clear WHO_TO_FOLLOW if it has mock data
const whoIdx = s.indexOf('WHO_TO_FOLLOW = [')
if (whoIdx > -1) {
  let d2 = 0, whoEnd = whoIdx
  for (let i = whoIdx; i < s.length; i++) {
    if (s[i] === '[') d2++
    if (s[i] === ']') { d2--; if (d2 === 0) { whoEnd = i; break } }
  }
  const whoContent = s.slice(whoIdx, whoEnd + 1)
  if (whoContent.includes("name:") || whoContent.includes("user:")) {
    s = s.slice(0, whoIdx) + 'WHO_TO_FOLLOW = []' + s.slice(whoEnd + 1)
    console.log('✓ WHO_TO_FOLLOW mock data cleared')
  }
}

fs.writeFileSync('components/FeedTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
