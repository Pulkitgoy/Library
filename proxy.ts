import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const PUBLIC_ROUTES = ['/sign-in', '/sign-up']
const AUTH_COOKIE = 'bookwise-session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  const sessionCookie = request.cookies.get(AUTH_COOKIE)?.value
  const session = await decrypt(sessionCookie)

  // Redirect unauthenticated users trying to access protected routes
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder assets (icons, images, fonts)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons|images|fonts).*)',
  ],
}
