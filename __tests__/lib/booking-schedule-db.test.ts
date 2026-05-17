// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { BookingScheduleFile } from '@/types/admin'

const readFileMock = vi.hoisted(() => vi.fn())
const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('fs', () => ({
  promises: {
    readFile: readFileMock,
    writeFile: writeFileMock,
  },
  default: {},
}))

import { readBookingSchedule, writeBookingSchedule, DEFAULT_WEEKLY } from '@/lib/booking-schedule-db'

describe('booking-schedule-db', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    writeFileMock.mockReset()
  })

  it('returns defaults when read fails', async () => {
    readFileMock.mockRejectedValueOnce(new Error('ENOENT'))
    await expect(readBookingSchedule()).resolves.toEqual({
      weekly: DEFAULT_WEEKLY,
      exceptions: [],
    })
  })

  it('parses weekly and exceptions when file is valid', async () => {
    const file: BookingScheduleFile = {
      weekly: [{ day: 'mon', open: true, from: '10:00', to: '11:00' }],
      exceptions: [{ id: 'e', date: '2026-01-01', closed: true }],
    }
    readFileMock.mockResolvedValueOnce(JSON.stringify(file))
    await expect(readBookingSchedule()).resolves.toEqual(file)
  })

  it('falls back when weekly/exceptions are not arrays', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({ weekly: {}, exceptions: {} }))
    await expect(readBookingSchedule()).resolves.toEqual({
      weekly: DEFAULT_WEEKLY,
      exceptions: [],
    })
  })

  it('writes JSON file', async () => {
    const file: BookingScheduleFile = {
      weekly: DEFAULT_WEEKLY,
      exceptions: [],
    }
    writeFileMock.mockResolvedValueOnce(undefined)
    await writeBookingSchedule(file)
    expect(writeFileMock).toHaveBeenCalledTimes(1)
    const [, contents] = writeFileMock.mock.calls[0]
    expect(JSON.parse(String(contents))).toEqual(file)
  })
})
