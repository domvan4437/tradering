const fs = require('fs')
const PATH = 'app/layout.js'
let s = fs.readFileSync(PATH, 'utf8')

s = s.replace(
  `<head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>`,
  `<head><meta name="viewport" content="width=device-width, initial-scale=1" /><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" /></head>`
)

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Tabler icons added to layout')
console.log('\nRun: rd /s /q .next & npm run dev')
