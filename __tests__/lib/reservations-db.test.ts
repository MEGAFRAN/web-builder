// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { StoredReservation } from '@/types/admin'

const readFileMock = vi.hoisted(() => vi.fn())
const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('fs', () => ({
  promises: {
    readFile: readFileMock,
    writeFile: writeFileMock,
  },
  default: {},
}))

import {
  readReservations,
  writeReservations,
  appendReservation,
  updateReservation,
} from '@/lib/reservations-db'

describe('reservations-db', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    writeFileMock.mockReset()
  })

  const row = (overrides: Partial<StoredReservation> = {}): StoredReservation => ({
    id: 'r1',
    clientId: 'c1',
    name: 'Ann',
    email: 'a@a.com',
    phone: '1',
    date: '2026-05-20',
    time: '10:00',
    status: 'confirmed',
    createdAt: '2026-01-01',
    ...overrides,
  })

  it('returns empty array when read fails', async () => {
    readFileMock.mockRejectedValueOnce(new Error('ENOENT'))
    await expect(readReservations()).resolves.toEqual([])
  })

  it('returns empty array when JSON is not an array', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({}))
    await expect(readReservations()).resolves.toEqual([])
  })

  it('writes reservations JSON array', async () => {
    const rows = [row()]
    writeFileMock.mockResolvedValueOnce(undefined)
    await writeReservations(rows)
    expect(writeFileMock).toHaveBeenCalledTimes(1)
    const [, contents] = writeFileMock.mock.calls[0]
    expect(JSON.parse(String(contents))).toEqual(rows)
  })

  it('appendReservation reads, pushes, and writes', async () => {
    const existing = [row({ id: 'old' })]
    const next = row({ id: 'new' })
    readFileMock.mockResolvedValueOnce(JSON.stringify(existing))
    writeFileMock.mockResolvedValueOnce(undefined)
    await appendReservation(next)
    expect(writeFileMock).toHaveBeenCalledTimes(1)
    const [, contents] = writeFileMock.mock.calls[0]
    expect(JSON.parse(String(contents))).toEqual([...existing, next])
  })

  it('updateReservation returns null when id/clientId not found', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify([row({ id: 'x', clientId: 'y' })]))
    await expect(
      updateReservation('missing', 'y', (r) => ({ ...r, name: 'Noop' })),
    ).resolves.toBeNull()
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('updateReservation mutates matching row and persists', async () => {
    const initial = row({ id: 'target', clientId: 'c1', name: 'Before' })
    readFileMock.mockResolvedValueOnce(JSON.stringify([initial]))
    writeFileMock.mockResolvedValueOnce(undefined)
    const updated = await updateReservation('target', 'c1', (r) => ({
      ...r,
      name: 'After',
    }))
    expect(updated?.name).toBe('After')
    expect(writeFileMock).toHaveBeenCalledTimes(1)
    const persisted = JSON.parse(String(writeFileMock.mock.calls[0][1])) as StoredReservation[]
    expect(persisted[0]?.name).toBe('After')
  })
})
