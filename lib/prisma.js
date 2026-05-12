// lib/prisma.js
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres.mdddbfrtqnpyathtgvbv:tradingworld4437croatia@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
    }
  }
})
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
