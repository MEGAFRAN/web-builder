// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEFAULT_WEEKLY } from '@/lib/booking-schedule-db'
import { resolveDayMinutesWindow, slotFitsScheduleWindow } from '@/lib/booking-schedule-window'
import type { BookingScheduleFile, ScheduleException } from '@/types/admin'

function baseSchedule(overrides?: Partial<BookingScheduleFile>): BookingScheduleFile {
  return {
    weekly: DEFAULT_WEEKLY,
    exceptions: [],
    ...overrides,
  }
}

describe('booking-schedule-window', () => {
  describe('resolveDayMinutesWindow', () => {
    it('returns null when exception closes the day', () => {
      const ex: ScheduleException = { id: 'x', date: '2026-05-18', closed: true }
      expect(resolveDayMinutesWindow(baseSchedule({ exceptions: [ex] }), '2026-05-18')).toBeNull()
    })

    it('uses exception hours when provided', () => {
      const ex: ScheduleException = {
        id: 'x',
        date: '2026-05-18',
        closed: false,
        from: '11:00',
        to: '15:00',
      }
      expect(resolveDayMinutesWindow(baseSchedule({ exceptions: [ex] }), '2026-05-18')).toEqual({
        openMin: 11 * 60,
        closeMin: 15 * 60,
      })
    })

    it.each([
      [{ from: 'bad', to: '15:00' }, 'bad from'],
      [{ from: '11:00', to: 'bad' }, 'bad to'],
      [{ from: '15:00', to: '11:00' }, 'to <= from'],
    ] as const)('returns null when exception window invalid (%s)', (patch, _why) => {
      const ex: ScheduleException = {
        id: 'x',
        date: '2026-05-18',
        closed: false,
        ...patch,
      }
      expect(resolveDayMinutesWindow(baseSchedule({ exceptions: [ex] }), '2026-05-18')).toBeNull()
    })

    it('returns null when weekly row missing or closed', () => {
      const weekly = DEFAULT_WEEKLY.map((r) =>
        r.day === 'mon' ? { ...r, open: false } : r,
      )
      expect(resolveDayMinutesWindow(baseSchedule({ weekly }), '2026-05-18')).toBeNull()
    })

    it.each([
      [{ ...DEFAULT_WEEKLY[0], from: 'xx', to: '21:00' }],
      [{ ...DEFAULT_WEEKLY[0], from: '09:00', to: 'xx' }],
      [{ ...DEFAULT_WEEKLY[0], from: '12:00', to: '09:00' }],
    ] as const)('returns null when weekly window invalid', (badRow) => {
      const weekly = DEFAULT_WEEKLY.map((r) => (r.day === 'mon' ? badRow : r))
      expect(resolveDayMinutesWindow(baseSchedule({ weekly }), '2026-05-18')).toBeNull()
    })

    it('uses weekly hours on a normal open day', () => {
      expect(resolveDayMinutesWindow(baseSchedule(), '2026-05-18')).toEqual({
        openMin: 9 * 60,
        closeMin: 21 * 60,
      })
    })
  })

  describe('slotFitsScheduleWindow', () => {
    it('returns false when day is closed', () => {
      const ex: ScheduleException = { id: 'x', date: '2026-05-18', closed: true }
      expect(
        slotFitsScheduleWindow(baseSchedule({ exceptions: [ex] }), '2026-05-18', 10 * 60, 60),
      ).toBe(false)
    })

    it('returns false when slot extends past closing', () => {
      expect(slotFitsScheduleWindow(baseSchedule(), '2026-05-18', 20 * 60 + 30, 60)).toBe(false)
    })

    it('returns true when slot fits inside window', () => {
      expect(slotFitsScheduleWindow(baseSchedule(), '2026-05-18', 10 * 60, 60)).toBe(true)
    })
  })
})
