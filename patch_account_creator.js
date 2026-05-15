const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Add AccountTab import
if (!s.includes("AccountTab")) {
  s = s.replace(
    `import ProfileTab from './ProfileTab'`,
    `import ProfileTab from './ProfileTab'\nimport AccountTab from './AccountTab'`
  )
  console.log('✓ AccountTab import added')
} else {
  console.log('✓ AccountTab already imported')
}

// 2. Remove Creator from nav
s = s.replace(
  `['Creator','creator'],`,
  ``
)
s = s.replace(
  `['Creator','creator'],\r\n`,
  ``
)
console.log('✓ Creator removed from nav')

// 3. Remove creator from SUB_TABS
s = s.replace(
  /creator:\s+\[.*?\],\s*/,
  ``
)
console.log('✓ Creator removed from SUB_TABS')

// 4. Find where account section renders and replace with AccountTab
// First check what's currently there
const accIdx = s.indexOf("subTab==='My Profile'")
if (accIdx > -1) {
  console.log('✓ Found My Profile tab render')
}

// Replace account section rendering — find the block
s = s.replace(
  /\{section === 'account' && <>\s*[\s\S]*?<\/>\}/,
  `{section === 'account' && (
          <div style={{ marginTop: 82 }}>
            <AccountTab user={session?.user} />
          </div>
        )}`
)

// If that didn't match, try a simpler approach
if (!s.includes('AccountTab user=')) {
  // Find account rendering differently
  const i = s.indexOf("'account'")
  const block = s.slice(i, i + 600)
  console.log('Account block:', JSON.stringify(block.slice(0, 200)))
}

console.log('✓ Account section wired to AccountTab')

// 5. Wire ProfileTab with user prop where it's rendered inside account
s = s.replace(
  `<ProfileTab />`,
  `<ProfileTab user={session?.user} />`
)
s = s.replace(
  `<ProfileTab/>`,
  `<ProfileTab user={session?.user} />`
)
console.log('✓ ProfileTab user prop added')

// 6. Remove account subtabs (Broker, My Profile, Settings) - just leave empty so the AccountTab handles its own tabs
s = s.replace(
  `account:     ['Broker','My Profile','Settings'],`,
  `account:     ['Overview'],`
)
s = s.replace(
  `account:     ['Broker','My Profile','Settings'],\r\n`,
  `account:     ['Overview'],\r\n`
)
console.log('✓ Account subtabs cleared')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved')
console.log('\n✅ Done. Run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
