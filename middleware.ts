import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isLoggedIn = !!token
  const pathname = req.nextUrl.pathname

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isApiAuth = pathname.startsWith('/api/auth')
  const isPublic =
    pathname === '/_next' ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'

  if (isPublic || isApiAuth) return NextResponse.next()
  if (!isLoggedIn && !isAuthPage) return NextResponse.redirect(new URL('/login', req.nextUrl))
  if (isLoggedIn && isAuthPage) return NextResponse.redirect(new URL('/', req.nextUrl))

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
