import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface ReservationRecord {
  clientId: string
  date: string
  time: string
  status: string
}

const DB_PATH = path.join(process.cwd(), 'data', 'reservations-local.json')

async function readRecords(): Promise<ReservationRecord[]> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(raw) as ReservationRecord[]
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  const date = req.nextUrl.searchParams.get('date')

  if (!clientId || !date) {
    return NextResponse.json(
      { error: 'clientId and date query parameters are required.' },
      { status: 400 }
    )
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'date must be in YYYY-MM-DD format.' },
      { status: 400 }
    )
  }

  const records = await readRecords()
  const bookedSlots = records
    .filter(r => r.clientId === clientId && r.date === date && r.status !== 'cancelled')
    .map(r => r.time)

  return NextResponse.json(
    { bookedSlots },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
