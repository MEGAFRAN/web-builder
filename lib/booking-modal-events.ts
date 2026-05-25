export const BOOKING_MODAL_OPEN_EVENT = 'wb:open-booking'

export type BookingModalOpenDetail = {
  serviceId?: string | null
}

export function isBookingModalHref(href: string): boolean {
  return href.trim() === '#book'
}

export function dispatchOpenBookingModal(detail: BookingModalOpenDetail = {}): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<BookingModalOpenDetail>(BOOKING_MODAL_OPEN_EVENT, { detail }),
  )
}
