import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { SessionPayload } from '@/types/admin'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    if (!Number.isFinite(byte)) return null
    out[i] = byte
  }
  return out
}

function base64UrlToUtf8(b64url: string): string | null {
  try {
    const pad = '='.repeat((4 - (b64url.length % 4)) % 4)
    const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + pad
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

async function verifySessionEdge(token: string, secret: string): Promise<SessionPayload | null> {
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const payloadB64 = token.slice(0, dot)
  const sigHex = token.slice(dot + 1)
  const payloadJson = base64UrlToUtf8(payloadB64)
  if (!payloadJson) return null
  const sigBytes = hexToBytes(sigHex)
  if (!sigBytes) return null
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes as BufferSource,
    encoder.encode(payloadJson),
  )
  if (!ok) return null
  let payload: SessionPayload
  try {
    payload = JSON.parse(payloadJson) as SessionPayload
  } catch {
    return null
  }
  if (
    typeof payload.email !== 'string' ||
    typeof payload.clientId !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return null
  }
  if (payload.exp <= Date.now()) return null
  return payload
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

  const secret = process.env.ADMIN_SESSION_SECRET
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
