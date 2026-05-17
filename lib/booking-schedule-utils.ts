import type { ScheduleException } from '@/types/admin'

/** Maps JS `Date#getDay()` (0 Sun … 6 Sat) via noon-local anchor date string `YYYY-MM-DD`. */
export function weekdayIndexMonSun(dateYmd: string): number {
  const d = new Date(`${dateYmd}T12:00:00`)
  const sun0 = d.getDay()
  return sun0 === 0 ? 6 : sun0 - 1
}

export function dayCodeFromYmd(dateYmd: string): import('@/types/admin').DayCode {
  const idx = weekdayIndexMonSun(dateYmd)
  const codes: import('@/types/admin').DayCode[] = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
  ]
  return codes[idx]
}

export function exceptionForDate(
  exceptions: ScheduleException[],
  dateYmd: string,
): ScheduleException | undefined {
  return exceptions.find((e) => e.date === dateYmd)
}

/** Minutes from midnight for HH:mm */
export function parseHm(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null
  return h * 60 + min
}
