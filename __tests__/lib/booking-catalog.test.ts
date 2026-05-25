import { describe, it, expect } from 'vitest'
import {
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
      },
    ])
  })

  it('parseBookingCatalogRows skips invalid rows', () => {
    expect(parseBookingCatalogRows([{ id: '', name: 'x', durationMinutes: 60, price: 10 }])).toEqual([])
    expect(parseBookingCatalogRows(null)).toEqual([])
  })

  it('formatListedPrice formats integers without decimals', () => {
    expect(formatListedPrice(100, '€')).toBe('€100')
  })

  it('mapBookingServiceToCmsService maps name, description, duration, and price', () => {
    expect(
      mapBookingServiceToCmsService({
        id: 'svc-1',
        name: 'tinturado cabello',
        description: '',
        durationMinutes: 30,
        price: 20,
        currency: '€',
      }),
    ).toEqual({
      title: 'tinturado cabello',
      description: '',
      price: '30 min · €20',
      bookingServiceId: 'svc-1',
    })
  })
})
