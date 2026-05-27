export type ReservationGuarantee = {
  paymentMethodId: string
  customerId?: string | null
  status: 'vaulted'
}

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
  status: string
  createdAt: string
  partySize?: number
  cancelReason?: string | null
  guarantee?: ReservationGuarantee | null
}

export type ServiceVariation = {
  id: string
  label?: string
  durationMinutes: number
  price: number
}

export type AdminBookingService = {
  id: string
  name: string
  description: string
  durationMinutes?: number
  price?: number
  currency: string
  category?: string
  variations?: ServiceVariation[]
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
