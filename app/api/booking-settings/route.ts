import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/client-config'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')?.trim()
  const envClientId = process.env.CLIENT_ID?.trim()

  if (!clientId) {
    return NextResponse.json({ error: 'clientId query parameter is required.' }, { status: 400 })
  }

  if (envClientId && clientId !== envClientId) {
    return NextResponse.json({ bookingSettings: null }, { status: 404 })
  }

  try {
    const config = getClientConfig(clientId)
    return NextResponse.json(
      { bookingSettings: config.bookingSettings ?? null },
      { headers: { 'Cache-Control': 'public, max-age=60' } },
    )
  } catch {
    return NextResponse.json({ bookingSettings: null })
  }
}
