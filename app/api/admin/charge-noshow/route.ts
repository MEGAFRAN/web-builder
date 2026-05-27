import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/client-config'
import { chargeNoShowForClient } from '@/lib/charge-noshow'
import { requireAdminSession } from '@/lib/require-admin'
import { readBookingServices } from '@/lib/booking-services-db'
import { readReservations, writeReservations } from '@/lib/reservations-db'

export async function POST(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const clientId = process.env.CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'CLIENT_ID not configured.' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const reservationId =
    typeof body === 'object' && body !== null && 'reservationId' in body
      ? String((body as { reservationId: unknown }).reservationId).trim()
      : ''
  if (!reservationId) {
    return NextResponse.json({ error: 'reservationId is required.' }, { status: 422 })
  }

  let bookingSettings
  try {
    bookingSettings = getClientConfig(clientId).bookingSettings
  } catch {
    return NextResponse.json({ error: 'Client config not found.' }, { status: 404 })
  }

  if (!bookingSettings?.enforceGuarantee) {
    return NextResponse.json({ error: 'No-show guarantee is not enabled.' }, { status: 422 })
  }

  const rows = await readReservations()
  const ix = rows.findIndex((r) => r.id === reservationId && r.clientId === clientId)
  if (ix === -1) {
    return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 })
  }

  const reservation = rows[ix]
  if (!reservation.guarantee?.paymentMethodId) {
    return NextResponse.json(
      { error: 'This reservation has no card on file.' },
      { status: 422 },
    )
  }

  const services = await readBookingServices()
  const charge = await chargeNoShowForClient({
    reservation,
    settings: bookingSettings,
    services,
  })
  rows[ix] = {
    ...reservation,
    status: charge.status,
    ...(charge.ok ? {} : { cancelReason: charge.error }),
  }
  await writeReservations(rows)

  if (!charge.ok) {
    return NextResponse.json(
      { error: charge.error, reservation: rows[ix] },
      { status: 402 },
    )
  }

  return NextResponse.json({ ok: true, reservation: rows[ix] })
}
