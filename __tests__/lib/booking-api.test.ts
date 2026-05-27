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
      vi.stubEnv('NEXT_PUBLIC_CLIENT_ID', 'test')
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
      vi.stubEnv('NEXT_PUBLIC_CLIENT_ID', '')
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

  describe('availabilityUrl', () => {
    it('returns the local route when no remote env is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
      const { availabilityUrl } = await import('@/lib/booking-api')

      expect(availabilityUrl()).toBe('/api/availability')
    })

    it('returns the remote Azure Functions URL when NEXT_PUBLIC_BOOKING_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
      const { availabilityUrl } = await import('@/lib/booking-api')

      expect(availabilityUrl()).toBe('https://fn.example.com/api/availability')
    })

    it('prefers block override over remote env', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
      const { availabilityUrl } = await import('@/lib/booking-api')

      expect(availabilityUrl('test', 'https://override.example.com/slots')).toBe(
        'https://override.example.com/slots',
      )
    })
  })

  describe('reservationUrl', () => {
    it('returns the local route when no remote env is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
      const { reservationUrl } = await import('@/lib/booking-api')

      expect(reservationUrl()).toBe('/api/reservation')
    })

    it('returns the remote Azure Functions URL when NEXT_PUBLIC_BOOKING_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
      const { reservationUrl } = await import('@/lib/booking-api')

      expect(reservationUrl()).toBe('https://fn.example.com/api/reservations')
    })

    it('uses text/plain for remote reservation POST to skip CORS preflight', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
      const { reservationPostHeaders } = await import('@/lib/booking-api')

      expect(reservationPostHeaders()).toEqual({
        'Content-Type': 'text/plain;charset=UTF-8',
      })
    })

    it('uses application/json for local reservation POST', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
      const { reservationPostHeaders } = await import('@/lib/booking-api')

      expect(reservationPostHeaders()).toEqual({ 'Content-Type': 'application/json' })
    })
  })

  describe('bookingSettingsUrl', () => {
    it('returns the local route when no remote env is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
      vi.stubEnv('NEXT_PUBLIC_CLIENT_ID', 'test')
      const { bookingSettingsUrl } = await import('@/lib/booking-api')

      expect(bookingSettingsUrl()).toBe('/api/booking-settings?clientId=test')
    })

    it('returns the remote Azure Functions URL when NEXT_PUBLIC_BOOKING_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
      const { bookingSettingsUrl } = await import('@/lib/booking-api')

      expect(bookingSettingsUrl('tenant-one')).toBe(
        'https://fn.example.com/api/booking-settings?clientId=tenant-one',
      )
    })
  })

  describe('setupIntentUrl', () => {
    it('returns the local route when no remote env is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
      vi.stubEnv('NEXT_PUBLIC_CLIENT_ID', 'test')
      const { setupIntentUrl } = await import('@/lib/booking-api')

      expect(setupIntentUrl()).toBe('/api/setup-intent?clientId=test')
    })
  })
})
