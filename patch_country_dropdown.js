const fs = require('fs')
let s = fs.readFileSync('components/AccountTab.js', 'utf8')

s = s.replace(
  `<label style={labelStyle}>Country</label>\n            <input style={inpStyle} value={form.country} onChange={e=>set('country',e.target.value)} disabled={!editing} placeholder=\"United States\" />`,
  `<label style={labelStyle}>Country</label>
            <select style={inpStyle} value={form.country} onChange={e=>set('country',e.target.value)} disabled={!editing}>
              <option value="">Select country</option>
              {[['🇺🇸','United States'],['🇬🇧','United Kingdom'],['🇨🇦','Canada'],['🇦🇺','Australia'],['🇩🇪','Germany'],['🇫🇷','France'],['🇯🇵','Japan'],['🇸🇬','Singapore'],['🇳🇱','Netherlands'],['🇨🇭','Switzerland'],['🇸🇪','Sweden'],['🇳🇿','New Zealand'],['🇿🇦','South Africa'],['🇧🇷','Brazil'],['🇲🇽','Mexico'],['🇮🇳','India'],['🇵🇭','Philippines'],['🇳🇬','Nigeria'],['🇰🇪','Kenya'],['🇦🇪','UAE'],['🇸🇦','Saudi Arabia'],['🇮🇱','Israel'],['🇰🇷','South Korea'],['🇨🇳','China'],['🇭🇰','Hong Kong'],['🇮🇩','Indonesia'],['🇹🇭','Thailand'],['🇲🇾','Malaysia'],['🇵🇱','Poland'],['🇮🇹','Italy'],['🇪🇸','Spain'],['🇵🇹','Portugal'],['🇦🇹','Austria'],['🇧🇪','Belgium'],['🇩🇰','Denmark'],['🇫🇮','Finland'],['🇳🇴','Norway'],['🇨🇿','Czech Republic'],['🇷🇴','Romania'],['🇭🇺','Hungary'],['🇦🇷','Argentina'],['🇨🇱','Chile'],['🇨🇴','Colombia'],['🇹🇷','Turkey'],['🇷🇺','Russia'],['🇺🇦','Ukraine'],['🇬🇷','Greece'],['🇵🇰','Pakistan'],['🇧🇩','Bangladesh'],['🇪🇬','Egypt']].map(([flag,name])=>(
                <option key={name} value={name}>{flag} {name}</option>
              ))}
            </select>`
)

console.log('✓ Country changed to dropdown')
fs.writeFileSync('components/AccountTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
