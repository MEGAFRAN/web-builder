import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import {
  createReservation,
  getServices,
  listReservations,
} from '../../cosmos/adminDb'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../../http/responseHelpers'
import type { StoredReservation } from '../../types/admin'
import { parseIsoDate, resolveServiceDuration } from '../../validators/bookingCatalog'

interface ManualPayload {
  serviceId: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes?: string
}

function isManualPayload(body: unknown): body is ManualPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.serviceId === 'string' &&
    typeof b.date === 'string' &&
    typeof b.time === 'string' &&
    typeof b.name === 'string' &&
    typeof b.email === 'string' &&
    typeof b.phone === 'string' &&
    b.serviceId.trim().length > 0 &&
    b.name.trim().length > 0 &&
    b.email.trim().length > 0 &&
    b.phone.trim().length > 0 &&
    parseIsoDate(b.date)
  )
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'GET, POST, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  try {
    const session = await validateAdminJwt(request)

    if (request.method === 'GET') {
      const startDate = request.query.get('startDate')
      const endDate = request.query.get('endDate')

      if (
        !startDate ||
        !endDate ||
        !parseIsoDate(startDate) ||
        !parseIsoDate(endDate)
      ) {
        return jsonResponse(400, origin, methods, {
          error: 'startDate and endDate query params (YYYY-MM-DD) are required.',
        })
      }

      const rows = await listReservations(session.clientId, startDate, endDate)
      rows.sort((a, b) => {
        const dt = a.date.localeCompare(b.date)
        if (dt !== 0) return dt
        return a.time.localeCompare(b.time)
      })

      const services = await getServices(session.clientId)
      const svcMap = new Map(services.map((s) => [s.id, s]))

      const enriched = rows.map((r) => ({
        ...r,
        serviceName:
          r.serviceId && svcMap.has(r.serviceId)
            ? svcMap.get(r.serviceId)!.name
            : r.serviceId ?? null,
      }))

      return jsonResponse(200, origin, methods, { reservations: enriched }, {
        'Cache-Control': 'no-store',
      })
    }

    if (request.method === 'POST') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse(400, origin, methods, { error: 'Invalid JSON' })
      }

      if (!isManualPayload(body)) {
        return jsonResponse(422, origin, methods, { error: 'Invalid reservation payload.' })
      }

      const services = await getServices(session.clientId)
      const svc = services.find((s) => s.id === body.serviceId.trim())
      if (!svc) {
        return jsonResponse(422, origin, methods, { error: 'Unknown service.' })
      }

      const durationMinutes = resolveServiceDuration(svc)
      if (!durationMinutes) {
        return jsonResponse(422, origin, methods, { error: 'Service has no bookable duration.' })
      }

      const record: StoredReservation = {
        id: `${session.clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        clientId: session.clientId,
        serviceId: svc.id,
        durationMinutes,
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        date: body.date,
        time: body.time.trim(),
        notes: typeof body.notes === 'string' ? body.notes.trim() || null : null,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      }

      await createReservation(record)
      return jsonResponse(200, origin, methods, { ok: true, id: record.id })
    }

    return jsonResponse(405, origin, methods, { error: 'Method not allowed.' })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'admin/reservations', context)
  }
}

app.http('adminReservations', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'admin/reservations',
  handler,
})
