const bcrypt = require('bcryptjs');

async function main() {
  const password = 'TradeZar2026!';
  const hash = await bcrypt.hash(password, 12);
  console.log('New hash:', hash);
  
  // Also verify the old hash works
  const oldHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o4MFqEYi.';
  const valid = await bcrypt.compare(password, oldHash);
  console.log('Old hash valid:', valid);
  
  console.log('\nRun this SQL in Supabase:');
  console.log(`UPDATE public."User" SET password = '${hash}' WHERE email = 'dominicvansaghi@yahoo.com';`);
}

main().catch(console.error);
