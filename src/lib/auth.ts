import '@/lib/env'
import { logServerError } from '@/lib/server-debug'
import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Role } from '@/generated/prisma/client'

class EmailNotVerified extends CredentialsSignin {
  code = 'email_not_verified'
}

const { handlers, auth: authInternal, signIn, signOut } = NextAuth({
  // Required on Vercel / reverse proxies unless AUTH_URL matches the public origin exactly.
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        )

        if (!isValid) return null

        if (!user.emailVerified) {
          throw new EmailNotVerified()
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: Role }).role
      }
      // Refresh role from DB to catch ADMIN promotions
      if (token.id && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          })
          if (dbUser) {
            token.role = dbUser.role
          }
        } catch {
          // Keep existing role on DB errors
        }
      }
      return token
    },
    async session({ session, token }) {
      if (!token?.id || !session.user) return session

      session.user.id = token.id as string

      let role = token.role as Role | undefined
      if (!role) {
        try {
          const u = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          })
          role = u?.role
        } catch {
          // keep undefined; handled below
        }
      }
      session.user.role = (role ?? 'ATHLETE') as Role

      return session
    },
  },
})

export { handlers, signIn, signOut }

/**
 * Server-side session read. Wrapped so JWT / env misconfiguration does not
 * crash RSC with an opaque production digest — logs the cause and returns null.
 */
export async function auth() {
  try {
    return await authInternal()
  } catch (error) {
    logServerError('auth:session', error)
    return null
  }
}

// Augment next-auth types
declare module 'next-auth' {
  interface User {
    role?: Role
  }
  interface Session {
    user: {
      id: string
      role: Role
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string
    role?: Role
  }
}
