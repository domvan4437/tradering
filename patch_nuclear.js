const fs = require('fs')
let lines = fs.readFileSync('components/CompeteTab.js', 'utf8').split('\n')

// Find and clear the traders array (lines 639-656 area)
// Find start of traders = [
const tradersStart = lines.findIndex(l => l.includes("const traders = [") || (l.includes("{ name: 'goldtrader'") ))
const tradersArrStart = lines.findIndex(l => l.trim().startsWith("const traders = ["))
console.log('traders array at:', tradersArrStart + 1)

// Find upcoming contests array
const contestsStart = lines.findIndex(l => l.includes("{ name: 'Forex Weekly Challenge'"))
console.log('contests at:', contestsStart + 1)

// Find bracket left array with graintrader99
const bracketLine = lines.findIndex(l => l.includes("graintrader99"))
console.log('bracket at:', bracketLine + 1)

// Clear traders array - find it and empty it
if (tradersArrStart > -1) {
  let depth = 0, end = tradersArrStart
  for (let i = tradersArrStart; i < lines.length; i++) {
    for (const c of lines[i]) { if(c==='[')depth++; if(c===']')depth--; }
    if (depth === 0 && i > tradersArrStart) { end = i; break }
  }
  lines.splice(tradersArrStart, end - tradersArrStart + 1, "  const traders = [];")
  console.log('✓ traders array cleared')
}

// Re-find contest line after splice
const contestsStart2 = lines.findIndex(l => l.includes("'Forex Weekly Challenge'") || l.includes("'Gold Sprint") || l.includes("'COT Monthly"))
if (contestsStart2 > -1) {
  // Find the array start
  let arrStart = contestsStart2
  while (arrStart > 0 && !lines[arrStart].includes('= [')) arrStart--
  let depth = 0, end = arrStart
  for (let i = arrStart; i < lines.length; i++) {
    for (const c of lines[i]) { if(c==='[')depth++; if(c===']')depth--; }
    if (depth === 0 && i > arrStart) { end = i; break }
  }
  lines.splice(arrStart, end - arrStart + 1, "  const upcoming = [];")
  console.log('✓ upcoming contests cleared')
}

// Re-find and clear bracket graintrader99 line
const bracketLine2 = lines.findIndex(l => l.includes("graintrader99"))
if (bracketLine2 > -1) {
  // Find containing array
  let arrStart = bracketLine2
  while (arrStart > 0 && !lines[arrStart].trim().startsWith('const ')) arrStart--
  let depth = 0, end = arrStart
  for (let i = arrStart; i < lines.length; i++) {
    for (const c of lines[i]) { if(c==='[')depth++; if(c===']')depth--; }
    if (depth === 0 && i > arrStart) { end = i; break }
  }
  const varName = lines[arrStart].match(/const (\w+)/)?.[1] || 'arr'
  lines.splice(arrStart, end - arrStart + 1, `  const ${varName} = [];`)
  console.log('✓ bracket array cleared')
}

// Also clear the top stats (rank #7, win rate 68%, $840 winnings, 2 matches)
// These are hardcoded in CompeteHome
const statLines = lines.map((l,i)=>({l,i})).filter(({l})=>l.includes("'#7'") || l.includes("68%") || l.includes("$840") || l.includes("trader99"))
statLines.forEach(({l,i})=>console.log('stat line',i+1,l.trim().slice(0,60)))

// Clear H2H preview showing trader99
const h2hLine = lines.findIndex(l => l.includes('trader99'))
if (h2hLine > -1) {
  // Find array containing it
  let arrStart = h2hLine
  while (arrStart > 0 && !lines[arrStart].trim().startsWith('const ')) arrStart--
  let depth = 0, end = arrStart
  for (let i = arrStart; i < lines.length; i++) {
    for (const c of lines[i]) { if(c==='[')depth++; if(c===']')depth--; }
    if (depth === 0 && i > arrStart) { end = i; break }
  }
  const varName = lines[arrStart].match(/const (\w+)/)?.[1] || 'arr'
  lines.splice(arrStart, end - arrStart + 1, `  const ${varName} = null;`)
  console.log('✓ H2H preview cleared')
}

const result = lines.join('\n')

// Final check
const remaining = ['goldtrader','cotmaster','swingking','grainbull','trader99','Forex Weekly','Gold Sprint','COT Monthly','graintrader99']
remaining.forEach(m => { const i = result.indexOf(m); if(i>-1) console.log('STILL FOUND:', m, 'line', result.slice(0,i).split('\n').length) })

fs.writeFileSync('components/CompeteTab.js', result, 'utf8')
console.log('✓ Saved. Lines:', lines.length)
console.log('\nRun: rd /s /q .next & npm run dev')
