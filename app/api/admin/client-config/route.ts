import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/client-config'
import { requireAdminSession } from '@/lib/require-admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req)
  if (auth instanceof NextResponse) return auth
  const config = getClientConfig(auth.clientId)
  return NextResponse.json({
    displayName: config.displayName,
    logoUrl: config.header?.logo ?? null,
  })
}
