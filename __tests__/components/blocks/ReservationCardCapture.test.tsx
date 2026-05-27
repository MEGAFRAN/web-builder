import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import type { BookingSettings } from '@/types/cms'
import type { SetupIntentResponse } from '@/types/booking'
import { BOOKING_COPY } from '@/lib/booking-public-copy'
import {
  MOCK_PAYMENT_METHOD_ID,
  MOCK_STRIPE_CUSTOMER_ID,
} from '@/lib/booking-stripe'

const mockIsMockBookingStripe = vi.hoisted(() => vi.fn(() => false))
const mockLoadStripe = vi.hoisted(() => vi.fn())
const mockUseStripe = vi.hoisted(() => vi.fn())
const mockUseElements = vi.hoisted(() => vi.fn())
const mockConfirmSetup = vi.hoisted(() => vi.fn())

vi.mock('@/lib/booking-stripe', () => ({
  MOCK_PAYMENT_METHOD_ID: 'pm_mock_local_12345',
  MOCK_STRIPE_CUSTOMER_ID: 'cus_mock_local_dev',
  isMockBookingStripe: () => mockIsMockBookingStripe(),
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: (...args: unknown[]) => mockLoadStripe(...args),
}))

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => mockUseStripe(),
  useElements: () => mockUseElements(),
}))

import ReservationCardCapture, {
  type CardCaptureHandlers,
} from '@/components/blocks/ReservationCardCapture'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BOOKING_SETTINGS: BookingSettings = {
  enforceGuarantee: true,
  cancellationFeePercent: 50,
  currency: 'EUR',
}

type OnHandlersChangeMock = ReturnType<
  typeof vi.fn<(handlers: CardCaptureHandlers | null) => void>
>

const SETUP_INTENT: SetupIntentResponse = {
  mock: false,
  clientSecret: 'seti_test_secret',
  customerId: 'cus_test_123',
  publishableKey: 'pk_test_abc',
  stripeAccountId: 'acct_connect_1',
}

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as Response
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderCardCapture(
  overrides: Partial<{
    clientId: string
    email: string
    bookingSettings: BookingSettings
    servicePrice: number | null
    onHandlersChange: OnHandlersChangeMock
  }> = {},
) {
  const onHandlersChange =
    overrides.onHandlersChange ?? vi.fn<(handlers: CardCaptureHandlers | null) => void>()
  const view = render(
    <ReservationCardCapture
      clientId="client-a"
      email=""
      bookingSettings={BOOKING_SETTINGS}
      {...overrides}
      onHandlersChange={onHandlersChange}
    />,
  )
  return { onHandlersChange, ...view }
}

function lastRegisteredHandlers(mock: OnHandlersChangeMock): CardCaptureHandlers {
  const handlers = mock.mock.calls.at(-1)?.[0]
  if (!handlers) throw new Error('expected card capture handlers')
  return handlers
}

