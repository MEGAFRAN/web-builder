/** Admin portal & persisted booking catalog types */

export type ReservationDisplayStatus = 'confirmed' | 'cancelled' | 'no-show'

export type StoredReservation = {
  id: string
  clientId: string
  serviceId?: string
  durationMinutes?: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  notes?: string | null
  /** Widget submissions may use `pending`; admin calendar uses a yellow card border until confirmed. */
  status: string
  createdAt: string
  partySize?: number
  cancelReason?: string | null
}

export type AdminBookingService = {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
  currency: string
}

export type DayCode = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type WeeklyHoursRow = {
  day: DayCode
  open: boolean
  from: string
  to: string
}

export type ScheduleException = {
  id: string
  date: string
  closed: boolean
  from?: string
  to?: string
}

export type BookingScheduleFile = {
  weekly: WeeklyHoursRow[]
  exceptions: ScheduleException[]
}

export type SessionPayload = {
  email: string
  clientId: string
  exp: number
}
