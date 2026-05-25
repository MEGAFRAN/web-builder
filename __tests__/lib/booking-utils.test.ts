// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { ReservationRow } from '@/types/admin'
import {
  addDaysYmd,
  bookingCardBorderClasses,
  bookingDurationMinutes,
  bookingStatusAriaLabel,
  formatPrettyDate,
  formatYmd,
  mondayOfWeek,
  parseYmdLocal,
  statusBadge,
  timeToMinutes,
} from '@/lib/booking-utils'

const sampleReservation: ReservationRow = {
  id: 'res-1',
  clientId: 'hair-salon',
  serviceId: 'svc-cut',
  serviceName: 'Haircut',
  durationMinutes: 45,
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  phone: '+1 415 555 0100',
  date: '2026-05-18',
  time: '10:00',
  status: 'confirmed',
  createdAt: '2026-05-18T08:00:00.000Z',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatYmd / parseYmdLocal', () => {
  it('formats a local date as YYYY-MM-DD with zero padding', () => {
    expect(formatYmd(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatYmd(new Date(2026, 11, 18))).toBe('2026-12-18')
  })

  it('parses YMD into a local date', () => {
    const d = parseYmdLocal('2026-05-18')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(4)
    expect(d.getDate()).toBe(18)
  })
})

describe('addDaysYmd', () => {
  it.each([
    ['2026-05-18', 1, '2026-05-19'],
    ['2026-05-18', -1, '2026-05-17'],
    ['2026-05-31', 1, '2026-06-01'],
    ['2026-01-01', -1, '2025-12-31'],
  ] as const)('addDaysYmd(%s, %i) → %s', (ymd, delta, expected) => {
    expect(addDaysYmd(ymd, delta)).toBe(expected)
  })
})

describe('mondayOfWeek', () => {
  it.each([
    ['2026-05-11', '2026-05-11'], // Monday
    ['2026-05-13', '2026-05-11'], // Wednesday
    ['2026-05-17', '2026-05-11'], // Sunday
    ['2026-05-18', '2026-05-18'], // Monday
  ] as const)('mondayOfWeek(%s) → %s', (ymd, expectedMonday) => {
    expect(mondayOfWeek(ymd)).toBe(expectedMonday)
  })
})

describe('timeToMinutes', () => {
  it.each([
    ['09:00', 9 * 60],
    ['9:30', 9 * 60 + 30],
    ['00:00', 0],
    ['23:59', 23 * 60 + 59],
  ] as const)('timeToMinutes(%s) → %i', (time, minutes) => {
    expect(timeToMinutes(time)).toBe(minutes)
  })

  it('treats missing time parts as zero', () => {
    expect(timeToMinutes('12')).toBe(12 * 60)
  })
})

describe('bookingDurationMinutes', () => {
  it('returns the reservation duration when positive', () => {
    expect(bookingDurationMinutes(sampleReservation)).toBe(45)
  })

  it.each([
    [0],
    [-30],
    [undefined],
  ] as const)('defaults to 60 minutes when durationMinutes is %s', (durationMinutes) => {
    expect(bookingDurationMinutes({ ...sampleReservation, durationMinutes })).toBe(60)
  })
})

describe('formatPrettyDate', () => {
  it('formats the parsed local date with locale options', () => {
    const spy = vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Mon, May 18, 2026')

    expect(formatPrettyDate('2026-05-18')).toBe('Mon, May 18, 2026')
    expect(spy).toHaveBeenCalledWith(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  })
})

describe('statusBadge', () => {
  it.each([
    ['cancelled', { label: 'Cancelled', variant: 'error' }],
    ['no-show', { label: 'No-show', variant: 'warning' }],
    ['pending', { label: 'To be confirmed', variant: 'warning' }],
    ['confirmed', { label: 'Confirmed', variant: 'success' }],
    ['unknown', { label: 'Confirmed', variant: 'success' }],
  ] as const)('statusBadge(%s)', (status, expected) => {
    expect(statusBadge(status)).toEqual(expected)
  })
})

describe('bookingCardBorderClasses', () => {
  it.each([
    ['cancelled', 'border border-border hover:border-primary'],
    ['no-show', 'border border-border hover:border-primary'],
    ['pending', 'border-2 border-yellow-500 hover:border-yellow-600'],
    ['confirmed', 'border-2 border-green-600 hover:border-green-700'],
    ['unknown', 'border-2 border-green-600 hover:border-green-700'],
  ] as const)('bookingCardBorderClasses(%s)', (status, expected) => {
    expect(bookingCardBorderClasses(status)).toBe(expected)
  })
})

describe('bookingStatusAriaLabel', () => {
  it.each([
    ['cancelled', 'Cancelled'],
    ['no-show', 'No-show'],
    ['pending', 'To be confirmed'],
    ['confirmed', 'Confirmed'],
    ['unknown', 'Confirmed'],
  ] as const)('bookingStatusAriaLabel(%s)', (status, expected) => {
    expect(bookingStatusAriaLabel(status)).toBe(expected)
  })
})
