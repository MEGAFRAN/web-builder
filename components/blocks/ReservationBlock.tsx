'use client'

import { useState, useEffect } from 'react'
import { formatListedPrice, hasServiceVariations, resolveServiceDuration, resolveServicePrice } from '@/lib/booking-catalog'
import { useBookingServicesCatalog } from '@/lib/hooks/useBookingServicesCatalog'
import { Alert } from '@/components/content/Alert'
import { Button } from '@/components/inputs/Button'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { BOOKING_SLOT_GRID } from '@/lib/booking-slot-grid'
import {
  BOOKING_COPY,
  BOOKING_FIELD_CLASS,
  BOOKING_STEPS_WITH_CARD,
  formatBookingDate,
} from '@/lib/booking-public-copy'
import {
  availabilityUrl,
  isRemoteBookingApi,
  reservationPostHeaders,
  reservationUrl,
} from '@/lib/booking-api'
import { isGuaranteeRequired } from '@/lib/booking-guarantee'
import { resolveBuildClientId } from '@/lib/client-id'
import ReservationCardCapture, {
  type CardCaptureHandlers,
} from '@/components/blocks/ReservationCardCapture'
import { ReservationProgress } from '@/components/blocks/ReservationProgress'
import type {
  ReservationBlock as ReservationBlockProps,
  ReservationServiceItem,
} from '@/types/cms'

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

interface FormFields {
  name: string
  email: string
  phone: string
  notes: string
}

