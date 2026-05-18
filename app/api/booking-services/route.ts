import { NextRequest, NextResponse } from 'next/server'
import { readBookingServices } from '@/lib/booking-services-db'

/**
 * Public read-only catalog for the booking widget.
 * Scoped to this deployment via `CLIENT_ID` when the query param is present.
 */
export async function GET(req: NextRequest) {
  const envClientId = process.env.CLIENT_ID
  const q = req.nextUrl.searchParams.get('clientId')
  if (envClientId && q !== null && q !== envClientId) {
    return NextResponse.json({ services: [] }, { status: 404 })
  }

  const services = await readBookingServices()
  return NextResponse.json({ services })
}
