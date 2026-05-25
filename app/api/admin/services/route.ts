import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/require-admin'
import { isServiceVariation } from '@/lib/booking-catalog'
import {
  readBookingServices,
  writeBookingServices,
} from '@/lib/booking-services-db'
import type { AdminBookingService } from '@/types/admin'

function isServiceRow(x: unknown): x is AdminBookingService {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  const baseValid =
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.description === 'string' &&
    typeof o.currency === 'string' &&
    (o.category === undefined || typeof o.category === 'string') &&
    o.id.trim().length > 0 &&
    o.name.trim().length > 0

  if (!baseValid) return false

  const variations = o.variations
  if (Array.isArray(variations) && variations.length > 0) {
    return variations.every(isServiceVariation)
  }

  return (
    typeof o.durationMinutes === 'number' &&
    typeof o.price === 'number' &&
    o.durationMinutes >= 1 &&
    o.durationMinutes <= 24 * 60 &&
    Number.isFinite(o.price) &&
    o.price >= 0
  )
}

export async function GET(req: NextRequest) {
  const gate = requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const services = await readBookingServices()
  return NextResponse.json({ services })
}

export async function PUT(req: NextRequest) {
  const gate = requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as { services?: unknown }
  if (!Array.isArray(b.services) || !b.services.every(isServiceRow)) {
    return NextResponse.json({ error: 'Expected { services: AdminBookingService[] }.' }, { status: 422 })
  }

  try {
    await writeBookingServices(b.services)
  } catch (err) {
    console.error('[admin/services] write failed:', err)
    return NextResponse.json({ error: 'Failed to save services.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
