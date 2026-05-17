import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'
import type { SessionPayload } from '@/types/admin'

export function requireAdminSession(req: NextRequest): SessionPayload | NextResponse {
  const secret = process.env.ADMIN_SESSION_SECRET
  const clientId = process.env.CLIENT_ID
  if (!secret || !clientId) {
    return NextResponse.json({ error: 'Admin auth is not configured.' }, { status: 503 })
  }
  const raw = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!raw) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const payload = verifySessionToken(raw, secret)
  if (!payload || payload.clientId !== clientId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return payload
}
