// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { AdminBookingService } from '@/types/admin'

const readFileMock = vi.hoisted(() => vi.fn())
const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('fs', () => ({
  promises: {
    readFile: readFileMock,
    writeFile: writeFileMock,
  },
  default: {},
}))

import { readBookingServices, writeBookingServices } from '@/lib/booking-services-db'

describe('booking-services-db', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    writeFileMock.mockReset()
  })

  it('returns empty array when read fails', async () => {
    readFileMock.mockRejectedValueOnce(new Error('ENOENT'))
    await expect(readBookingServices()).resolves.toEqual([])
  })

  it('returns empty array when JSON root is not an object', async () => {
    readFileMock.mockResolvedValueOnce('null')
    await expect(readBookingServices()).resolves.toEqual([])
  })

  it('returns empty array when services key is not an array', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({ services: {} }))
    await expect(readBookingServices()).resolves.toEqual([])
  })

  it('parses services array when present', async () => {
    const services: AdminBookingService[] = [
      {
        id: 's1',
        name: 'Cut',
        description: 'Haircut',
        durationMinutes: 30,
        price: 40,
        currency: 'USD',
      },
    ]
    readFileMock.mockResolvedValueOnce(JSON.stringify({ services }))
    await expect(readBookingServices()).resolves.toEqual(services)
  })

  it('writes services JSON document', async () => {
    const services: AdminBookingService[] = []
    writeFileMock.mockResolvedValueOnce(undefined)
    await writeBookingServices(services)
    expect(writeFileMock).toHaveBeenCalledTimes(1)
    const [, contents] = writeFileMock.mock.calls[0]
    expect(JSON.parse(String(contents))).toEqual({ services })
  })
})
