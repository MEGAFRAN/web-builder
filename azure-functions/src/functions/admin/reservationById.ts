import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import { updateReservationById } from '../../cosmos/adminDb'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../../http/responseHelpers'

interface PatchBody {
  action?: string
  reason?: string
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'PATCH, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  if (request.method !== 'PATCH') {
    return jsonResponse(405, origin, methods, { error: 'Method not allowed.' })
  }

  try {
    const session = await validateAdminJwt(request)
    const id = request.params.id
    if (!id || id.trim().length === 0) {
      return jsonResponse(400, origin, methods, { error: 'Reservation id is required.' })
    }

    let body: PatchBody
    try {
      body = (await request.json()) as PatchBody
    } catch {
      return jsonResponse(400, origin, methods, { error: 'Invalid JSON' })
    }

    const action = body.action
    if (action !== 'cancel' && action !== 'no-show') {
      return jsonResponse(422, origin, methods, { error: 'action must be cancel or no-show.' })
    }

    const reason =
      typeof body.reason === 'string' && body.reason.trim().length > 0
        ? body.reason.trim()
        : null

    const updated = await updateReservationById(decodeURIComponent(id), session.clientId, (row) => {
      if (action === 'cancel') {
        return { ...row, status: 'cancelled', cancelReason: reason }
      }
      return { ...row, status: 'no-show' }
    })

    if (!updated) {
      return jsonResponse(404, origin, methods, { error: 'Reservation not found.' })
    }

    return jsonResponse(200, origin, methods, { ok: true, reservation: updated })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'admin/reservations/:id', context)
  }
}

app.http('adminReservationById', {
  methods: ['PATCH', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'admin/reservations/{id}',
  handler,
})
