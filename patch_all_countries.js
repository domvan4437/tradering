const fs = require('fs')
let s = fs.readFileSync('components/AccountTab.js', 'utf8')

const countries = [
  ['🇦🇫','Afghanistan'],['🇦🇱','Albania'],['🇩🇿','Algeria'],['🇦🇩','Andorra'],['🇦🇴','Angola'],
  ['🇦🇬','Antigua and Barbuda'],['🇦🇷','Argentina'],['🇦🇲','Armenia'],['🇦🇺','Australia'],['🇦🇹','Austria'],
  ['🇦🇿','Azerbaijan'],['🇧🇸','Bahamas'],['🇧🇭','Bahrain'],['🇧🇩','Bangladesh'],['🇧🇧','Barbados'],
  ['🇧🇾','Belarus'],['🇧🇪','Belgium'],['🇧🇿','Belize'],['🇧🇯','Benin'],['🇧🇹','Bhutan'],
  ['🇧🇴','Bolivia'],['🇧🇦','Bosnia and Herzegovina'],['🇧🇼','Botswana'],['🇧🇷','Brazil'],['🇧🇳','Brunei'],
  ['🇧🇬','Bulgaria'],['🇧🇫','Burkina Faso'],['🇧🇮','Burundi'],['🇨🇻','Cabo Verde'],['🇰🇭','Cambodia'],
  ['🇨🇲','Cameroon'],['🇨🇦','Canada'],['🇨🇫','Central African Republic'],['🇹🇩','Chad'],['🇨🇱','Chile'],
  ['🇨🇳','China'],['🇨🇴','Colombia'],['🇰🇲','Comoros'],['🇨🇬','Congo'],['🇨🇷','Costa Rica'],
  ['🇭🇷','Croatia'],['🇨🇺','Cuba'],['🇨🇾','Cyprus'],['🇨🇿','Czech Republic'],['🇩🇰','Denmark'],
  ['🇩🇯','Djibouti'],['🇩🇲','Dominica'],['🇩🇴','Dominican Republic'],['🇪🇨','Ecuador'],['🇪🇬','Egypt'],
  ['🇸🇻','El Salvador'],['🇬🇶','Equatorial Guinea'],['🇪🇷','Eritrea'],['🇪🇪','Estonia'],['🇸🇿','Eswatini'],
  ['🇪🇹','Ethiopia'],['🇫🇯','Fiji'],['🇫🇮','Finland'],['🇫🇷','France'],['🇬🇦','Gabon'],
  ['🇬🇲','Gambia'],['🇬🇪','Georgia'],['🇩🇪','Germany'],['🇬🇭','Ghana'],['🇬🇷','Greece'],
  ['🇬🇩','Grenada'],['🇬🇹','Guatemala'],['🇬🇳','Guinea'],['🇬🇼','Guinea-Bissau'],['🇬🇾','Guyana'],
  ['🇭🇹','Haiti'],['🇭🇳','Honduras'],['🇭🇺','Hungary'],['🇮🇸','Iceland'],['🇮🇳','India'],
  ['🇮🇩','Indonesia'],['🇮🇷','Iran'],['🇮🇶','Iraq'],['🇮🇪','Ireland'],['🇮🇱','Israel'],
  ['🇮🇹','Italy'],['🇯🇲','Jamaica'],['🇯🇵','Japan'],['🇯🇴','Jordan'],['🇰🇿','Kazakhstan'],
  ['🇰🇪','Kenya'],['🇰🇮','Kiribati'],['🇰🇼','Kuwait'],['🇰🇬','Kyrgyzstan'],['🇱🇦','Laos'],
  ['🇱🇻','Latvia'],['🇱🇧','Lebanon'],['🇱🇸','Lesotho'],['🇱🇷','Liberia'],['🇱🇾','Libya'],
  ['🇱🇮','Liechtenstein'],['🇱🇹','Lithuania'],['🇱🇺','Luxembourg'],['🇲🇬','Madagascar'],['🇲🇼','Malawi'],
  ['🇲🇾','Malaysia'],['🇲🇻','Maldives'],['🇲🇱','Mali'],['🇲🇹','Malta'],['🇲🇭','Marshall Islands'],
  ['🇲🇷','Mauritania'],['🇲🇺','Mauritius'],['🇲🇽','Mexico'],['🇫🇲','Micronesia'],['🇲🇩','Moldova'],
  ['🇲🇨','Monaco'],['🇲🇳','Mongolia'],['🇲🇪','Montenegro'],['🇲🇦','Morocco'],['🇲🇿','Mozambique'],
  ['🇲🇲','Myanmar'],['🇳🇦','Namibia'],['🇳🇷','Nauru'],['🇳🇵','Nepal'],['🇳🇱','Netherlands'],
  ['🇳🇿','New Zealand'],['🇳🇮','Nicaragua'],['🇳🇪','Niger'],['🇳🇬','Nigeria'],['🇰🇵','North Korea'],
  ['🇲🇰','North Macedonia'],['🇳🇴','Norway'],['🇴🇲','Oman'],['🇵🇰','Pakistan'],['🇵🇼','Palau'],
  ['🇵🇦','Panama'],['🇵🇬','Papua New Guinea'],['🇵🇾','Paraguay'],['🇵🇪','Peru'],['🇵🇭','Philippines'],
  ['🇵🇱','Poland'],['🇵🇹','Portugal'],['🇶🇦','Qatar'],['🇷🇴','Romania'],['🇷🇺','Russia'],
  ['🇷🇼','Rwanda'],['🇰🇳','Saint Kitts and Nevis'],['🇱🇨','Saint Lucia'],['🇻🇨','Saint Vincent'],
  ['🇼🇸','Samoa'],['🇸🇲','San Marino'],['🇸🇹','Sao Tome and Principe'],['🇸🇦','Saudi Arabia'],
  ['🇸🇳','Senegal'],['🇷🇸','Serbia'],['🇸🇨','Seychelles'],['🇸🇱','Sierra Leone'],['🇸🇬','Singapore'],
  ['🇸🇰','Slovakia'],['🇸🇮','Slovenia'],['🇸🇧','Solomon Islands'],['🇸🇴','Somalia'],['🇿🇦','South Africa'],
  ['🇸🇸','South Sudan'],['🇪🇸','Spain'],['🇱🇰','Sri Lanka'],['🇸🇩','Sudan'],['🇸🇷','Suriname'],
  ['🇸🇪','Sweden'],['🇨🇭','Switzerland'],['🇸🇾','Syria'],['🇹🇼','Taiwan'],['🇹🇯','Tajikistan'],
  ['🇹🇿','Tanzania'],['🇹🇭','Thailand'],['🇹🇱','Timor-Leste'],['🇹🇬','Togo'],['🇹🇴','Tonga'],
  ['🇹🇹','Trinidad and Tobago'],['🇹🇳','Tunisia'],['🇹🇷','Turkey'],['🇹🇲','Turkmenistan'],['🇹🇻','Tuvalu'],
  ['🇺🇬','Uganda'],['🇺🇦','Ukraine'],['🇦🇪','United Arab Emirates'],['🇬🇧','United Kingdom'],
  ['🇺🇸','United States'],['🇺🇾','Uruguay'],['🇺🇿','Uzbekistan'],['🇻🇺','Vanuatu'],['🇻🇪','Venezuela'],
  ['🇻🇳','Vietnam'],['🇾🇪','Yemen'],['🇿🇲','Zambia'],['🇿🇼','Zimbabwe'],
  ['🇭🇰','Hong Kong'],['🇲🇴','Macau'],['🇵🇷','Puerto Rico'],
]

const options = countries
  .sort((a, b) => a[1].localeCompare(b[1]))
  .map(([flag, name]) => `<option key="${name}" value="${name}">${flag} ${name}</option>`)
  .join('\n                ')

const OLD_SELECT = `<label style={labelStyle}>Country</label>
            <select style={inpStyle} value={form.country} onChange={e=>set('country',e.target.value)} disabled={!editing}>
              <option value="">Select country</option>
              {[['🇺🇸','United States']`

if (!s.includes(OLD_SELECT)) {
  console.log('⚠ Could not find old select — may need manual check')
  process.exit(1)
}

// Find the full old select block
const selectStart = s.indexOf(OLD_SELECT)
const selectEnd = s.indexOf('</select>', selectStart) + 9

const newSelect = `<label style={labelStyle}>Country</label>
            <select style={inpStyle} value={form.country} onChange={e=>set('country',e.target.value)} disabled={!editing}>
              <option value="">Select country</option>
              ${options}
            </select>`

s = s.slice(0, selectStart) + newSelect + s.slice(selectEnd)
console.log(`✓ Country dropdown updated with ${countries.length} countries in alphabetical order`)

fs.writeFileSync('components/AccountTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
