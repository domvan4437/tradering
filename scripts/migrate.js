/**
 * Run this once from your terminal:
 *   node scripts/migrate.js
 *
 * It reads DATABASE_URL from .env.local and adds any missing columns.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Parse .env.local manually — handles quotes, spaces, multiline values
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌  .env.local not found at', envPath)
    return
  }
  const raw = fs.readFileSync(envPath, 'utf8')
  // Replace Windows CRLF
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key && val && !process.env[key]) {
      process.env[key] = val
    }
  }
}

loadEnv()

// Allow passing DATABASE_URL as a command-line argument
const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL
// Make sure it's in the environment for Prisma
if (DATABASE_URL) process.env.DATABASE_URL = DATABASE_URL
if (!DATABASE_URL || DATABASE_URL.trim() === '') {
  console.error('❌  DATABASE_URL is not set.')
  console.error('\n    Pass it directly in the terminal:')
  console.error('    node scripts/migrate.js "postgresql://postgres:YOUR_PASSWORD@db.mdddbfrtqnpyathtgvbv.supabase.co:5432/postgres"')
  process.exit(1)
}

const sql = `
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "openToMeetups" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "openToMentoring" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS youtube TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicWinRate" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicPnl" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicTrades" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicLocation" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "primaryAssets" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tradingStyle" TEXT;
`

async function run() {
  let client

  // Try using pg if available
  try {
    const { Client } = require('pg')
    client = new Client({ connectionString: DATABASE_URL })
    await client.connect()
    console.log('✓  Connected to database')
    await client.query(sql)
    console.log('✓  All columns added (or already existed)')
    await client.end()
    return
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('pg not installed — trying prisma db execute...')
    } else {
      console.error('❌  Database error:', e.message)
      process.exit(1)
    }
  }

  // Fallback: write SQL to a temp file and use prisma db execute
  try {
    const tmpFile = path.join(__dirname, '_tmp_migration.sql')
    fs.writeFileSync(tmpFile, sql)
    execSync(`npx prisma db execute --file ${tmpFile} --schema prisma/schema.prisma`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    })
    fs.unlinkSync(tmpFile)
    console.log('✓  Migration complete via prisma db execute')
  } catch (e) {
    console.error('❌  Could not run migration automatically.')
    console.log('\nPlease install pg and retry:')
    console.log('  npm install pg')
    console.log('  node scripts/migrate.js')
  }
}

run()
