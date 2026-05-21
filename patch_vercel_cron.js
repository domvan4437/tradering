const fs = require('fs')
fs.writeFileSync('vercel.json', JSON.stringify({
  crons: [
    {
      path: "/api/cron/competition-housekeeping",
      schedule: "0 0 * * *"
    }
  ]
}, null, 2))
console.log('✓ vercel.json updated to daily cron')
