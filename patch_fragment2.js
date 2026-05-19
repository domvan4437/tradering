const fs = require('fs')
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')
const lines = c.split('\n')

// Line 507 (index 506): "        return ("
// Line 508 (index 507): "          <button key={t.key} ..."
// Need to change to:
//   return (
//     <React.Fragment key={t.key}>
//     <button ...  (no key on button)

// Line 508 fix - add Fragment, remove key from button
lines[507] = '          <React.Fragment key={t.key}>'
lines[508] = '          <button onClick={(e)=>{e.stopPropagation();setTab(t.key);}}'

// Now find the closing ) of the map return and add </React.Fragment>
// Line 514 is {/* Feed subtabs inline */} - the comment
// Find the closing }) of the map
let closeIdx = -1
for (let i = 520; i < lines.length; i++) {
  if (lines[i].includes('        )') && lines[i+1] && lines[i+1].includes('      })}')) {
    closeIdx = i
    break
  }
}

if (closeIdx > -1) {
  lines[closeIdx] = '          </React.Fragment>\n        )'
  console.log('✓ Fragment closing added at line', closeIdx + 1)
} else {
  // Try another approach - find the line before })}
  for (let i = 520; i < lines.length; i++) {
    if (lines[i].trim() === '})}'  || lines[i].includes('      })}')) {
      lines[i-1] = '          </React.Fragment>\n' + lines[i-1]
      closeIdx = i
      console.log('✓ Fragment closing added before })}, line', i)
      break
    }
  }
  if (closeIdx === -1) console.log('⚠ Could not find closing, checking...')
}

c = lines.join('\n')
fs.writeFileSync('components/CommunityLayout.js', c, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
