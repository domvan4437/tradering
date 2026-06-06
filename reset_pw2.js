const bcrypt = require('bcryptjs');

async function main() {
  // Use the database URL directly with pg
  const { Client } = require('pg');
  
  const client = new Client({
    connectionString: 'postgresql://postgres.mdddbfrtqnpyathtgvbv:tradingworld4437croatia@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to database');

  // Check if user exists
  const check = await client.query("SELECT id, email FROM \"User\" WHERE email = 'dominicvansaghi@yahoo.com'");
  console.log('User found:', check.rows);

  if (check.rows.length === 0) {
    // Try without quotes
    const check2 = await client.query('SELECT id, email FROM users WHERE email = $1', ['dominicvansaghi@yahoo.com']);
    console.log('Users table:', check2.rows);
  } else {
    const hash = await bcrypt.hash('TradeZar2026!', 12);
    await client.query('UPDATE "User" SET password = $1 WHERE email = $2', [hash, 'dominicvansaghi@yahoo.com']);
    console.log('Password updated! Login with: TradeZar2026!');
  }

  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
