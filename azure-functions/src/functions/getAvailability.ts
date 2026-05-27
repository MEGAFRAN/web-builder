import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getReservationsContainer } from '../cosmos/adminDb'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../http/responseHelpers'

/** Slot starts aligned with ReservationBlock grid */
const SLOT_GRID = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
] as const

function parseDurationMinutes(raw: string | null): number | null {
  if (raw === null || raw === '') {
    return 60
  }
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1 || n > 24 * 60) {
    return null
  }
  return n
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function overlaps(aStart: number, aDur: number, bStart: number, bDur: number): boolean {
  const aEnd = aStart + aDur
  const bEnd = bStart + bDur
  return aStart < bEnd && bStart < aEnd
}

interface BookingRow {
  time: string
  durationMinutes?: number
}

function bookingDurationMinutes(row: BookingRow): number {
  if (typeof row.durationMinutes === 'number' && row.durationMinutes > 0) {
    return row.durationMinutes
  }
  return 60
}

function slotConflictsWithBookings(
  slotStart: string,
  requestedDuration: number,
  bookings: BookingRow[],
): boolean {
  const slotMin = timeToMinutes(slotStart)
  for (const r of bookings) {
    const bookDur = bookingDurationMinutes(r)
    const bookMin = timeToMinutes(r.time)
    if (overlaps(slotMin, requestedDuration, bookMin, bookDur)) {
      return true
    }
  }
  return false
}

/**
 * GET /api/availability?clientId=<id>&date=YYYY-MM-DD&duration=<minutes>
 *
 * Returns slot start times that are unavailable for an appointment of `duration`
 * minutes (overlap-aware). Defaults to duration=60 when omitted.
 *
 * Response: { bookedSlots: string[] }
 */
async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'GET, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  const clientId = request.query.get('clientId')
  const date = request.query.get('date')
  const durationRaw = request.query.get('duration')

  if (!clientId || !date) {
    return jsonResponse(400, origin, methods, {
      error: 'clientId and date query parameters are required.',
    })
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonResponse(400, origin, methods, {
      error: 'date must be in YYYY-MM-DD format.',
    })
  }

  const requestedDuration = parseDurationMinutes(durationRaw)
  if (requestedDuration === null) {
    return jsonResponse(400, origin, methods, {
      error: 'duration must be a positive integer (minutes), at most 1440.',
    })
  }

  try {
    const container = getReservationsContainer()
    const { resources } = await container.items
      .query<BookingRow>({
        query:
          'SELECT c.time, c.durationMinutes FROM c WHERE c.clientId = @clientId AND c.date = @date AND c.status != "cancelled" AND c.status != "no-show"',
        parameters: [
          { name: '@clientId', value: clientId },
          { name: '@date', value: date },
        ],
      })
      .fetchAll()

    const bookedSlots = SLOT_GRID.filter(slot =>
      slotConflictsWithBookings(slot, requestedDuration, resources),
    )
    context.log(`[availability] ${clientId} on ${date}: ${bookedSlots.length} unavailable slot(s)`)

    return jsonResponse(200, origin, methods, { bookedSlots }, { 'Cache-Control': 'no-store' })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'availability', context)
  }
}

app.http('getAvailability', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'availability',
  handler,
})
