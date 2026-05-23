const fs = require('fs')
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'))
p.scripts.build = 'prisma generate && next build'
fs.writeFileSync('package.json', JSON.stringify(p, null, 2))
console.log('✓ Build script updated to: prisma generate && next build')
