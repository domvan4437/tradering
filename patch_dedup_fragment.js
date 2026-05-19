const fs = require('fs')
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// Remove the duplicate </React.Fragment>
c = c.replace(
  '          </React.Fragment>\n          </React.Fragment>',
  '          </React.Fragment>'
)
c = c.replace(
  '          </React.Fragment>\r\n          </React.Fragment>',
  '          </React.Fragment>'
)

const count = (c.match(/<\/React\.Fragment>/g) || []).length
console.log('</React.Fragment> count:', count, '(should be 1)')

fs.writeFileSync('components/CommunityLayout.js', c, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
