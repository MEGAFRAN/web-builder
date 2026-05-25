import { describe, it, expect } from 'vitest'
import {
  formatAdminVariationSummary,
  formatCatalogServicePriceLabel,
  formatListedPrice,
  mapBookingServiceToCmsService,
  parseBookingCatalogRows,
} from '@/lib/booking-catalog'

describe('booking-catalog', () => {
  it('parseBookingCatalogRows accepts admin catalog rows', () => {
    const rows = parseBookingCatalogRows([
      {
        id: 'svc-1',
        name: 'blower',
        description: 'Blow dry',
        durationMinutes: 60,
        price: 100,
        currency: '€',
        category: 'Styling',
      },
    ])
    expect(rows).toEqual([
      {
        id: 'svc-1',
        name: 'blower',
        description: 'Blow dry',
        durationMinutes: 60,
        price: 100,
        currency: '€',
        category: 'Styling',
      },
    ])
  })

  it('parseBookingCatalogRows accepts services with variations', () => {
    const rows = parseBookingCatalogRows([
      {
        id: 'svc-massage',
        name: 'Swedish Massage',
        description: 'Relaxing massage',
        currency: '€',
        variations: [
          { id: 'var-30', durationMinutes: 30, price: 40 },
          { id: 'var-60', label: 'Standard', durationMinutes: 60, price: 60 },
        ],
      },
    ])
    expect(rows).toEqual([
      {
        id: 'svc-massage',
        name: 'Swedish Massage',
        description: 'Relaxing massage',
        currency: '€',
        variations: [
          { id: 'var-30', durationMinutes: 30, price: 40 },
          { id: 'var-60', label: 'Standard', durationMinutes: 60, price: 60 },
        ],
      },
    ])
  })

  it('parseBookingCatalogRows skips invalid rows', () => {
    expect(parseBookingCatalogRows([{ id: '', name: 'x', durationMinutes: 60, price: 10 }])).toEqual([])
    expect(parseBookingCatalogRows(null)).toEqual([])
    expect(
      parseBookingCatalogRows([
        {
          id: 'svc-invalid',
          name: 'Missing prices',
          description: '',
          currency: '€',
          variations: [{ id: 'var-1', durationMinutes: 0, price: 10 }],
        },
      ]),
    ).toEqual([])
  })

  it('formatListedPrice formats integers without decimals', () => {
    expect(formatListedPrice(100, '€')).toBe('€100')
  })

  it('mapBookingServiceToCmsService maps name, description, duration, price, and category', () => {
    expect(
      mapBookingServiceToCmsService({
        id: 'svc-1',
        name: 'tinturado cabello',
        description: '',
        durationMinutes: 30,
        price: 20,
        currency: '€',
        category: 'Coloración',
      }),
    ).toEqual({
      title: 'tinturado cabello',
      description: '',
      price: '30 min · €20',
      bookingServiceId: 'svc-1',
      category: 'Coloración',
    })
  })

  it('mapBookingServiceToCmsService formats variation services for cards', () => {
    expect(
      mapBookingServiceToCmsService({
        id: 'svc-massage',
        name: 'Swedish Massage',
        description: '',
        currency: '€',
        variations: [
          { id: 'var-30', durationMinutes: 30, price: 40 },
          { id: 'var-90', durationMinutes: 90, price: 80 },
        ],
      }),
    ).toEqual({
      title: 'Swedish Massage',
      description: '',
      price: 'Desde €40 · 30-90 min',
      bookingServiceId: 'svc-massage',
    })
  })

  it('formatAdminVariationSummary joins variation rows for admin cards', () => {
    expect(
      formatAdminVariationSummary(
        [
          { id: 'var-30', durationMinutes: 30, price: 40 },
          { id: 'var-60', durationMinutes: 60, price: 60 },
        ],
        '€',
      ),
    ).toBe('30 min (€40) · 60 min (€60)')
  })

  it('formatCatalogServicePriceLabel handles single-duration variation services', () => {
    expect(
      formatCatalogServicePriceLabel({
        id: 'svc-1',
        name: 'Express',
        currency: '€',
        variations: [{ id: 'var-30', durationMinutes: 30, price: 40 }],
      }),
    ).toBe('Desde €40 · 30 min')
  })
})
