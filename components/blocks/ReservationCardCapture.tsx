'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { BookingSettings } from '@/types/cms'
import type { SetupIntentResponse } from '@/types/booking'
import { setupIntentUrl } from '@/lib/booking-api'
import { guaranteePenaltyLabel } from '@/lib/booking-guarantee'
import { BOOKING_COPY } from '@/lib/booking-public-copy'
import {
  MOCK_PAYMENT_METHOD_ID,
  MOCK_STRIPE_CUSTOMER_ID,
  isMockBookingStripe,
} from '@/lib/booking-stripe'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SETUP_INTENT_DEBOUNCE_MS = 400

function isValidBookingEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export type CardCaptureHandlers = {
  ready: boolean
  customerId: string | null
  confirmSetup: () => Promise<{ paymentMethodId: string; customerId: string | null }>
}

type ReservationCardCaptureProps = {
  clientId: string
  email: string
  bookingSettings: BookingSettings
  /** Booked service list price — used to show estimated 50% no-show penalty. */
  servicePrice?: number | null
  onHandlersChange: (handlers: CardCaptureHandlers | null) => void
}

function StripeCardForm({
  customerId,
  onHandlersChange,
}: {
  customerId: string
  onHandlersChange: (handlers: CardCaptureHandlers | null) => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  const confirmSetup = useCallback(async () => {
    if (!stripe || !elements) {
      throw new Error(BOOKING_COPY.cardError)
    }
    const result = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    })
    if (result.error) {
      throw new Error(result.error.message ?? BOOKING_COPY.cardError)
    }
    const paymentMethodId =
      typeof result.setupIntent?.payment_method === 'string'
        ? result.setupIntent.payment_method
        : result.setupIntent?.payment_method?.id
    if (!paymentMethodId) {
      throw new Error(BOOKING_COPY.cardError)
    }
    return { paymentMethodId, customerId }
  }, [stripe, elements, customerId])

  useEffect(() => {
    if (!stripe || !elements) {
      onHandlersChange(null)
      return
    }
    onHandlersChange({
      ready: true,
      customerId,
      confirmSetup,
    })
    return () => onHandlersChange(null)
  }, [stripe, elements, customerId, confirmSetup, onHandlersChange])

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <PaymentElement />
    </div>
  )
}

export default function ReservationCardCapture({
  clientId,
  email,
  bookingSettings,
  servicePrice,
  onHandlersChange,
}: ReservationCardCaptureProps) {
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [intent, setIntent] = useState<SetupIntentResponse | null>(null)
  const [intentEmail, setIntentEmail] = useState<string | null>(null)
  const [debouncedEmail, setDebouncedEmail] = useState('')
  const mockMode = isMockBookingStripe()
  const feeLabel = guaranteePenaltyLabel(bookingSettings, servicePrice)
  const trimmedEmail = email.trim()
  const isValidEmail = isValidBookingEmail(trimmedEmail)
  const effectiveDebouncedEmail = isValidEmail ? debouncedEmail : ''
  const shouldFetchIntent = !mockMode && effectiveDebouncedEmail.length > 0

  useEffect(() => {
    if (!isValidEmail) return
    const timer = window.setTimeout(() => {
      setDebouncedEmail(trimmedEmail)
    }, SETUP_INTENT_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [email, isValidEmail, trimmedEmail])

  useEffect(() => {
    if (mockMode) {
      onHandlersChange({
        ready: true,
        customerId: MOCK_STRIPE_CUSTOMER_ID,
        confirmSetup: async () => ({
          paymentMethodId: MOCK_PAYMENT_METHOD_ID,
          customerId: MOCK_STRIPE_CUSTOMER_ID,
        }),
      })
      return () => onHandlersChange(null)
    }
    onHandlersChange(null)
  }, [mockMode, onHandlersChange])

  useEffect(() => {
    if (!shouldFetchIntent) return

    const signal = { cancelled: false }
    queueMicrotask(() => {
      void (async () => {
        setLoading(true)
        setLoadError('')
        setIntent(null)
        setIntentEmail(null)
        try {
          const url = `${setupIntentUrl(clientId)}&email=${encodeURIComponent(effectiveDebouncedEmail)}`
          const res = await fetch(url)
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string }
            throw new Error(j.error ?? BOOKING_COPY.cardError)
          }
          const data = (await res.json()) as SetupIntentResponse
          if (signal.cancelled) return
          setIntent(data)
          setIntentEmail(effectiveDebouncedEmail)
        } catch (e) {
          if (signal.cancelled) return
          setLoadError(e instanceof Error ? e.message : BOOKING_COPY.cardError)
          setIntent(null)
          setIntentEmail(null)
        } finally {
          if (!signal.cancelled) setLoading(false)
        }
      })()
    })

    return () => {
      signal.cancelled = true
    }
  }, [shouldFetchIntent, clientId, effectiveDebouncedEmail])

  const activeIntent =
    mockMode || !effectiveDebouncedEmail || intentEmail !== effectiveDebouncedEmail ? null : intent

  const stripePromise =
    activeIntent?.publishableKey && activeIntent.clientSecret
      ? loadStripe(
          activeIntent.publishableKey,
          activeIntent.stripeAccountId ? { stripeAccount: activeIntent.stripeAccountId } : undefined,
        )
      : null

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-muted-bg/40 p-4">
      <p className="text-sm font-medium text-foreground">{BOOKING_COPY.cardGuaranteeTitle}</p>
      <p className="text-xs text-muted">{BOOKING_COPY.cardGuaranteeIntro}</p>
      <p className="text-xs font-medium text-foreground">{BOOKING_COPY.cardGuaranteeFee(feeLabel)}</p>

      {mockMode ? (
        <p className="text-xs text-muted">{BOOKING_COPY.cardMockNote}</p>
      ) : !shouldFetchIntent ? (
        <p className="text-xs text-muted">{BOOKING_COPY.cardRequired}</p>
      ) : loading ? (
        <p className="text-xs text-muted">{BOOKING_COPY.cardLoading}</p>
      ) : loadError ? (
        <p className="text-xs text-destructive" role="alert">
          {loadError}
        </p>
      ) : activeIntent?.clientSecret && stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: activeIntent.clientSecret,
            appearance: { theme: 'stripe' },
          }}
        >
          <StripeCardForm customerId={activeIntent.customerId} onHandlersChange={onHandlersChange} />
        </Elements>
      ) : (
        <p className="text-xs text-muted">{BOOKING_COPY.cardRequired}</p>
      )}
    </div>
  )
}
