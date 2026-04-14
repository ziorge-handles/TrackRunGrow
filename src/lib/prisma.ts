import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local (see .env.example).',
    )
  }

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

  throw new Error(
    `DATABASE_URL has an unrecognised scheme. Expected postgresql://, postgres://, or prisma+postgres://. Got: ${url.split('://')[0]}://...`,
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
