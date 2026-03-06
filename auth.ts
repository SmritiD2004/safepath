import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)
        const user = await db.user.findUnique({ where: { email } })

        if (!user?.passwordHash) return null
        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        const validPassword = await compare(password, user.passwordHash)
        if (!validPassword) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isAnonymous: user.isAnonymous,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.name = (token.name as string | undefined) ?? session.user.name
        session.user.email = (token.email as string | undefined) ?? session.user.email
        session.user.image = (token.picture as string | undefined) ?? session.user.image
        session.user.role = (token.role as string | undefined) ?? 'USER'
        session.user.isAnonymous = Boolean(token.isAnonymous)
      }
      return session
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.role = (user as { role?: string }).role ?? 'USER'
        token.isAnonymous = (user as { isAnonymous?: boolean }).isAnonymous ?? false
      }
      if (trigger === 'update' && session?.user) {
        if (typeof session.user.name === 'string') token.name = session.user.name
        if (typeof session.user.email === 'string') token.email = session.user.email
        if (typeof session.user.image === 'string') token.picture = session.user.image
      }
      return token
    },
  },
  session: { strategy: 'jwt' },
})
