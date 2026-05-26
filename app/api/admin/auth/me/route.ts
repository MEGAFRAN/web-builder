import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/require-admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req)
  if (auth instanceof NextResponse) return auth
  return NextResponse.json({ email: auth.email, clientId: auth.clientId })
}
