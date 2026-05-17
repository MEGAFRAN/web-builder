'use client'

import { useState, useEffect } from 'react'
import { Alert } from '@/components/content/Alert'
import { Button } from '@/components/inputs/Button'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
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

const DEFAULT_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
]

function todayISODate(): string {
  return new Date().toISOString().split('T')[0]
}

function formatListedPrice(price: number, currencySymbol: string): string {
  const text = Number.isInteger(price)
    ? String(price)
    : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currencySymbol}${text}`
}

const STEPS = [
  { label: '1 · Service', step: 1 },
  { label: '2 · Date & time', step: 2 },
  { label: '3 · Your details', step: 3 },
  { label: '4 · Confirmed', step: 4 },
]

export default function ReservationBlock({
  heading,
  subtext,
  services: servicesProp,
  confirmationMessage,
  clientId,
  availabilityEndpoint,
}: ReservationBlockProps) {
  const services: ReservationServiceItem[] = servicesProp ?? []

  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
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
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [confirmedBooking, setConfirmedBooking] = useState<{
    date: string
    time: string
    email: string
    serviceSummary: string
  } | null>(null)

  const selectedService =
    selectedServiceId.length > 0
      ? services.find(s => s.id === selectedServiceId)
      : undefined

  useEffect(() => {
    if (!selectedDate || !clientId || !selectedService) {
      return
    }
    const duration = selectedService.durationMinutes
    const base = availabilityEndpoint ?? '/api/availability'
    const url =
      `${base}?clientId=${encodeURIComponent(clientId)}` +
      `&date=${encodeURIComponent(selectedDate)}` +
      `&duration=${encodeURIComponent(String(duration))}`
    Promise.resolve()
      .then(() => {
        setLoadingSlots(true)
        return fetch(url)
      })
      .then(r => (r.ok ? r.json() : { bookedSlots: [] }))
      .then((data: { bookedSlots?: string[] }) => setBookedSlots(data.bookedSlots ?? []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, clientId, availabilityEndpoint, selectedService])

  useEffect(() => {
    if (selectedTime) {
      document.getElementById('res-name')?.focus()
    }
  }, [selectedTime])

  function selectService(serviceId: string) {
    setSelectedServiceId(serviceId)
    setSelectedDate('')
    setSelectedTime('')
    setBookedSlots([])
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
    name: !nameValid ? 'Please enter a full name (at least 2 characters).' : undefined,
    email: !emailValid ? 'Please enter a valid email address.' : undefined,
    phone: !phoneValid ? 'Please enter a valid phone number (digits, spaces, +, -, parentheses).' : undefined,
  }

  const canSubmit =
    !!selectedService &&
    selectedDate.length > 0 &&
    selectedTime.length > 0 &&
    nameValid &&
    emailValid &&
    phoneValid

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !selectedService) return
    setState('submitting')
    try {
      const res = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          durationMinutes: selectedService.durationMinutes,
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          date: selectedDate,
          time: selectedTime,
          notes: fields.notes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        let msg = 'Something went wrong. Please try again or call us directly.'
        if (res.status === 409) {
          msg = 'This time slot was just taken — please pick another time.'
          setSelectedTime('')
        } else {
          try {
            const body = await res.json()
            if (body?.error === 'SLOT_TAKEN') {
              msg = 'This time slot was just taken — please pick another time.'
              setSelectedTime('')
            }
          } catch { /* ignore parse errors */ }
        }
        setErrorMessage(msg)
        setState('error')
        return
      }
      const serviceSummary = `${selectedService.name} (${selectedService.durationMinutes} min)`
      setConfirmedBooking({
        date: selectedDate,
        time: selectedTime,
        email: fields.email,
        serviceSummary,
      })
      setState('success')
    } catch {
      setErrorMessage(
        "We couldn't reach our reservations system. Please try again or call us directly.",
      )
      setState('error')
    }
  }

  const currentStep =
    state === 'success'
      ? 4
      : selectedDate && selectedTime
        ? 3
        : selectedServiceId
          ? 2
          : 1

  const progressSection = (
    <ol aria-label="Booking progress" className="flex list-none gap-4 pl-0">
      {STEPS.map(({ label, step }) => (
        <li
          key={step}
          aria-current={currentStep === step ? 'step' : undefined}
          className={
            currentStep === step
              ? 'text-sm font-medium text-foreground'
              : 'text-sm text-muted'
          }
        >
          {label}
        </li>
      ))}
    </ol>
  )

  const headingSection =
    (heading || subtext) ? (
      <Stack gap="sm">
        {heading && (
          <h2 className="text-center text-3xl font-bold text-foreground">{heading}</h2>
        )}
        {subtext && <p className="text-center text-muted">{subtext}</p>}
      </Stack>
    ) : null

  if (state === 'success') {
    return (
      <Section paddingY="lg" dataComponent="reservation-block">
        <Container maxWidth="xl" padding="theme">
          <Stack gap="md">
            {headingSection}

            {progressSection}

            <Alert
              variant="success"
              title="Reservation confirmed!"
              message={
                confirmationMessage ??
                "We've received your request and will send a confirmation to your email shortly."
              }
            />
            {confirmedBooking && (
              <dl className="rounded-md border border-border bg-background p-4 text-sm">
                <div className="flex gap-2 py-1">
                  <dt className="w-24 shrink-0 font-medium text-foreground">Service</dt>
                  <dd className="text-muted">{confirmedBooking.serviceSummary}</dd>
                </div>
                <div className="flex gap-2 py-1">
                  <dt className="w-24 shrink-0 font-medium text-foreground">Date</dt>
                  <dd className="text-muted">
                    {new Date(confirmedBooking.date + 'T12:00:00').toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
                <div className="flex gap-2 py-1">
                  <dt className="w-24 shrink-0 font-medium text-foreground">Time</dt>
                  <dd className="text-muted">{confirmedBooking.time}</dd>
                </div>
                <div className="flex gap-2 py-1">
                  <dt className="w-24 shrink-0 font-medium text-foreground">Confirmation</dt>
                  <dd className="text-muted">Sent to {confirmedBooking.email}</dd>
                </div>
              </dl>
            )}
          </Stack>
        </Container>
      </Section>
    )
  }

  if (services.length === 0) {
    return (
      <Section paddingY="lg" dataComponent="reservation-block">
        <Container maxWidth="xl" padding="theme">
          <Stack gap="md">
            {headingSection}
            <Alert
              variant="error"
              title="Booking unavailable"
              message="No services are configured for online booking yet. Please contact us directly."
            />
          </Stack>
        </Container>
      </Section>
    )
  }

  return (
    <Section paddingY="lg" dataComponent="reservation-block">
      <Container maxWidth="xl" padding="theme">
        <Stack gap="md">
          {headingSection}

          {progressSection}

          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              {/* Step 0 — Service */}
              <div className="flex flex-col gap-2">
                <span id="res-service-label" className="text-sm font-medium text-foreground">
                  Service <span className="text-destructive">*</span>
                </span>
                <div
                  role="group"
                  aria-labelledby="res-service-label"
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {services.map(service => {
                    const currency = service.currency ?? '€'
                    const pressed = selectedServiceId === service.id
                    const priceLabel = formatListedPrice(service.price, currency)
                    return (
                      <button
                        key={service.id}
                        type="button"
                        aria-pressed={pressed}
                        aria-label={`${service.name}, ${service.durationMinutes} minutes, ${priceLabel}`}
                        onClick={() => selectService(service.id)}
                        className={[
                          'flex flex-col gap-1 rounded-md border px-3 py-3 text-left transition-colors',
                          pressed
                            ? 'border-primary bg-background shadow-sm'
                            : 'border-border bg-background hover:border-primary hover:text-primary',
                        ].join(' ')}
                      >
                        <span className="text-base font-semibold text-foreground">{service.name}</span>
                        <span className="text-xs text-muted">
                          {service.durationMinutes} min · {priceLabel}
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

              {/* Date — after service */}
              {selectedServiceId && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="res-date" className="text-sm font-medium text-foreground">
                    Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="res-date"
                    type="date"
                    required
                    min={todayISODate()}
                    value={selectedDate}
                    onChange={e => {
                      setSelectedDate(e.target.value)
                      setSelectedTime('')
                      setBookedSlots([])
                    }}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
              )}

              {/* Time slot grid */}
              {selectedServiceId && selectedDate && (
                <div className="flex flex-col gap-2">
                  <span id="res-time-label" className="text-sm font-medium text-foreground">
                    Time <span className="text-destructive">*</span>
                    {loadingSlots && (
                      <span
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="ml-2 text-xs font-normal text-muted"
                      >
                        Checking availability…
                      </span>
                    )}
                  </span>
                  <div
                    role="group"
                    aria-labelledby="res-time-label"
                    className={`grid grid-cols-4 gap-2 sm:grid-cols-5 ${loadingSlots ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {DEFAULT_TIME_SLOTS.map(slot => {
                      const isBooked = bookedSlots.includes(slot)
                      return (
                        <button
                          key={slot}
                          type="button"
                          aria-disabled={isBooked ? 'true' : undefined}
                          aria-pressed={selectedTime === slot}
                          aria-label={isBooked ? `${slot} – fully booked` : slot}
                          onClick={() => {
                            if (isBooked || loadingSlots) return
                            setSelectedTime(slot)
                          }}
                          className={[
                            'rounded-md border px-2 py-1.5 text-sm font-medium transition-colors',
                            isBooked
                              ? 'cursor-not-allowed border-border bg-muted/40 text-muted line-through opacity-60'
                              : selectedTime === slot
                                ? 'border-primary bg-primary text-primary-fg'
                                : 'border-border bg-background text-foreground hover:border-primary hover:text-primary',
                          ].join(' ')}
                        >
                          {slot}
                          {isBooked && <span className="sr-only"> (full)</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedServiceId && selectedDate && selectedTime && (
                <>
                  <hr className="border-border" />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="res-name" className="text-sm font-medium text-foreground">
                      Full name <span className="text-destructive">*</span>
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
                      placeholder="Jane Smith"
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
                      Email <span className="text-destructive">*</span>
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
                      placeholder="jane@example.com"
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
                      Phone <span className="text-destructive">*</span>
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
                      placeholder="+34 600 000 000"
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
                      Special requests{' '}
                      <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <textarea
                      id="res-notes"
                      rows={3}
                      value={fields.notes}
                      onChange={e => updateField('notes', e.target.value)}
                      placeholder="Allergies, accessibility needs, occasion…"
                      className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    />
                  </div>

                  <Button
                    label={state === 'submitting' ? 'Confirming…' : 'Confirm reservation'}
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
      </Container>
    </Section>
  )
}
