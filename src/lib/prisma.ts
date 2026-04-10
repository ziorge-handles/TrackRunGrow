import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? ''

  // prisma+postgres:// URLs are for Prisma's local dev server / Accelerate.
  // In production or when a standard pg URL is provided, use PrismaPg adapter.
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    const adapter = new PrismaPg(url)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  // For prisma+postgres:// (Prisma Accelerate / local dev server),
  // PrismaClient can use the accelerateUrl option.
  if (url.startsWith('prisma+postgres://') || url.startsWith('prisma://')) {
    return new PrismaClient({
      accelerateUrl: url,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  // Fallback: attempt PrismaPg with whatever URL is provided
  const adapter = new PrismaPg(url || 'postgresql://localhost:5432/trackrungrow')
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
