import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/require-admin'
import { updateReservation } from '@/lib/reservations-db'

interface PatchBody {
  action?: string
  reason?: string
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const clientId = process.env.CLIENT_ID!
  const { id } = await ctx.params

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action
  if (action !== 'cancel' && action !== 'no-show') {
    return NextResponse.json({ error: 'action must be cancel or no-show.' }, { status: 422 })
  }

  const reason =
    typeof body.reason === 'string' && body.reason.trim().length > 0
      ? body.reason.trim()
      : null

  const updated = await updateReservation(decodeURIComponent(id), clientId, (row) => {
    if (action === 'cancel') {
      return { ...row, status: 'cancelled', cancelReason: reason }
    }
    return { ...row, status: 'no-show' }
  })

  if (!updated) {
    return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, reservation: updated })
}
