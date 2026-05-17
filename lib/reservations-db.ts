import { promises as fs } from 'fs'
import path from 'path'
import type { StoredReservation } from '@/types/admin'

export const RESERVATIONS_DB_PATH = path.join(process.cwd(), 'data', 'reservations-local.json')

export async function readReservations(): Promise<StoredReservation[]> {
  try {
    const raw = await fs.readFile(RESERVATIONS_DB_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as StoredReservation[]) : []
  } catch {
    return []
  }
}

export async function writeReservations(rows: StoredReservation[]): Promise<void> {
  await fs.writeFile(RESERVATIONS_DB_PATH, JSON.stringify(rows, null, 2))
}

export async function appendReservation(row: StoredReservation): Promise<void> {
  const rows = await readReservations()
  rows.push(row)
  await writeReservations(rows)
}

export async function updateReservation(
  id: string,
  clientId: string,
  mutate: (row: StoredReservation) => StoredReservation,
): Promise<StoredReservation | null> {
  const rows = await readReservations()
  const ix = rows.findIndex((r) => r.id === id && r.clientId === clientId)
  if (ix === -1) return null
  rows[ix] = mutate(rows[ix])
  await writeReservations(rows)
  return rows[ix]
}
