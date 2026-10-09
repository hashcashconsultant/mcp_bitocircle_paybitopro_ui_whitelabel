import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const [domain, port] = host.split(':')

  if (domain === 'bitocircle.com') {
    const pathname = request.nextUrl.pathname
    const search = request.nextUrl.search
    const protocol = request.nextUrl.protocol

    const targetHost = port ? `www.bitocircle.com:${port}` : 'www.bitocircle.com'
    const redirectUrl = `${protocol}//${targetHost}${pathname}${search}`

    return NextResponse.redirect(redirectUrl, 301)
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
     * - favicon.ico (favicon file)
     * - manifest.json / sitemap.xml / robots.txt (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)',
  ],
}
