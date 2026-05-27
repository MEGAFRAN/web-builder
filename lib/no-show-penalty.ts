import type { BookingSettings } from '@/types/cms'
import type { AdminBookingService, StoredReservation } from '@/types/admin'
import { formatListedPrice } from '@/lib/booking-catalog'
import { toStripeCurrency } from '@/lib/stripe-currency'

export const DEFAULT_NO_SHOW_PENALTY_PERCENT = 50

export function noShowPenaltyPercent(settings?: BookingSettings | null): number {
  const configured = settings?.cancellationFeePercent
  if (configured == null || configured <= 0) return DEFAULT_NO_SHOW_PENALTY_PERCENT
  return Math.min(100, configured)
}

/** Resolves the booked service list price from catalog + reservation duration. */
export function resolveBookedServicePrice(
  reservation: Pick<StoredReservation, 'serviceId' | 'durationMinutes'>,
  services: AdminBookingService[],
): number | null {
  if (!reservation.serviceId?.trim()) return null
  const svc = services.find((s) => s.id === reservation.serviceId)
  if (!svc) return null

  if (svc.variations?.length && reservation.durationMinutes != null) {
    const match = svc.variations.find(
      (v) => v.durationMinutes === reservation.durationMinutes,
    )
    if (match && match.price >= 0) return match.price
  }

  if (typeof svc.price === 'number' && svc.price >= 0) return svc.price
  const firstVariation = svc.variations?.[0]
  if (firstVariation && firstVariation.price >= 0) return firstVariation.price
  return null
}

export function computeNoShowPenaltyAmount(
  servicePrice: number,
  settings?: BookingSettings | null,
): number {
  const percent = noShowPenaltyPercent(settings)
  const penalty = servicePrice * (percent / 100)
  return Math.round(penalty * 100) / 100
}

export function resolveNoShowCharge(params: {
  reservation: Pick<StoredReservation, 'serviceId' | 'durationMinutes'>
  services: AdminBookingService[]
  settings?: BookingSettings | null
}): { amount: number; currency: string; servicePrice: number } | { error: string } {
  const svc = params.services.find((s) => s.id === params.reservation.serviceId)
  const currency = toStripeCurrency(svc?.currency ?? params.settings?.currency ?? 'EUR')
  const servicePrice = resolveBookedServicePrice(params.reservation, params.services)
  if (servicePrice == null || servicePrice <= 0) {
    return { error: 'Could not resolve the booked service price.' }
  }
  const amount = computeNoShowPenaltyAmount(servicePrice, params.settings)
  if (amount <= 0) {
    return { error: 'No-show penalty amount is zero.' }
  }
  return { amount, currency, servicePrice }
}

export function guaranteePenaltyLabel(
  settings: BookingSettings,
  servicePrice?: number | null,
): string {
  const percent = noShowPenaltyPercent(settings)
  const currency = settings.currency ?? 'EUR'
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€'
  if (servicePrice != null && servicePrice > 0) {
    const fee = computeNoShowPenaltyAmount(servicePrice, settings)
    return `${percent}% del servicio (${formatListedPrice(servicePrice, symbol)}) — ${formatListedPrice(fee, symbol)} si no-show`
  }
  return `${percent}% del precio del servicio reservado si no asistes`
}
