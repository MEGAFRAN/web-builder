// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  weekdayIndexMonSun,
  dayCodeFromYmd,
  exceptionForDate,
  parseHm,
} from '@/lib/booking-schedule-utils'
import type { ScheduleException } from '@/types/admin'

describe('booking-schedule-utils', () => {
  describe('weekdayIndexMonSun', () => {
    it.each([
      ['2026-05-11', 0], // Monday
      ['2026-05-12', 1],
      ['2026-05-13', 2],
      ['2026-05-14', 3],
      ['2026-05-15', 4],
      ['2026-05-16', 5],
      ['2026-05-17', 6], // Sunday
    ] as const)('%s → index %i (Mon=0 … Sun=6)', (ymd, idx) => {
      expect(weekdayIndexMonSun(ymd)).toBe(idx)
    })
  })

  describe('dayCodeFromYmd', () => {
    it.each([
      ['2026-05-11', 'mon'],
      ['2026-05-17', 'sun'],
      ['2026-05-13', 'wed'],
    ] as const)('%s → %s', (ymd, code) => {
      expect(dayCodeFromYmd(ymd)).toBe(code)
    })
  })

  describe('exceptionForDate', () => {
    const exceptions: ScheduleException[] = [
      { id: '1', date: '2026-06-01', closed: true },
      { id: '2', date: '2026-06-02', closed: false, from: '10:00', to: '14:00' },
    ]

    it('returns the matching exception', () => {
      expect(exceptionForDate(exceptions, '2026-06-02')).toEqual(exceptions[1])
    })

    it('returns undefined when no match', () => {
      expect(exceptionForDate(exceptions, '2026-06-03')).toBeUndefined()
    })
  })

  describe('parseHm', () => {
    it.each([
      ['09:00', 9 * 60],
      ['9:00', 9 * 60],
      [' 21:30 ', 21 * 60 + 30],
      ['00:00', 0],
      ['23:59', 23 * 60 + 59],
    ] as const)('parses %j → minutes', (hm, mins) => {
      expect(parseHm(hm)).toBe(mins)
    })

    it.each([
      ['24:00'],
      ['12:60'],
      [''],
      ['9'],
      ['abc'],
      ['99:00'],
    ] as const)('returns null for invalid %j', (hm) => {
      expect(parseHm(hm)).toBeNull()
    })
  })
})
