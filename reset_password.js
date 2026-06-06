const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'dominicvansaghi@yahoo.com';
  const newPassword = 'TradeZar2026!';
  
  const hash = await bcrypt.hash(newPassword, 12);
  
  const user = await prisma.user.update({
    where: { email },
    data: { password: hash },
  });
  
  console.log('Password reset for:', user.email);
  console.log('New password: TradeZar2026!');
  await prisma.$disconnect();
}

resetPassword().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
