import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ConversionTelemetry } from '@/components/analytics/ConversionTelemetry'
import * as telemetry from '@/lib/telemetry'

vi.mock('@/lib/telemetry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/telemetry')>()
  return {
    ...actual,
    getTelemetryEndpoint: vi.fn(),
    sendTelemetryEvent: vi.fn(),
    buildTelemetryPayload: vi.fn(),
  }
})

const mockGetEndpoint = vi.mocked(telemetry.getTelemetryEndpoint)
const mockSend = vi.mocked(telemetry.sendTelemetryEvent)
const mockBuildPayload = vi.mocked(telemetry.buildTelemetryPayload)

describe('ConversionTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_CLIENT_ID', 'test-site')
    mockBuildPayload.mockReturnValue('{"site_id":"test-site","event_type":"click_phone"}')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders nothing and does not attach a click listener when endpoint is unset', () => {
    mockGetEndpoint.mockReturnValue(null)
    const addSpy = vi.spyOn(document, 'addEventListener')

    const { container } = render(<ConversionTelemetry />)
    expect(container).toBeEmptyDOMElement()
    expect(addSpy.mock.calls.some(([event]) => event === 'click')).toBe(false)
    addSpy.mockRestore()
  })

  it('fires telemetry on tel: link clicks via delegated capture listener', () => {
    mockGetEndpoint.mockReturnValue('http://localhost:3000/api/telemetry')

    render(
      <>
        <ConversionTelemetry />
        <a href="tel:+34111222333">Call</a>
      </>,
    )

    fireEvent.click(document.querySelector('a[href^="tel:"]')!)

    expect(mockBuildPayload).toHaveBeenCalledWith('test-site', 'click_phone')
    expect(mockSend).toHaveBeenCalledWith(
      'http://localhost:3000/api/telemetry',
      '{"site_id":"test-site","event_type":"click_phone"}',
    )
  })

  it('fires click_whatsapp for WhatsApp links', () => {
    mockGetEndpoint.mockReturnValue('http://localhost:3000/api/telemetry')
    mockBuildPayload.mockReturnValue('{"site_id":"test-site","event_type":"click_whatsapp"}')

    render(
      <>
        <ConversionTelemetry />
        <a href="https://wa.me/34111222333">WhatsApp</a>
      </>,
    )

    fireEvent.click(document.querySelector('a[href*="wa.me"]')!)

    expect(mockBuildPayload).toHaveBeenCalledWith('test-site', 'click_whatsapp')
    expect(mockSend).toHaveBeenCalled()
  })

  it('does not fire telemetry for non-conversion links', () => {
    mockGetEndpoint.mockReturnValue('http://localhost:3000/api/telemetry')

    render(
      <>
        <ConversionTelemetry />
        <a href="mailto:hello@example.com">Email</a>
      </>,
    )

    fireEvent.click(document.querySelector('a[href^="mailto:"]')!)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('sends telemetry only once for rapid clicks on the same conversion link', () => {
    mockGetEndpoint.mockReturnValue('http://localhost:3000/api/telemetry')

    render(
      <>
        <ConversionTelemetry />
        <a href="tel:+34111222333">Call</a>
      </>,
    )

    const link = document.querySelector('a[href^="tel:"]')!
    for (let i = 0; i < 100; i += 1) {
      fireEvent.click(link)
    }

    expect(mockSend).toHaveBeenCalledTimes(1)
  })

  it('sends telemetry again after the throttle window expires', () => {
    vi.useFakeTimers()
    mockGetEndpoint.mockReturnValue('http://localhost:3000/api/telemetry')

    render(
      <>
        <ConversionTelemetry />
        <a href="tel:+34111222333">Call</a>
      </>,
    )

    const link = document.querySelector('a[href^="tel:"]')!
    fireEvent.click(link)
    vi.advanceTimersByTime(2001)
    fireEvent.click(link)

    expect(mockSend).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('sends telemetry for distinct conversion links clicked in quick succession', () => {
    mockGetEndpoint.mockReturnValue('http://localhost:3000/api/telemetry')

    render(
      <>
        <ConversionTelemetry />
        <a href="tel:+34111222333">Call</a>
        <a href="https://wa.me/34999888777">WhatsApp</a>
      </>,
    )

    fireEvent.click(document.querySelector('a[href^="tel:"]')!)
    fireEvent.click(document.querySelector('a[href*="wa.me"]')!)

    expect(mockSend).toHaveBeenCalledTimes(2)
  })
})
