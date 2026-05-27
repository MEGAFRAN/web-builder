import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { createReservation as createAdminReservation } from '../cosmos/adminDb'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../http/responseHelpers'

interface ReservationGuarantee {
  paymentMethodId: string
  customerId?: string | null
  status: 'vaulted'
}

interface ReservationPayload {
  clientId: string
  serviceId: string
  durationMinutes: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  notes?: string
  paymentMethodId?: string
  customerId?: string
}

function parseGuarantee(body: ReservationPayload): ReservationGuarantee | null {
  const pm = body.paymentMethodId?.trim()
  if (!pm) return null
  const guarantee: ReservationGuarantee = { paymentMethodId: pm, status: 'vaulted' }
  const customerId = body.customerId?.trim()
  if (customerId) guarantee.customerId = customerId
  return guarantee
}

function isValidPayload(body: unknown): body is ReservationPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.clientId === 'string' &&
    typeof b.serviceId === 'string' &&
    typeof b.durationMinutes === 'number' &&
    typeof b.name === 'string' &&
    typeof b.email === 'string' &&
    typeof b.phone === 'string' &&
    typeof b.date === 'string' &&
    typeof b.time === 'string' &&
    b.clientId.trim().length > 0 &&
    b.serviceId.trim().length > 0 &&
    b.name.trim().length > 0 &&
    b.email.trim().length > 0 &&
    b.phone.trim().length > 0 &&
    b.date.trim().length > 0 &&
    b.time.trim().length > 0 &&
    b.durationMinutes >= 1 &&
    b.durationMinutes <= 24 * 60
  )
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'POST, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse(400, origin, methods, { error: 'Invalid JSON' })
  }

  if (!isValidPayload(body)) {
    return jsonResponse(422, origin, methods, { error: 'Missing or invalid fields.' })
  }

  const reservationId = `${body.clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const guarantee = parseGuarantee(body)

  const record = {
    id: reservationId,
    clientId: body.clientId,
    serviceId: body.serviceId.trim(),
    durationMinutes: body.durationMinutes,
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    date: body.date,
    time: body.time,
    notes: body.notes?.trim() ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...(guarantee ? { guarantee } : {}),
  }

  try {
    await createAdminReservation(record)
    context.log(`[reservation] Created ${reservationId} for client ${body.clientId}`)
  } catch (err) {
    context.error('[reservation] Cosmos DB write failed:', err)
    return jsonResponse(500, origin, methods, {
      error: 'Failed to save reservation. Please try again.',
    })
  }

  const sendGridKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.NOTIFICATION_EMAIL_FROM
  if (sendGridKey && fromEmail) {
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendGridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: record.email }] }],
          from: { email: fromEmail },
          subject: 'Reservation confirmed',
          content: [
            {
              type: 'text/plain',
              value: [
                `Hi ${record.name},`,
                '',
                `Your reservation has been received:`,
                `  Service: ${record.serviceId} (${record.durationMinutes} min)`,
                `  Date: ${record.date}`,
                `  Time: ${record.time}`,
                record.notes ? `  Notes: ${record.notes}` : '',
                '',
                `We'll confirm within 2 hours.`,
              ]
                .filter(l => l !== undefined)
                .join('\n'),
            },
          ],
        }),
      })
    } catch (err) {
      context.warn('[reservation] SendGrid notification failed:', err)
    }
  }

  return jsonResponse(201, origin, methods, { ok: true, reservationId })
}

app.http('createReservation', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'reservations',
  handler,
})
