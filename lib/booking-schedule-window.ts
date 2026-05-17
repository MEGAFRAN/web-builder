import type { BookingScheduleFile } from '@/types/admin'
import {
  dayCodeFromYmd,
  exceptionForDate,
  parseHm,
} from '@/lib/booking-schedule-utils'

/** `null` means closed entire day */
export function resolveDayMinutesWindow(
  schedule: BookingScheduleFile,
  dateYmd: string,
): { openMin: number; closeMin: number } | null {
  const ex = exceptionForDate(schedule.exceptions, dateYmd)
  if (ex?.closed) {
    return null
  }
  if (ex && !ex.closed && ex.from && ex.to) {
    const a = parseHm(ex.from)
    const b = parseHm(ex.to)
    if (a === null || b === null || b <= a) return null
    return { openMin: a, closeMin: b }
  }

  const code = dayCodeFromYmd(dateYmd)
  const row = schedule.weekly.find((w) => w.day === code)
  if (!row || !row.open) {
    return null
  }
  const openMin = parseHm(row.from)
  const closeMin = parseHm(row.to)
  if (openMin === null || closeMin === null || closeMin <= openMin) {
    return null
  }
  return { openMin, closeMin }
}

/** Slot start + duration must fit entirely inside the working window */
export function slotFitsScheduleWindow(
  schedule: BookingScheduleFile,
  dateYmd: string,
  slotStartMinutes: number,
  durationMinutes: number,
): boolean {
  const win = resolveDayMinutesWindow(schedule, dateYmd)
  if (!win) return false
  return slotStartMinutes >= win.openMin && slotStartMinutes + durationMinutes <= win.closeMin
}
