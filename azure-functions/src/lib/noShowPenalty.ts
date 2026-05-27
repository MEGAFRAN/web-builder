import type { AdminBookingService, StoredReservation } from '../types/admin'
import { toStripeCurrency } from './stripeCurrency'

export type TenantBookingSettings = {
  enforceGuarantee: boolean
  cancellationFeePercent?: number
  currency?: 'USD' | 'EUR' | 'GBP'
}

export const DEFAULT_NO_SHOW_PENALTY_PERCENT = 50

export function noShowPenaltyPercent(settings?: TenantBookingSettings | null): number {
  const configured = settings?.cancellationFeePercent
  if (configured == null || configured <= 0) return DEFAULT_NO_SHOW_PENALTY_PERCENT
  return Math.min(100, configured)
}

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
  settings?: TenantBookingSettings | null,
): number {
  const percent = noShowPenaltyPercent(settings)
  return Math.round(servicePrice * (percent / 100) * 100) / 100
}

export function resolveNoShowCharge(params: {
  reservation: Pick<StoredReservation, 'serviceId' | 'durationMinutes'>
  services: AdminBookingService[]
  settings?: TenantBookingSettings | null
}): { amount: number; currency: string } | { error: string } {
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
  return { amount, currency }
}
