import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

/**
 * Next.js Middleware — server-side route protection.
 *
 * - /admin/*       → must be authenticated AND have ADMIN role
 * - /certificate → must be authenticated
 * - /assessment/*  → public (Skill Check should not require login)
 * - /dashboard     → open to guests (limited view handled in the page)
 * - All other routes (landing, login, signup, public APIs) → open
 */

const protectedRoutes = ['/certificate']
const adminRoutes = ['/admin']

export default auth((req: NextAuthRequest) => {
  const { pathname, search } = req.nextUrl

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route))

  // Admin pages: must be logged in + ADMIN role
  if (isAdmin) {
    if (!req.auth?.user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`)
      return NextResponse.redirect(loginUrl)
    }
    if (req.auth.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protected pages: must be logged in
  if (isProtected) {
    if (!req.auth?.user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  // Run middleware on page routes only — skip API routes, static files, and Next.js internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|avatars|.*\\..*).*)'],
}