/** Component debounces valid email by 400ms before fetching setup intent. */
async function flushDebounceAndFetch() {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 450))
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ReservationCardCapture', { timeout: 15_000 }, () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockIsMockBookingStripe.mockReturnValue(false)
    mockLoadStripe.mockResolvedValue({ id: 'stripe-instance' })
    mockUseStripe.mockReturnValue({
      confirmSetup: mockConfirmSetup,
    })
    mockUseElements.mockReturnValue({ id: 'elements-instance' })
    mockConfirmSetup.mockResolvedValue({
      setupIntent: { payment_method: 'pm_from_stripe' },
    })
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.clearAllMocks()
  })

  describe('static copy', () => {
    it('renders guarantee title, intro, and fee label', () => {
      renderCardCapture()
      expect(screen.getByText(BOOKING_COPY.cardGuaranteeTitle)).toBeInTheDocument()
      expect(screen.getByText(BOOKING_COPY.cardGuaranteeIntro)).toBeInTheDocument()
      expect(
        screen.getByText(/50% del precio del servicio reservado si no asistes/i),
      ).toBeInTheDocument()
    })

    it('shows estimated penalty when servicePrice is provided', () => {
      renderCardCapture({ servicePrice: 100 })
      expect(
        screen.getByText(/50% del servicio \(€100\) — €50 si no-show/i),
      ).toBeInTheDocument()
    })
  })

  describe('mock Stripe mode', () => {
    beforeEach(() => {
      mockIsMockBookingStripe.mockReturnValue(true)
    })

    it('shows the local mock note instead of fetching setup intent', async () => {
      renderCardCapture({ email: 'guest@example.com' })
      expect(screen.getByText(BOOKING_COPY.cardMockNote)).toBeInTheDocument()
      await flushDebounceAndFetch()
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('registers ready handlers with mock customer and payment method', async () => {
      const { onHandlersChange } = renderCardCapture({ email: 'guest@example.com' })
      expect(onHandlersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          ready: true,
          customerId: MOCK_STRIPE_CUSTOMER_ID,
        }),
      )
      const result = await lastRegisteredHandlers(onHandlersChange).confirmSetup()
      expect(result).toEqual({
        paymentMethodId: MOCK_PAYMENT_METHOD_ID,
        customerId: MOCK_STRIPE_CUSTOMER_ID,
      })
    })

    it('clears handlers on unmount', () => {
      const { onHandlersChange, unmount } = renderCardCapture()
      expect(onHandlersChange).toHaveBeenCalled()
      unmount()
      expect(onHandlersChange).toHaveBeenCalledWith(null)
    })
  })

  describe('setup intent fetch', () => {
    it('shows card required prompt when email is invalid', async () => {
      renderCardCapture({ email: 'not-an-email' })
      await flushDebounceAndFetch()
      expect(screen.getByText(BOOKING_COPY.cardRequired)).toBeInTheDocument()
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('shows card required prompt when email is empty', () => {
      renderCardCapture({ email: '' })
      expect(screen.getByText(BOOKING_COPY.cardRequired)).toBeInTheDocument()
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('debounces email before fetching setup intent', async () => {
      vi.useFakeTimers()
      try {
        fetchSpy.mockResolvedValue(jsonResponse(SETUP_INTENT))
        renderCardCapture({ email: 'a@b.com' })

        await act(async () => {
          vi.advanceTimersByTime(200)
        })
        expect(fetchSpy).not.toHaveBeenCalled()

        await act(async () => {
          vi.advanceTimersByTime(200)
          await Promise.resolve()
          await Promise.resolve()
        })

        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/setup-intent?clientId=client-a&email=a%40b.com',
        )
      } finally {
        vi.useRealTimers()
      }
    })

    it('trims email in the setup intent request', async () => {
      fetchSpy.mockResolvedValue(jsonResponse(SETUP_INTENT))
      renderCardCapture({ email: '  guest@example.com  ' })
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.stringContaining('email=guest%40example.com'),
        )
      })
    })

    it('shows loading copy while setup intent is in flight', async () => {
      fetchSpy.mockImplementation(() => new Promise(() => {}))
      renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      expect(screen.getByText(BOOKING_COPY.cardLoading)).toBeInTheDocument()
    })

    it('shows API error message when setup intent returns non-OK', async () => {
      fetchSpy.mockResolvedValue(
        jsonResponse({ error: 'Stripe not connected' }, false),
      )
      renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Stripe not connected')
      })
      expect(screen.queryByTestId('stripe-elements')).not.toBeInTheDocument()
    })

    it('shows generic card error when response JSON cannot be parsed', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => {
          throw new SyntaxError('invalid json')
        },
      } as unknown as Response)
      renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(BOOKING_COPY.cardError)
      })
    })

    it('shows network error message when fetch rejects', async () => {
      fetchSpy.mockRejectedValue(new Error('Network down'))
      renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network down')
      })
    })

    it('renders Stripe Elements after a successful setup intent', async () => {
      fetchSpy.mockResolvedValue(jsonResponse(SETUP_INTENT))
      renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument()
        expect(screen.getByTestId('payment-element')).toBeInTheDocument()
      })
      expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_abc', {
        stripeAccount: 'acct_connect_1',
      })
    })

    it('loads Stripe without connected account when stripeAccountId is omitted', async () => {
      fetchSpy.mockResolvedValue(
        jsonResponse({ ...SETUP_INTENT, stripeAccountId: null }),
      )
      renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_abc', undefined)
      })
    })
  })

  describe('Stripe card form handlers', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue(jsonResponse(SETUP_INTENT))
    })

    it('exposes confirmSetup after Stripe.js is ready', async () => {
      const { onHandlersChange } = renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(onHandlersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            ready: true,
            customerId: 'cus_test_123',
          }),
        )
      })

      const result = await lastRegisteredHandlers(onHandlersChange).confirmSetup()
      expect(mockConfirmSetup).toHaveBeenCalledWith({
        elements: { id: 'elements-instance' },
        redirect: 'if_required',
      })
      expect(result).toEqual({
        paymentMethodId: 'pm_from_stripe',
        customerId: 'cus_test_123',
      })
    })

    it('confirmSetup resolves payment method id from object-shaped payment_method', async () => {
      mockConfirmSetup.mockResolvedValue({
        setupIntent: { payment_method: { id: 'pm_object_shape' } },
      })
      const { onHandlersChange } = renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()
      await waitFor(() => expect(onHandlersChange).toHaveBeenCalled())

      const result = await lastRegisteredHandlers(onHandlersChange).confirmSetup()
      expect(result.paymentMethodId).toBe('pm_object_shape')
    })

    it('confirmSetup throws Stripe error message', async () => {
      mockConfirmSetup.mockResolvedValue({
        error: { message: 'Card declined' },
      })
      const { onHandlersChange } = renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      await waitFor(() => expect(onHandlersChange).toHaveBeenCalled())
      await expect(lastRegisteredHandlers(onHandlersChange).confirmSetup()).rejects.toThrow(
        'Card declined',
      )
    })

    it('confirmSetup throws generic error when Stripe is not ready', async () => {
      mockUseStripe.mockReturnValue(null)
      mockUseElements.mockReturnValue(null)
      const { onHandlersChange } = renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument()
      })
      expect(onHandlersChange).toHaveBeenCalledWith(null)
    })

    it('refetches setup intent when email changes', async () => {
      const { rerender } = renderCardCapture({ email: 'guest@example.com' })
      await flushDebounceAndFetch()
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

      fetchSpy.mockClear()
      rerender(
        <ReservationCardCapture
          clientId="client-a"
          email="other@example.com"
          bookingSettings={BOOKING_SETTINGS}
          onHandlersChange={vi.fn()}
        />,
      )
      await flushDebounceAndFetch()

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.stringContaining('email=other%40example.com'),
        )
      })
    })
  })
})
