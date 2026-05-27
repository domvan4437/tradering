const fs = require('fs')
let s = fs.readFileSync('app/api/auth/[...nextauth]/route.js', 'utf8')

// Replace hardcoded values with env vars
s = s.replace(
  `const SUPABASE_URL = 'https://mdddbfrtqnpyathtgvbv.supabase.co'`,
  `const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL`
)
s = s.replace(
  `const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGRiZnJ0cW5weWF0aHRndmJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4NDY1MCwiZXhwIjoyMDkxMjYwNjUwfQ.WNs2RHuG9N7Z9acsimnkscgWSRUcJKfrKmCTecjYk6s'`,
  `const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY`
)

fs.writeFileSync('app/api/auth/[...nextauth]/route.js', s)
console.log('✓ Auth route now uses environment variables')
console.log('\nRun: git add -A && git commit -m "Fix auth: use env vars" && git push origin main && vercel --prod')
