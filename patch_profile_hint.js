const fs = require('fs')
let s = fs.readFileSync('components/AccountTab.js', 'utf8')

// Add subtle hint below the avatar/header card when not editing
s = s.replace(
  `{/* Identity */}`,
  `{!editing && <div style={{ fontSize:11, color:'var(--text-muted,#9ca3af)', textAlign:'center', marginTop:-8, marginBottom:6 }}>Click <strong style={{color:'#4B44C8'}}>Edit profile</strong> to make changes</div>}
      {/* Identity */}`
)

console.log('✓ Hint text added')
fs.writeFileSync('components/AccountTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
