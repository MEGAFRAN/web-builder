import { promises as fs } from 'fs'
import path from 'path'
import type { BookingScheduleFile, WeeklyHoursRow } from '@/types/admin'

const SCHEDULE_PATH = path.join(process.cwd(), 'data', 'booking-schedule-local.json')

export const DEFAULT_WEEKLY: WeeklyHoursRow[] = [
  { day: 'mon', open: true, from: '09:00', to: '21:00' },
  { day: 'tue', open: true, from: '09:00', to: '21:00' },
  { day: 'wed', open: true, from: '09:00', to: '21:00' },
  { day: 'thu', open: true, from: '09:00', to: '21:00' },
  { day: 'fri', open: true, from: '09:00', to: '21:00' },
  { day: 'sat', open: true, from: '09:00', to: '21:00' },
  { day: 'sun', open: false, from: '09:00', to: '18:00' },
]

export async function readBookingSchedule(): Promise<BookingScheduleFile> {
  try {
    const raw = await fs.readFile(SCHEDULE_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as BookingScheduleFile
    const weekly = Array.isArray(parsed?.weekly) ? parsed.weekly : DEFAULT_WEEKLY
    const exceptions = Array.isArray(parsed?.exceptions) ? parsed.exceptions : []
    return { weekly, exceptions }
  } catch {
    return { weekly: DEFAULT_WEEKLY, exceptions: [] }
  }
}

export async function writeBookingSchedule(file: BookingScheduleFile): Promise<void> {
  await fs.writeFile(SCHEDULE_PATH, JSON.stringify(file, null, 2))
}