function ReservationBlockShell({
  embedded,
  children,
}: {
  embedded?: boolean | null
  children: React.ReactNode
}) {
  if (embedded) {
    return (
      <div data-component="reservation-block" className="min-w-0">
        {children}
      </div>
    )
  }
  return (
    <Section paddingY="lg" dataComponent="reservation-block">
      <Container maxWidth="xl" padding="theme">
        {children}
      </Container>
    </Section>
  )
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function todayISODate(): string {
  return new Date().toISOString().split('T')[0]
}

export default function ReservationBlock({
  heading,
  subtext,
  services: servicesProp,
  confirmationMessage,
  clientId,
  availabilityEndpoint,
  servicesEndpoint,
  initialServiceId,
  embedded,
  hideHeading,
  skipServiceSelection,
  buildTimeCatalog,
  bookingSettings,
}: ReservationBlockProps) {
  const guaranteeRequired = isGuaranteeRequired(bookingSettings)
  const resolvedClientId = resolveBuildClientId(clientId)
  const cmsServices: ReservationServiceItem[] = servicesProp ?? []
  const { liveCatalog, catalogLoaded } = useBookingServicesCatalog(
    clientId,
    servicesEndpoint,
    buildTimeCatalog,
  )

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId ?? '',
  )
  const [selectedVariationId, setSelectedVariationId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({})
  const [state, setState] = useState<SubmissionState>('idle')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [outOfWindowSlots, setOutOfWindowSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [cardHandlers, setCardHandlers] = useState<CardCaptureHandlers | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<{
    date: string
    time: string
    email: string
    serviceSummary: string
  } | null>(null)
  const [prevInitialServiceId, setPrevInitialServiceId] = useState(initialServiceId)

  if (initialServiceId && initialServiceId !== prevInitialServiceId) {
    setPrevInitialServiceId(initialServiceId)
    setSelectedServiceId(initialServiceId)
    setSelectedVariationId('')
    setSelectedDate('')
    setSelectedTime('')
    setBookedSlots([])
    setOutOfWindowSlots([])
  }

  const adminPreferred =
    catalogLoaded && liveCatalog !== null && liveCatalog.length > 0 ? liveCatalog : null
  const services: ReservationServiceItem[] = adminPreferred ?? cmsServices

  const selectedService =
    selectedServiceId.length > 0
      ? services.find(s => s.id === selectedServiceId)
      : undefined

  const serviceHasVariations = selectedService ? hasServiceVariations(selectedService) : false
  const selectedVariation =
    serviceHasVariations && selectedVariationId
      ? selectedService?.variations?.find((v) => v.id === selectedVariationId)
      : undefined
  const effectiveDuration = selectedService
    ? resolveServiceDuration(selectedService, selectedVariationId || null)
    : undefined
  const effectivePrice = selectedService
    ? resolveServicePrice(selectedService, selectedVariationId || null)
    : undefined
  const variationChosen = !serviceHasVariations || selectedVariationId.length > 0

  const endTime =
    selectedTime && effectiveDuration
      ? addMinutes(selectedTime, effectiveDuration)
      : null

  const selectedStartMin =
    selectedTime && effectiveDuration ? timeToMinutes(selectedTime) : -1
  const selectedEndMin =
    selectedStartMin >= 0 && effectiveDuration
      ? selectedStartMin + effectiveDuration
      : -1

  useEffect(() => {
    if (!selectedDate || !clientId || !selectedService || !effectiveDuration || !variationChosen) {
      return
    }
    const duration = effectiveDuration
    const base = availabilityUrl(clientId, availabilityEndpoint)
    const url =
      `${base}?clientId=${encodeURIComponent(clientId)}` +
      `&date=${encodeURIComponent(selectedDate)}` +
      `&duration=${encodeURIComponent(String(duration))}`
    Promise.resolve()
      .then(() => {
        setLoadingSlots(true)
        return fetch(url)
      })
      .then(r =>
        r.ok ? r.json() : { bookedSlots: [], outOfWindowSlots: [] },
      )
      .then((data: { bookedSlots?: string[]; outOfWindowSlots?: string[] }) => {
        setBookedSlots(data.bookedSlots ?? [])
        setOutOfWindowSlots(data.outOfWindowSlots ?? [])
      })
      .catch(() => {
        setBookedSlots([])
        setOutOfWindowSlots([])
      })
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, clientId, availabilityEndpoint, selectedService, effectiveDuration, variationChosen])

  useEffect(() => {
    if (selectedTime) {
      document.getElementById('res-name')?.focus()
    }
  }, [selectedTime])

  function selectService(serviceId: string) {
    setSelectedServiceId(serviceId)
    setSelectedVariationId('')
    setSelectedDate('')
    setSelectedTime('')
    setBookedSlots([])
    setOutOfWindowSlots([])
  }

  function selectVariation(variationId: string) {
    setSelectedVariationId(variationId)
    setSelectedDate('')
    setSelectedTime('')
    setBookedSlots([])
    setOutOfWindowSlots([])
  }

  function updateField(key: keyof FormFields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function touchField(key: keyof FormFields) {
    setTouched(prev => ({ ...prev, [key]: true }))
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())
  const phoneValid = /^[\+\d\s\-\(\)]{7,20}$/.test(fields.phone.trim())
  const nameValid = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]{2,}$/.test(fields.name.trim())

  const fieldErrors: Partial<Record<keyof FormFields, string>> = {
    name: !nameValid ? BOOKING_COPY.nameError : undefined,
    email: !emailValid ? BOOKING_COPY.emailError : undefined,
    phone: !phoneValid ? BOOKING_COPY.phoneError : undefined,
  }

  const cardReady = !guaranteeRequired || cardHandlers?.ready === true

  const canSubmit =
    !!selectedService &&
    variationChosen &&
    !!effectiveDuration &&
    selectedDate.length > 0 &&
    selectedTime.length > 0 &&
    nameValid &&
    emailValid &&
    phoneValid &&
    cardReady

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !selectedService || effectiveDuration == null) return
    setState('submitting')
    try {
      const notesParts = [fields.notes.trim()]
      if (selectedVariation?.label?.trim()) {
        notesParts.unshift(`Variante: ${selectedVariation.label.trim()}`)
      } else if (selectedVariation) {
        notesParts.unshift(
          `Variante: ${selectedVariation.durationMinutes} min · ${formatListedPrice(
            selectedVariation.price,
            selectedService.currency ?? '€',
          )}`,
        )
      }
      const notes = notesParts.filter(Boolean).join('\n') || undefined

      let paymentMethodId: string | undefined
      let customerId: string | undefined
      if (guaranteeRequired) {
        if (!cardHandlers) {
          setErrorMessage(BOOKING_COPY.cardRequired)
          setState('error')
          return
        }
        const card = await cardHandlers.confirmSetup()
        paymentMethodId = card.paymentMethodId
        customerId = card.customerId ?? undefined
      }

      const payload = {
        serviceId: selectedService.id,
        durationMinutes: effectiveDuration,
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        date: selectedDate,
        time: selectedTime,
        notes,
        ...(paymentMethodId
          ? { paymentMethodId, ...(customerId ? { customerId } : {}) }
          : {}),
      }
      const res = await fetch(reservationUrl(), {
        method: 'POST',
        headers: reservationPostHeaders(),
        body: JSON.stringify(
          isRemoteBookingApi()
            ? { clientId: resolvedClientId, ...payload }
            : payload,
        ),
      })
      if (!res.ok) {
        let msg: string = BOOKING_COPY.submitError
        if (res.status === 409) {
          msg = BOOKING_COPY.slotTakenError
          setSelectedTime('')
        } else {
          try {
            const body = await res.json()
            if (body?.error === 'SLOT_TAKEN') {
              msg = BOOKING_COPY.slotTakenError
              setSelectedTime('')
            }
          } catch { /* ignore parse errors */ }
        }
        setErrorMessage(msg)
        setState('error')
        return
      }
      const priceLabel =
        effectivePrice != null
          ? formatListedPrice(effectivePrice, selectedService.currency ?? '€')
          : null
      const serviceSummary = priceLabel
        ? `${selectedService.name} (${effectiveDuration} min · ${priceLabel})`
        : `${selectedService.name} (${effectiveDuration} min)`
      setConfirmedBooking({
        date: selectedDate,
        time: selectedTime,
        email: fields.email,
        serviceSummary,
      })
      setState('success')
    } catch {
      setErrorMessage(BOOKING_COPY.networkError)
      setState('error')
    }
  }

  const progressSteps = guaranteeRequired ? BOOKING_STEPS_WITH_CARD : undefined
  const successStep = guaranteeRequired ? 5 : 4
  const contactStep = guaranteeRequired ? 3 : 3

  const currentStep =
    state === 'success'
      ? successStep
      : selectedDate && selectedTime
        ? cardHandlers?.ready && guaranteeRequired
          ? 4
          : contactStep
        : selectedServiceId && variationChosen
          ? 2
          : 1

  const progressSection = (
    <ReservationProgress currentStep={currentStep} steps={progressSteps} />
  )

  const bookingPanelClass =
    'rounded-[var(--radius)] border border-border bg-surface p-6 shadow-sm md:p-8'

  const headingSection =
    !hideHeading && (heading || subtext) ? (
      <Stack gap="sm">
        {heading && (
          <h2 className="text-center text-3xl font-bold text-foreground">{heading}</h2>
        )}
        {subtext && <p className="text-center text-muted">{subtext}</p>}
      </Stack>
    ) : null

  const hideServicePicker = Boolean(skipServiceSelection && selectedServiceId)

  if (state === 'success') {
    return (
      <ReservationBlockShell embedded={embedded}>
        <Stack gap="md">
          {headingSection}

          <div className={bookingPanelClass} data-component="reservation-panel">
              <Stack gap="lg">
                {progressSection}

                <Alert
                  variant="success"
                  title={BOOKING_COPY.reservationConfirmedTitle}
                  message={
                    confirmationMessage ?? BOOKING_COPY.reservationConfirmedFallback
                  }
                />
                {confirmedBooking && (
                  <dl className="rounded-md border border-border bg-background p-4 text-sm">
                    <div className="flex gap-2 py-1">
                      <dt className="w-28 shrink-0 font-medium text-foreground">
                        {BOOKING_COPY.summaryService}
                      </dt>
                      <dd className="text-muted">{confirmedBooking.serviceSummary}</dd>
                    </div>
                    <div className="flex gap-2 py-1">
                      <dt className="w-28 shrink-0 font-medium text-foreground">
                        {BOOKING_COPY.summaryDate}
                      </dt>
                      <dd className="text-muted">
                        {formatBookingDate(confirmedBooking.date)}
                      </dd>
                    </div>
                    <div className="flex gap-2 py-1">
                      <dt className="w-28 shrink-0 font-medium text-foreground">
                        {BOOKING_COPY.summaryTime}
                      </dt>
                      <dd className="text-muted">{confirmedBooking.time}</dd>
                    </div>
                    <div className="flex gap-2 py-1">
                      <dt className="w-28 shrink-0 font-medium text-foreground">
                        {BOOKING_COPY.summaryConfirmation}
                      </dt>
                      <dd className="text-muted">
                        {BOOKING_COPY.summarySentTo} {confirmedBooking.email}
                      </dd>
                    </div>
                  </dl>
                )}
              </Stack>
            </div>
          </Stack>
        </ReservationBlockShell>
    )
  }

  if (!catalogLoaded && cmsServices.length === 0) {
    return (
      <ReservationBlockShell embedded={embedded}>
        <Stack gap="md">
          {headingSection}
          <p className="text-center text-sm text-muted" role="status" aria-live="polite">
            {BOOKING_COPY.loadingServices}
          </p>
        </Stack>
      </ReservationBlockShell>
    )
  }

  if (services.length === 0) {
    return (
      <ReservationBlockShell embedded={embedded}>
        <Stack gap="md">
          {headingSection}
          <Alert
            variant="error"
            title={BOOKING_COPY.bookingUnavailableTitle}
            message={BOOKING_COPY.bookingUnavailableMessage}
          />
        </Stack>
      </ReservationBlockShell>
    )
  }

  return (
    <ReservationBlockShell embedded={embedded}>
      <Stack gap="md">
        {headingSection}

        <div className={bookingPanelClass} data-component="reservation-panel">
            <Stack gap="lg">
              {progressSection}

              <form onSubmit={handleSubmit} noValidate>
                <Stack gap="md">
              {hideServicePicker && selectedService ? (
                <div className="rounded-md border border-border bg-background px-3 py-3">
                  <p className="text-sm font-medium text-muted">{BOOKING_COPY.serviceLabel}</p>
                  <p className="text-base font-semibold text-foreground">{selectedService.name}</p>
                  {serviceHasVariations && !variationChosen ? (
                    <p className="text-xs text-muted">{BOOKING_COPY.variationRequired}</p>
                  ) : effectiveDuration != null && effectivePrice != null ? (
                    <p className="text-xs text-muted">
                      {effectiveDuration} min ·{' '}
                      {formatListedPrice(
                        effectivePrice,
                        selectedService.currency ?? '€',
                      )}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {/* Step 0 — Service */}
              {!hideServicePicker ? (
              <div className="flex flex-col gap-2">
                <span id="res-service-label" className="text-sm font-medium text-foreground">
                  {BOOKING_COPY.serviceLabel}{' '}
                  <span className="text-destructive">*</span>
                </span>
                <div
                  role="group"
                  aria-labelledby="res-service-label"
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {services.map(service => {
                    const currency = service.currency ?? '€'
                    const pressed = selectedServiceId === service.id
                    const priceLabel = hasServiceVariations(service)
                      ? formatListedPrice(
                          Math.min(...(service.variations ?? []).map((v) => v.price)),
                          currency,
                        )
                      : formatListedPrice(service.price ?? 0, currency)
                    const durationLabel = hasServiceVariations(service)
                      ? `${Math.min(...(service.variations ?? []).map((v) => v.durationMinutes))}-${Math.max(...(service.variations ?? []).map((v) => v.durationMinutes))} min`
                      : `${service.durationMinutes ?? 0} min`
                    return (
                      <button
                        key={service.id}
                        type="button"
                        aria-pressed={pressed}
                        aria-label={`${service.name}, ${durationLabel}, ${priceLabel}`}
                        onClick={() => selectService(service.id)}
                        className={[
                          'relative flex flex-col gap-1 rounded-md border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                          pressed
                            ? 'border-2 border-primary bg-muted-bg shadow-sm'
                            : 'border border-border bg-background hover:border-primary hover:bg-muted-bg',
                        ].join(' ')}
                      >
                        {pressed ? (
                          <span
                            aria-hidden="true"
                            className="absolute right-2 top-2 text-primary"
                          >
                            ✓
                          </span>
                        ) : null}
                        <span
                          className={
                            pressed
                              ? 'text-base font-bold text-primary'
                              : 'text-base font-semibold text-foreground'
                          }
                        >
                          {service.name}
                        </span>
                        <span className="text-xs text-muted">
                          {hasServiceVariations(service)
                            ? `Desde ${priceLabel} · ${durationLabel}`
                            : `${durationLabel} · ${priceLabel}`}
                        </span>
                        {service.description ? (
                          <span className="line-clamp-2 overflow-hidden text-sm text-muted">
                            {service.description}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
              ) : null}

              {selectedService && serviceHasVariations ? (
                <div className="flex flex-col gap-2">
                  <span id="res-variation-label" className="text-sm font-medium text-foreground">
                    {BOOKING_COPY.variationLabel}{' '}
                    <span className="text-destructive">*</span>
                  </span>
                  <div
                    role="group"
                    aria-labelledby="res-variation-label"
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {(selectedService.variations ?? []).map((variation) => {
                      const currency = selectedService.currency ?? '€'
                      const pressed = selectedVariationId === variation.id
                      const priceLabel = formatListedPrice(variation.price, currency)
                      const label = variation.label?.trim()
                      return (
                        <button
                          key={variation.id}
                          type="button"
                          aria-pressed={pressed}
                          aria-label={
                            label
                              ? `${label}, ${variation.durationMinutes} minutes, ${priceLabel}`
                              : `${variation.durationMinutes} minutes, ${priceLabel}`
                          }
                          onClick={() => selectVariation(variation.id)}
                          className={[
                            'relative flex flex-col gap-1 rounded-md border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                            pressed
                              ? 'border-2 border-primary bg-muted-bg shadow-sm'
                              : 'border border-border bg-background hover:border-primary hover:bg-muted-bg',
                          ].join(' ')}
                        >
                          {pressed ? (
                            <span
                              aria-hidden="true"
                              className="absolute right-2 top-2 text-primary"
                            >
                              ✓
                            </span>
                          ) : null}
                          <span
                            className={
                              pressed
                                ? 'text-base font-bold text-primary'
                                : 'text-base font-semibold text-foreground'
                            }
                          >
                            {label || `${variation.durationMinutes} min`}
                          </span>
                          <span className="text-xs text-muted">
                            {variation.durationMinutes} min · {priceLabel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Date — after service (and variation when applicable) */}
              {selectedServiceId && variationChosen && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="res-date" className="text-sm font-medium text-foreground">
                    {BOOKING_COPY.dateLabel}{' '}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="res-date"
                    type="date"
                    lang="es"
                    required
                    min={todayISODate()}
                    value={selectedDate}
                    onChange={e => {
                      setSelectedDate(e.target.value)
                      setSelectedTime('')
                      setBookedSlots([])
                      setOutOfWindowSlots([])
                    }}
                    className={BOOKING_FIELD_CLASS}
                  />
                </div>
              )}

              {/* Time slot grid */}
              {selectedServiceId && variationChosen && selectedDate && (
                <div className="flex flex-col gap-2">
                  <span id="res-time-label" className="text-sm font-medium text-foreground">
                    {BOOKING_COPY.timeLabel}{' '}
                    <span className="text-destructive">*</span>
                    {loadingSlots && (
                      <span
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="ml-2 text-xs font-normal text-muted"
                      >
                        {BOOKING_COPY.checkingAvailability}
                      </span>
                    )}
                  </span>
                  <div
                    role="group"
                    aria-labelledby="res-time-label"
                    className={`grid grid-cols-4 gap-2 sm:grid-cols-5 ${loadingSlots ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {BOOKING_SLOT_GRID.map(slot => {
                      const isBooked = bookedSlots.includes(slot)
                      const isOutOfWindow = outOfWindowSlots.includes(slot)
                      const slotMin = timeToMinutes(slot)
                      const isCovered =
                        !isBooked &&
                        !isOutOfWindow &&
                        selectedEndMin > 0 &&
                        slotMin > selectedStartMin &&
                        slotMin < selectedEndMin
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isCovered}
                          aria-disabled={
                            isBooked || isOutOfWindow || isCovered ? 'true' : undefined
                          }
                          aria-pressed={!isCovered && selectedTime === slot}
                          aria-label={
                            isOutOfWindow
                              ? `${slot} ${BOOKING_COPY.slotOutsideHoursAria}`
                              : isBooked
                                ? `${slot} ${BOOKING_COPY.slotBookedAria}`
                                : isCovered
                                  ? `${slot} ${BOOKING_COPY.slotCoveredAria}`
                                  : slot
                          }
                          onClick={() => {
                            if (isBooked || isOutOfWindow || isCovered || loadingSlots) return
                            setSelectedTime(slot)
                          }}
                          className={[
                            'rounded-md border px-2 py-1.5 text-sm font-medium transition-colors',
                            isOutOfWindow
                              ? 'cursor-not-allowed border-border bg-background text-muted/50 opacity-40'
                              : isBooked
                                ? 'cursor-not-allowed border-destructive/30 bg-destructive/10 text-destructive line-through opacity-90'
                                : isCovered
                                  ? 'cursor-not-allowed border-dashed border-border bg-muted/20 text-muted/60 opacity-50'
                                  : selectedTime === slot
                                    ? 'border-primary bg-primary text-primary-fg'
                                    : 'border-border bg-background text-foreground hover:border-primary hover:text-primary',
                          ].join(' ')}
                        >
                          {slot}
                          {isBooked && (
                            <span className="sr-only"> ({BOOKING_COPY.slotFull})</span>
                          )}
                          {isOutOfWindow && (
                            <span className="sr-only"> ({BOOKING_COPY.slotOutsideHours})</span>
                          )}
                          {isCovered && (
                            <span className="sr-only"> ({BOOKING_COPY.slotWithinBooking})</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {endTime && effectiveDuration ? (
                    <p className="text-xs text-muted">
                      {BOOKING_COPY.selectedRange}{' '}
                      <span className="font-medium text-foreground">
                        {selectedTime} – {endTime}
                      </span>{' '}
                      ({effectiveDuration} min)
                    </p>
                  ) : null}
                </div>
              )}

              {selectedServiceId && variationChosen && selectedDate && selectedTime && (
                <>
                  <hr className="border-border" />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="res-name" className="text-sm font-medium text-foreground">
                      {BOOKING_COPY.fullNameLabel}{' '}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="res-name"
                      type="text"
                      required
                      autoComplete="name"
                      autoCapitalize="words"
                      spellCheck={false}
                      value={fields.name}
                      aria-describedby={touched.name && fieldErrors.name ? 'res-name-error' : undefined}
                      aria-invalid={touched.name && !!fieldErrors.name}
                      onChange={e => updateField('name', e.target.value)}
                      onBlur={() => touchField('name')}
                      placeholder={BOOKING_COPY.namePlaceholder}
                      className={[
                        'rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        touched.name && fieldErrors.name
                          ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive'
                          : 'border-border focus-visible:border-primary focus-visible:ring-primary',
                      ].join(' ')}
                    />
                    {touched.name && fieldErrors.name && (
                      <p id="res-name-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="res-email" className="text-sm font-medium text-foreground">
                      {BOOKING_COPY.emailLabel}{' '}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="res-email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={fields.email}
                      aria-describedby={touched.email && fieldErrors.email ? 'res-email-error' : undefined}
                      aria-invalid={touched.email && !!fieldErrors.email}
                      onChange={e => updateField('email', e.target.value)}
                      onBlur={() => touchField('email')}
                      placeholder={BOOKING_COPY.emailPlaceholder}
                      className={[
                        'rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        touched.email && fieldErrors.email
                          ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive'
                          : 'border-border focus-visible:border-primary focus-visible:ring-primary',
                      ].join(' ')}
                    />
                    {touched.email && fieldErrors.email && (
                      <p id="res-email-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="res-phone" className="text-sm font-medium text-foreground">
                      {BOOKING_COPY.phoneLabel}{' '}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="res-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      pattern="[\+\d\s\-\(\)]{7,20}"
                      autoCorrect="off"
                      spellCheck={false}
                      value={fields.phone}
                      aria-describedby={touched.phone && fieldErrors.phone ? 'res-phone-error' : undefined}
                      aria-invalid={touched.phone && !!fieldErrors.phone}
                      onChange={e => updateField('phone', e.target.value)}
                      onBlur={() => touchField('phone')}
                      placeholder={BOOKING_COPY.phonePlaceholder}
                      className={[
                        'rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        touched.phone && fieldErrors.phone
                          ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive'
                          : 'border-border focus-visible:border-primary focus-visible:ring-primary',
                      ].join(' ')}
                    />
                    {touched.phone && fieldErrors.phone && (
                      <p id="res-phone-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="res-notes" className="text-sm font-medium text-foreground">
                      {BOOKING_COPY.specialRequestsLabel}{' '}
                      <span className="font-normal text-muted">{BOOKING_COPY.optional}</span>
                    </label>
                    <textarea
                      id="res-notes"
                      rows={3}
                      value={fields.notes}
                      onChange={e => updateField('notes', e.target.value)}
                      placeholder={BOOKING_COPY.notesPlaceholder}
                      className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    />
                  </div>

                  {guaranteeRequired && bookingSettings && resolvedClientId ? (
                    <ReservationCardCapture
                      clientId={resolvedClientId}
                      email={fields.email}
                      bookingSettings={bookingSettings}
                      servicePrice={effectivePrice ?? null}
                      onHandlersChange={setCardHandlers}
                    />
                  ) : null}

                  <Button
                    label={
                      state === 'submitting'
                        ? BOOKING_COPY.confirming
                        : BOOKING_COPY.confirmReservation
                    }
                    variant="primary"
                    size="lg"
                    disabled={state === 'submitting' || !canSubmit}
                  />
                </>
              )}

              {state === 'error' && errorMessage && (
                <Alert variant="error" message={errorMessage} />
              )}
                </Stack>
              </form>
            </Stack>
          </div>
        </Stack>
      </ReservationBlockShell>
  )
}
