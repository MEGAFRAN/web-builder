'use client'

import { useState, useEffect } from 'react'
import { Alert } from '@/components/content/Alert'
import { Button } from '@/components/inputs/Button'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import type { ReservationBlock as ReservationBlockProps } from '@/types/cms'

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

interface FormFields {
  name: string
  email: string
  phone: string
  partySize: string
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

const STEPS = [
  { label: '1 · Date & time', step: 1 },
  { label: '2 · Guest details', step: 2 },
  { label: '3 · Confirmed', step: 3 },
]

export default function ReservationBlock({
  heading,
  subtext,
  availableTimeSlots,
  minPartySize,
  maxPartySize,
  confirmationMessage,
  clientId,
  availabilityEndpoint,
}: ReservationBlockProps) {
  const slots =
    availableTimeSlots && availableTimeSlots.length > 0
      ? availableTimeSlots
      : DEFAULT_TIME_SLOTS

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [fields, setFields] = useState<FormFields>({
    name: '',
    email: '',
    phone: '',
    partySize: String(minPartySize ?? 2),
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
    partySize: string
    email: string
  } | null>(null)

  useEffect(() => {
    if (!selectedDate || !clientId) {
      return
    }
    const base = availabilityEndpoint ?? '/api/availability'
    const url = `${base}?clientId=${encodeURIComponent(clientId)}&date=${encodeURIComponent(selectedDate)}`
    Promise.resolve()
      .then(() => {
        setLoadingSlots(true)
        return fetch(url)
      })
      .then(r => (r.ok ? r.json() : { bookedSlots: [] }))
      .then((data: { bookedSlots?: string[] }) => setBookedSlots(data.bookedSlots ?? []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, clientId, availabilityEndpoint])

  useEffect(() => {
    if (selectedTime) {
      document.getElementById('res-party')?.focus()
    }
  }, [selectedTime])

  const min = minPartySize ?? 1
  const max = maxPartySize ?? 20

  function updateField(key: keyof FormFields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function touchField(key: keyof FormFields) {
    setTouched(prev => ({ ...prev, [key]: true }))
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())
  const phoneValid = /^[\+\d\s\-\(\)]{7,20}$/.test(fields.phone.trim())
  const nameValid = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]{2,}$/.test(fields.name.trim())
  const partySizeValid = Number(fields.partySize) >= min && Number(fields.partySize) <= max

  const fieldErrors: Partial<Record<keyof FormFields, string>> = {
    name: !nameValid ? 'Please enter a full name (at least 2 characters).' : undefined,
    email: !emailValid ? 'Please enter a valid email address.' : undefined,
    phone: !phoneValid ? 'Please enter a valid phone number (digits, spaces, +, -, parentheses).' : undefined,
    partySize: !partySizeValid ? `Please enter a number between ${min} and ${max}.` : undefined,
  }

  const canSubmit =
    selectedDate.length > 0 &&
    selectedTime.length > 0 &&
    nameValid &&
    emailValid &&
    phoneValid &&
    partySizeValid

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setState('submitting')
    try {
      const res = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          date: selectedDate,
          time: selectedTime,
          partySize: Number(fields.partySize),
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
      setConfirmedBooking({
        date: selectedDate,
        time: selectedTime,
        partySize: fields.partySize,
        email: fields.email,
      })
      setState('success')
    } catch {
      setErrorMessage(
        "We couldn't reach our reservations system. Please try again or call us directly.",
      )
      setState('error')
    }
  }

  const currentStep = state === 'success' ? 3 : selectedDate && selectedTime ? 2 : 1

  if (state === 'success') {
    return (
      <Section paddingY="lg" dataComponent="reservation-block">
        <Container maxWidth="xl" padding="theme">
          <Stack gap="md">
            {(heading || subtext) && (
              <Stack gap="sm">
                {heading && (
                  <h2 className="text-center text-3xl font-bold text-foreground">{heading}</h2>
                )}
                {subtext && <p className="text-center text-muted">{subtext}</p>}
              </Stack>
            )}

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
                  <dt className="w-24 font-medium text-foreground">Date</dt>
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
                  <dt className="w-24 font-medium text-foreground">Time</dt>
                  <dd className="text-muted">{confirmedBooking.time}</dd>
                </div>
                <div className="flex gap-2 py-1">
                  <dt className="w-24 font-medium text-foreground">Guests</dt>
                  <dd className="text-muted">{confirmedBooking.partySize}</dd>
                </div>
                <div className="flex gap-2 py-1">
                  <dt className="w-24 font-medium text-foreground">Confirmation</dt>
                  <dd className="text-muted">Sent to {confirmedBooking.email}</dd>
                </div>
              </dl>
            )}
          </Stack>
        </Container>
      </Section>
    )
  }

  return (
    <Section paddingY="lg" dataComponent="reservation-block">
      <Container maxWidth="xl" padding="theme">
        <Stack gap="md">
          {(heading || subtext) && (
            <Stack gap="sm">
              {heading && (
                <h2 className="text-center text-3xl font-bold text-foreground">{heading}</h2>
              )}
              {subtext && <p className="text-center text-muted">{subtext}</p>}
            </Stack>
          )}

          {/* Step progress indicator — always visible */}
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

          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              {/* Date */}
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

              {/* Time slot grid — only when date is selected */}
              {selectedDate && (
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
                    {slots.map(slot => {
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

              {/* Step 1 + Step 2 fields — only shown once date + time are picked */}
              {selectedDate && selectedTime && (
                <>
                  {/* Party size — Step 1 field, revealed with date+time */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="res-party" className="text-sm font-medium text-foreground">
                      Number of guests <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="res-party"
                      type="number"
                      required
                      min={min}
                      max={max}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={fields.partySize}
                      aria-describedby={touched.partySize && fieldErrors.partySize ? 'res-party-error' : 'res-party-hint'}
                      aria-invalid={touched.partySize && !!fieldErrors.partySize}
                      onChange={e => updateField('partySize', e.target.value)}
                      onBlur={() => touchField('partySize')}
                      className={[
                        'rounded-md border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        touched.partySize && fieldErrors.partySize
                          ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive'
                          : 'border-border focus-visible:border-primary focus-visible:ring-primary',
                      ].join(' ')}
                    />
                    {touched.partySize && fieldErrors.partySize ? (
                      <p id="res-party-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.partySize}
                      </p>
                    ) : (
                      <p id="res-party-hint" className="text-xs text-muted">
                        Between {min} and {max} guests.
                      </p>
                    )}
                  </div>

                  <hr className="border-border" />

                  {/* Contact details — Step 2 */}
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
