import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import { aggregateMonthlySummary } from '../../cosmos/telemetryStore'
import { handleHttpError, handleOptions, jsonResponse } from '../../http/responseHelpers'

function parseMonth(value: string | null): string | null {
  if (!value) return null
  return /^\d{4}-\d{2}$/.test(value) ? value : null
}

function currentUtcMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export async function telemetrySummaryHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'GET, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  try {
    const session = await validateAdminJwt(request)
    const monthParam = request.query.get('month')
    const month = parseMonth(monthParam) ?? (monthParam ? null : currentUtcMonth())

    if (monthParam && !month) {
      return jsonResponse(400, origin, methods, { error: 'month must be YYYY-MM.' })
    }

    const summary = await aggregateMonthlySummary(session.clientId, month!)
    return jsonResponse(200, origin, methods, summary)
  } catch (err) {
    return handleHttpError(err, origin, methods, 'telemetry/summary', context)
  }
}

app.http('telemetrySummary', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'mgmt/telemetry/summary',
  handler: telemetrySummaryHandler,
})
