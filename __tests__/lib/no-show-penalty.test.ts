import { describe, expect, it } from 'vitest'
import {
  computeNoShowPenaltyAmount,
  resolveBookedServicePrice,
  resolveNoShowCharge,
} from '@/lib/no-show-penalty'
import type { AdminBookingService } from '@/types/admin'

const services: AdminBookingService[] = [
  {
    id: 'cut',
    name: 'Cut',
    description: '',
    price: 100,
    durationMinutes: 60,
    currency: 'EUR',
  },
  {
    id: 'color',
    name: 'Color',
    description: '',
    currency: 'EUR',
    variations: [
      { id: 'short', durationMinutes: 45, price: 80 },
      { id: 'long', durationMinutes: 90, price: 120 },
    ],
  },
]

describe('no-show penalty', () => {
  it('charges 50% of service price by default', () => {
    expect(computeNoShowPenaltyAmount(100, { enforceGuarantee: true })).toBe(50)
    expect(computeNoShowPenaltyAmount(100, { enforceGuarantee: true, cancellationFeePercent: 50 })).toBe(50)
  })

  it('resolves price from service catalog', () => {
    expect(
      resolveBookedServicePrice(
        { serviceId: 'cut', durationMinutes: 60 },
        services,
      ),
    ).toBe(100)
    expect(
      resolveBookedServicePrice(
        { serviceId: 'color', durationMinutes: 90 },
        services,
      ),
    ).toBe(120)
  })

  it('resolveNoShowCharge returns half of booked price', () => {
    const result = resolveNoShowCharge({
      reservation: { serviceId: 'cut', durationMinutes: 60 },
      services,
      settings: { enforceGuarantee: true, currency: 'EUR' },
    })
    expect(result).toEqual({ amount: 50, currency: 'eur', servicePrice: 100 })
  })

  it('resolveNoShowCharge maps display currency symbols to Stripe ISO codes', () => {
    const result = resolveNoShowCharge({
      reservation: { serviceId: 'cut', durationMinutes: 60 },
      services: [{ ...services[0], currency: '€' }],
      settings: { enforceGuarantee: true, currency: 'EUR' },
    })
    expect(result).toEqual({ amount: 50, currency: 'eur', servicePrice: 100 })
  })
})
