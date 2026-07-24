import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  buildTelemetryPayload,
  getTelemetryEndpoint,
  resolveConversionEventType,
  sendTelemetryEvent,
  shouldSendTelemetryClick,
  TELEMETRY_CLICK_THROTTLE_MS,
} from '@/lib/telemetry'

describe('lib/telemetry', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('getTelemetryEndpoint', () => {
    it('returns null when NEXT_PUBLIC_TELEMETRY_URL is unset', () => {
      vi.stubEnv('NEXT_PUBLIC_TELEMETRY_URL', '')
      expect(getTelemetryEndpoint()).toBeNull()
    })

    it('strips a trailing slash from the endpoint URL', () => {
      vi.stubEnv('NEXT_PUBLIC_TELEMETRY_URL', 'https://fn.example.com/api/telemetry/')
      expect(getTelemetryEndpoint()).toBe('https://fn.example.com/api/telemetry')
    })

    it('returns the endpoint when set without trailing slash', () => {
      vi.stubEnv('NEXT_PUBLIC_TELEMETRY_URL', 'http://localhost:3000/api/telemetry')
      expect(getTelemetryEndpoint()).toBe('http://localhost:3000/api/telemetry')
    })
  })

  describe('resolveConversionEventType', () => {
    it.each([
      ['tel:+34123456789', 'click_phone'],
      ['TEL:123', 'click_phone'],
      ['https://wa.me/34123456789', 'click_whatsapp'],
      ['https://api.whatsapp.com/send?phone=123', 'click_whatsapp'],
      ['https://wa.link/abc', 'click_whatsapp'],
    ] as const)('maps %s to %s', (href, expected) => {
      expect(resolveConversionEventType(href)).toBe(expected)
    })

    it.each([
      'mailto:hello@example.com',
      'https://example.com',
      '/contact',
      '',
    ])('returns null for non-conversion href %s', (href) => {
      expect(resolveConversionEventType(href)).toBeNull()
    })
  })

  describe('buildTelemetryPayload', () => {
    it('builds JSON with site_id, event_type, and ISO timestamp', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-24T12:00:00.000Z'))

      const payload = JSON.parse(buildTelemetryPayload('tenant-1', 'click_phone')) as {
        site_id: string
        event_type: string
        timestamp: string
      }

      expect(payload).toEqual({
        site_id: 'tenant-1',
        event_type: 'click_phone',
        timestamp: '2026-07-24T12:00:00.000Z',
      })

      vi.useRealTimers()
    })
  })

  describe('shouldSendTelemetryClick', () => {
    it('allows the first click on a href', () => {
      const lastByHref = new Map<string, number>()
      expect(shouldSendTelemetryClick('tel:+34111222333', 1000, lastByHref)).toBe(true)
      expect(lastByHref.get('tel:+34111222333')).toBe(1000)
    })

    it('blocks duplicate clicks within the throttle window', () => {
      const lastByHref = new Map<string, number>()
      expect(shouldSendTelemetryClick('tel:+34111222333', 1000, lastByHref)).toBe(true)
      expect(shouldSendTelemetryClick('tel:+34111222333', 1500, lastByHref)).toBe(false)
    })

    it('allows a click after the throttle window expires', () => {
      const lastByHref = new Map<string, number>()
      expect(shouldSendTelemetryClick('tel:+34111222333', 1000, lastByHref)).toBe(true)
      expect(
        shouldSendTelemetryClick(
          'tel:+34111222333',
          1000 + TELEMETRY_CLICK_THROTTLE_MS,
          lastByHref,
        ),
      ).toBe(true)
    })

    it('throttles hrefs independently', () => {
      const lastByHref = new Map<string, number>()
      expect(shouldSendTelemetryClick('tel:+34111222333', 1000, lastByHref)).toBe(true)
      expect(shouldSendTelemetryClick('https://wa.me/34111222333', 1000, lastByHref)).toBe(true)
    })
  })

  describe('sendTelemetryEvent', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    })

    it('uses sendBeacon when available', () => {
      const sendBeacon = vi.fn().mockReturnValue(true)
      vi.stubGlobal('navigator', { sendBeacon })

      sendTelemetryEvent('http://localhost/api/telemetry', '{"ok":true}')

      expect(sendBeacon).toHaveBeenCalledWith('http://localhost/api/telemetry', '{"ok":true}')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('falls back to fetch with keepalive when sendBeacon is unavailable', () => {
      vi.stubGlobal('navigator', {})

      sendTelemetryEvent('http://localhost/api/telemetry', '{"ok":true}')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost/api/telemetry',
        expect.objectContaining({
          method: 'POST',
          body: '{"ok":true}',
          keepalive: true,
        }),
      )
    })

    it('falls back to fetch when sendBeacon returns false', () => {
      vi.stubGlobal('navigator', { sendBeacon: vi.fn().mockReturnValue(false) })

      sendTelemetryEvent('http://localhost/api/telemetry', '{"ok":true}')

      expect(fetch).toHaveBeenCalled()
    })

    it('swallows network errors silently', () => {
      vi.stubGlobal('navigator', {})
      vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'))

      expect(() =>
        sendTelemetryEvent('http://localhost/api/telemetry', '{"ok":true}'),
      ).not.toThrow()
    })
  })
})
