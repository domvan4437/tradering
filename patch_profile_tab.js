const fs = require('fs')
let s = fs.readFileSync('components/AccountTab.js', 'utf8')

// Read the new profile tab code
const newCode = fs.readFileSync('/home/claude/ProfileTab.js', 'utf8') + '\n'

// Find and replace the old OverviewTab function
const start = s.indexOf('function OverviewTab')
const end = s.indexOf('\nfunction AnalyticsCommunityTab')

if (start === -1 || end === -1) {
  console.log('⚠ Could not find OverviewTab boundaries')
  console.log('start:', start, 'end:', end)
  process.exit(1)
}

s = s.slice(0, start) + newCode + s.slice(end + 1)
console.log('✓ OverviewTab replaced with ProfileTab')

// Also rename the sidebar label from Overview to Profile
s = s.replace(
  `{ key: 'overview',     label: 'Overview',              icon: 'ti-layout-dashboard' }`,
  `{ key: 'overview',     label: 'Profile',               icon: 'ti-user' }`
)
console.log('✓ Sidebar label changed to Profile')

fs.writeFileSync('components/AccountTab.js', s, 'utf8')
console.log('✓ AccountTab.js saved')
console.log('\nRun: rd /s /q .next & npm run dev')
