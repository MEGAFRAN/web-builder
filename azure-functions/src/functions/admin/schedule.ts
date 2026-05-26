import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import { getSchedule, upsertSchedule } from '../../cosmos/adminDb'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../../http/responseHelpers'
import type { BookingScheduleFile, ScheduleException, WeeklyHoursRow } from '../../types/admin'
import {
  DEFAULT_WEEKLY,
  isValidDateYmd,
  isWeeklyRow,
  parseHm,
} from '../../validators/bookingCatalog'

const REQUIRED_DAYS: WeeklyHoursRow['day'][] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
]

function validateWeekly(weekly: unknown): weekly is WeeklyHoursRow[] {
  if (!Array.isArray(weekly) || weekly.length !== 7 || !weekly.every(isWeeklyRow)) {
    return false
  }
  const seen = new Set<string>()
  for (const row of weekly) {
    if (seen.has(row.day)) return false
    seen.add(row.day)
  }
  for (const code of REQUIRED_DAYS) {
    if (!seen.has(code)) return false
  }
  return true
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'GET, PUT, POST, DELETE, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  try {
    const session = await validateAdminJwt(request)

    if (request.method === 'GET') {
      const schedule = await getSchedule(session.clientId)
      return jsonResponse(200, origin, methods, schedule, { 'Cache-Control': 'no-store' })
    }

    if (request.method === 'PUT') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse(400, origin, methods, { error: 'Invalid JSON' })
      }

      const b = body as { weekly?: unknown }
      if (!validateWeekly(b.weekly)) {
        return jsonResponse(422, origin, methods, {
          error: 'Expected weekly array of 7 valid day rows (mon–sun).',
        })
      }

      const current = await getSchedule(session.clientId)
      const next: BookingScheduleFile = {
        weekly: b.weekly,
        exceptions: current.exceptions,
      }
      await upsertSchedule(session.clientId, next)
      return jsonResponse(200, origin, methods, { ok: true, schedule: next })
    }

    if (request.method === 'POST') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse(400, origin, methods, { error: 'Invalid JSON' })
      }

      const o = body as Record<string, unknown>
      const date = typeof o.date === 'string' ? o.date : ''
      const closed = o.closed === true
      const from = typeof o.from === 'string' ? o.from : ''
      const to = typeof o.to === 'string' ? o.to : ''

      if (!isValidDateYmd(date)) {
        return jsonResponse(422, origin, methods, { error: 'Invalid date.' })
      }

      let exception: ScheduleException
      if (closed) {
        exception = {
          id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date,
          closed: true,
        }
      } else {
        const a = parseHm(from)
        const b = parseHm(to)
        if (a === null || b === null || b <= a) {
          return jsonResponse(422, origin, methods, { error: 'Custom hours need valid from/to.' })
        }
        exception = {
          id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date,
          closed: false,
          from,
          to,
        }
      }

      const current = await getSchedule(session.clientId)
      const others = current.exceptions.filter((e) => e.date !== date)
      const next: BookingScheduleFile = {
        weekly: current.weekly.length === 7 ? current.weekly : DEFAULT_WEEKLY,
        exceptions: [...others, exception],
      }
      await upsertSchedule(session.clientId, next)
      return jsonResponse(200, origin, methods, { ok: true, schedule: next })
    }

    if (request.method === 'DELETE') {
      const queryId = request.query.get('id')?.trim()
      let bodyId: string | undefined
      if (!queryId) {
        try {
          const body = (await request.json()) as { id?: unknown }
          if (typeof body.id === 'string') bodyId = body.id.trim()
        } catch {
          // no body — fall through to validation error
        }
      }
      const id = queryId || bodyId
      if (!id) {
        return jsonResponse(400, origin, methods, { error: 'Query id is required.' })
      }

      const current = await getSchedule(session.clientId)
      const next: BookingScheduleFile = {
        weekly: current.weekly,
        exceptions: current.exceptions.filter((e) => e.id !== id),
      }

      if (next.exceptions.length === current.exceptions.length) {
        return jsonResponse(404, origin, methods, { error: 'Exception not found.' })
      }

      await upsertSchedule(session.clientId, next)
      return jsonResponse(200, origin, methods, { ok: true, schedule: next })
    }

    return jsonResponse(405, origin, methods, { error: 'Method not allowed.' })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'mgmt/schedule', context)
  }
}

app.http('adminSchedule', {
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'mgmt/schedule',
  handler,
})
