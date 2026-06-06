const fs = require('fs')
const path = require('path')

function walk(dir) {
  try {
    return fs.readdirSync(dir).flatMap(f => {
      const full = path.join(dir, f)
      return fs.statSync(full).isDirectory() &&
        !f.includes('node_modules') && !f.includes('.next') && !f.includes('.git')
        ? walk(full) : [full]
    })
  } catch { return [] }
}

const files = walk('.').filter(f =>
  (f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.ts') ||
   f.endsWith('.tsx') || f.endsWith('.css') || f.endsWith('.html')) &&
  !f.includes('node_modules') && !f.includes('.next')
)

let changed = 0
files.forEach(f => {
  try {
    let s = fs.readFileSync(f, 'utf8')
    if (!s.includes('TradeZar') && !s.includes('tradezar') && !s.includes('TRADEZAR')) return
    
    const orig = s
    s = s.replaceAll('TradeZar', 'TradeZar')
    s = s.replaceAll('tradezar', 'tradezar')
    s = s.replaceAll('TRADEZAR', 'TRADEZAR')
    s = s.replaceAll('Tradezar', 'Tradezar')
    
    if (s !== orig) {
      fs.writeFileSync(f, s, 'utf8')
      console.log('✓', f)
      changed++
    }
  } catch(e) { console.log('⚠ skip:', f, e.message) }
})

// Also update package.json name
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  if (pkg.name && pkg.name.includes('tradezar')) {
    pkg.name = pkg.name.replace('tradezar', 'tradezar')
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))
    console.log('✓ package.json name updated')
  }
} catch(e) {}

console.log(`\n✓ Updated ${changed} files`)
console.log('Note: Also update your Vercel project name and domain separately')
console.log('\nRun: rd /s /q .next & npm run dev')
