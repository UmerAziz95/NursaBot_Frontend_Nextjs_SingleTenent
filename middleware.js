import { NextResponse } from 'next/server'

export async function middleware(req) {
  const { pathname } = req.nextUrl

  // Only force signup during first-time setup; otherwise show the marketing home.
  if (pathname === '/') {
    try {
      const statusUrl = new URL('/api/setup/status', req.nextUrl.origin)
      const res = await fetch(statusUrl.toString(), { headers: { Accept: 'application/json' } })
      if (res.ok) {
        const data = await res.json()
        if (data?.needs_setup) {
          return NextResponse.redirect(new URL('/signup', req.nextUrl.origin))
        }
      }
    } catch (e) {
      // If the status check fails, fall back to normal routing
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
