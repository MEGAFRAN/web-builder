import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import type { SessionPayload } from '@/types/admin'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'

async function verifySessionEdge(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    })
    const email = payload.email
    const clientId = payload.clientId
    const exp = payload.exp
    if (typeof email !== 'string' || typeof clientId !== 'string' || typeof exp !== 'number') {
      return null
    }
    return { email, clientId, exp }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login/') ||
    pathname.startsWith('/api/admin/auth/')
  ) {
    return NextResponse.next()
  }

  const isProtectedAdmin =
    pathname === '/admin' ||
    pathname === '/admin/' ||
    pathname.startsWith('/admin/bookings') ||
    pathname.startsWith('/admin/services') ||
    pathname.startsWith('/admin/availability') ||
    pathname.startsWith('/admin/settings')

  const isProtectedAdminApi =
    pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/auth/')

  if (!isProtectedAdmin && !isProtectedAdminApi) {
    return NextResponse.next()
  }

  const secret = process.env.ADMIN_JWT_SECRET
  const clientId = process.env.CLIENT_ID

  if (!secret || !clientId) {
    if (isProtectedAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('error', 'misconfigured')
      return NextResponse.redirect(url)
    }
    return NextResponse.json({ error: 'Admin auth is not configured.' }, { status: 503 })
  }

  const raw = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!raw) {
    if (isProtectedAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const payload = await verifySessionEdge(raw, secret)
  if (!payload || payload.clientId !== clientId) {
    if (isProtectedAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('redirect', pathname)
    const res = NextResponse.redirect(url)
    res.cookies.delete(ADMIN_SESSION_COOKIE)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
