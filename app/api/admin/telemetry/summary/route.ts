import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/require-admin'
import { aggregateMonthlySummary } from '@/lib/telemetry-local-store'

function parseMonth(value: string | null): string | null {
  if (!value) return null
  return /^\d{4}-\d{2}$/.test(value) ? value : null
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const month = parseMonth(req.nextUrl.searchParams.get('month'))
  if (req.nextUrl.searchParams.has('month') && !month) {
    return NextResponse.json({ error: 'month must be YYYY-MM.' }, { status: 400 })
  }

  const summary = await aggregateMonthlySummary(gate.clientId, month ?? undefined)
  return NextResponse.json(summary)
}
