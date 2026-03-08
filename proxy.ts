import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * Next.js Middleware — server-side route protection.
 *
 * - /admin/*       → must be authenticated AND have ADMIN role
 * - /settings, /certificate, /assessment/* → must be authenticated
 * - /dashboard     → open to guests (limited view handled in the page)
 * - All other routes (landing, login, signup, public APIs) → open
 */

const protectedRoutes = ['/settings', '/certificate', '/assessment']
const adminRoutes = ['/admin']

export default auth((req) => {
  const { pathname } = req.nextUrl

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route))

  // Admin pages: must be logged in + ADMIN role
  if (isAdmin) {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
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
      loginUrl.searchParams.set('callbackUrl', pathname)
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