import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/client-config'
import { requireAdminSession } from '@/lib/require-admin'

export async function GET(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const clientId = process.env.CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'CLIENT_ID not configured.' }, { status: 500 })
  }

  try {
    const config = getClientConfig(clientId)
    return NextResponse.json({ bookingSettings: config.bookingSettings ?? null })
  } catch {
    return NextResponse.json({ bookingSettings: null })
  }
}
