import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  signSession,
  timingSafeEqualStr,
} from '@/lib/admin-session'

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET
  const emailEnv = process.env.ADMIN_EMAIL
  const passwordEnv = process.env.ADMIN_PASSWORD
  const clientId = process.env.CLIENT_ID

  if (!secret || !emailEnv || !passwordEnv || !clientId) {
    return NextResponse.json({ error: 'Admin login is not configured.' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''
  const password = typeof b.password === 'string' ? b.password : ''

  const expectedEmail = emailEnv.trim().toLowerCase()
  const okEmail =
    email.length === expectedEmail.length && timingSafeEqualStr(email, expectedEmail)
  const okPass =
    password.length === passwordEnv.length &&
    timingSafeEqualStr(password, passwordEnv)

  if (!okEmail || !okPass) {
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
  }

  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000
  const token = signSession({ email: emailEnv.trim(), clientId, exp }, secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
  return res
}
