import type { HttpRequest } from '@azure/functions'
import { HttpError } from '../errors/HttpError'

export function corsHeaders(
  origin: string | null,
  methods: string,
): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function jsonResponse(
  status: number,
  origin: string | null,
  methods: string,
  body: unknown,
  extraHeaders?: Record<string, string>,
): {
  status: number
  headers: Record<string, string>
  jsonBody: unknown
} {
  return {
    status,
    headers: {
      ...corsHeaders(origin, methods),
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    jsonBody: body,
  }
}

export function handleOptions(
  request: HttpRequest,
  methods: string,
): { status: number; headers: Record<string, string> } | null {
  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders(request.headers.get('origin'), methods) }
  }
  return null
}

export function handleHttpError(
  err: unknown,
  origin: string | null,
  methods: string,
  logLabel: string,
  context: { error: (...args: unknown[]) => void },
): {
  status: number
  headers: Record<string, string>
  jsonBody: unknown
} {
  if (err instanceof HttpError) {
    return jsonResponse(err.status, origin, methods, { error: err.message })
  }
  context.error(`[${logLabel}] request failed:`, err)
  return jsonResponse(500, origin, methods, { error: 'Internal server error.' })
}
