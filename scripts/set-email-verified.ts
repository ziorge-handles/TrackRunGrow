/**
 * One-off / ops: set emailVerified for a user (e.g. legacy admin before verification flow).
 *
 * Usage (from trackrungrow/):
 *   node --import jiti/register scripts/set-email-verified.ts user@example.com
 */
import { config } from 'dotenv'

config({ path: '.env.local' })
config({ path: '.env' })

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const email = process.argv[2]?.trim().toLowerCase()
if (!email) {
  console.error('Usage: node --import jiti/register scripts/set-email-verified.ts <email>')
  process.exit(1)
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL or DIRECT_URL must be set')
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) })

const result = await prisma.user.updateMany({
  where: { email },
  data: { emailVerified: new Date() },
})

console.log(`Updated ${result.count} user(s) with emailVerified=now for: ${email}`)
if (result.count === 0) {
  console.warn('No row matched. Check the email matches the users.email column exactly.')
}

await prisma.$disconnect()
