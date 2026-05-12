const path = require('path');
// Run from project root so prisma client is found
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'dominicvansaghi@yahoo.com';
  const newPass = 'TradeRing2026!';
  
  // First check if user exists
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, name: true }
  });
  
  if (!user) {
    console.log('User not found with email:', email);
    // List all users
    const all = await prisma.user.findMany({ select: { id: true, email: true } });
    console.log('All users in DB:', all);
    return;
  }
  
  console.log('Found user:', user);
  const hash = await bcrypt.hash(newPass, 12);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash }
  });
  
  console.log('Password reset successfully!');
  console.log('Email:', email);
  console.log('Password: TradeRing2026!');
}

main()
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
