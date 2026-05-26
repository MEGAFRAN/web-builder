import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('booking-api', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  describe('bookingServicesUrl', () => {
    it('returns the local Next.js route when no remote env is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
      vi.stubEnv('NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT', '')
      vi.stubEnv('CLIENT_ID', 'test')
      const { bookingServicesUrl } = await import('@/lib/booking-api')

      expect(bookingServicesUrl()).toBe('/api/booking-services?clientId=test')
    })

    it('returns the remote Azure Functions URL when NEXT_PUBLIC_BOOKING_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
      vi.stubEnv('CLIENT_ID', 'test')
      const { bookingServicesUrl } = await import('@/lib/booking-api')

      expect(bookingServicesUrl('hair-salon')).toBe(
        'https://fn.example.com/api/booking-services?clientId=hair-salon',
      )
    })

    it('strips a trailing slash from NEXT_PUBLIC_BOOKING_API_URL', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api/')
      const { bookingServicesUrl } = await import('@/lib/booking-api')

      expect(bookingServicesUrl('tenant-one')).toBe(
        'https://fn.example.com/api/booking-services?clientId=tenant-one',
      )
    })

    it('uses NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT when set', async () => {
      vi.stubEnv(
        'NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT',
        'https://fn.example.com/api/booking-services',
      )
      const { bookingServicesUrl } = await import('@/lib/booking-api')

      expect(bookingServicesUrl('tenant-one')).toBe(
        'https://fn.example.com/api/booking-services?clientId=tenant-one',
      )
    })

    it('prefers block override over baked and remote env', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
      vi.stubEnv(
        'NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT',
        'https://fn.example.com/api/booking-services',
      )
      const { bookingServicesUrl } = await import('@/lib/booking-api')

      expect(
        bookingServicesUrl('tenant-one', 'https://override.example.com/catalog'),
      ).toBe('https://override.example.com/catalog?clientId=tenant-one')
    })

    it('omits clientId query when no clientId is available', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
      delete process.env.CLIENT_ID
      const { bookingServicesUrl } = await import('@/lib/booking-api')

      expect(bookingServicesUrl()).toBe('/api/booking-services')
    })
  })

  describe('isRemoteBookingApi', () => {
    it('returns false when no remote env is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
      vi.stubEnv('NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT', '')
      const { isRemoteBookingApi } = await import('@/lib/booking-api')

      expect(isRemoteBookingApi()).toBe(false)
    })

    it('returns true when NEXT_PUBLIC_BOOKING_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
      const { isRemoteBookingApi } = await import('@/lib/booking-api')

      expect(isRemoteBookingApi()).toBe(true)
    })
  })
})
