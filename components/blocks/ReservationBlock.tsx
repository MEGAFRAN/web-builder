'use client'

import { useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { Button } from '@/components/inputs/Button'
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

export default function ReservationBlock({
  heading,
  subtext,
  availableTimeSlots,
  minPartySize,
  maxPartySize,
  confirmationMessage,
}: ReservationBlockProps) {
  const slots = availableTimeSlots && availableTimeSlots.length > 0
    ? availableTimeSlots
    : DEFAULT_TIME_SLOTS

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [fields, setFields] = useState<FormFields>({
    name: '', email: '', phone: '', partySize: String(minPartySize ?? 2), notes: '',
  })
  const [state, setState] = useState<SubmissionState>('idle')

  const min = minPartySize ?? 1
  const max = maxPartySize ?? 20

  function updateField(key: keyof FormFields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const canSubmit =
    selectedDate.length > 0 &&
    selectedTime.length > 0 &&
    fields.name.trim().length > 0 &&
    fields.email.trim().length > 0 &&
    fields.phone.trim().length > 0 &&
    Number(fields.partySize) >= min &&
    Number(fields.partySize) <= max

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
        setState('error')
        return
      }
      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <section data-component="reservation-block" className="py-[var(--section-spacing)] px-[var(--page-inset)]">
        <div className="mx-auto max-w-xl text-center">
          <Alert
            variant="success"
            title="Reservation confirmed!"
            message={confirmationMessage ?? "We've received your request and will send a confirmation to your email shortly."}
          />
        </div>
      </section>
    )
  }

  return (
    <section data-component="reservation-block" className="py-[var(--section-spacing)] px-[var(--page-inset)]">
      <div className="mx-auto max-w-xl">
        {(heading || subtext) && (
          <div className="mb-8 text-center">
            {heading && (
              <h2 className="text-3xl font-bold text-foreground">{heading}</h2>
            )}
            {subtext && (
              <p className="mt-2 text-muted">{subtext}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--content-gap)]" noValidate>
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
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Time slot grid */}
          {selectedDate && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                Time <span className="text-destructive">*</span>
              </span>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {slots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={[
                      'rounded-md border px-2 py-1.5 text-sm font-medium transition-colors',
                      selectedTime === slot
                        ? 'border-primary bg-primary text-primary-fg'
                        : 'border-border bg-background text-foreground hover:border-primary hover:text-primary',
                    ].join(' ')}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guest details — only show once date + time are picked */}
          {selectedDate && selectedTime && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="res-name" className="text-sm font-medium text-foreground">
                  Full name <span className="text-destructive">*</span>
                </label>
                <input
                  id="res-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fields.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="Jane Smith"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                  value={fields.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="jane@example.com"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                  value={fields.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="+34 600 000 000"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

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
                  value={fields.partySize}
                  onChange={e => updateField('partySize', e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted">Between {min} and {max} guests.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="res-notes" className="text-sm font-medium text-foreground">
                  Special requests <span className="text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  id="res-notes"
                  rows={3}
                  value={fields.notes}
                  onChange={e => updateField('notes', e.target.value)}
                  placeholder="Allergies, accessibility needs, occasion…"
                  className="resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button
                label={state === 'submitting' ? 'Confirming…' : 'Confirm reservation'}
                variant="primary"
                size="lg"
                disabled={state === 'submitting' || !canSubmit}
              />

              {state === 'error' && (
                <Alert
                  variant="error"
                  message="Something went wrong. Please try again or call us directly."
                />
              )}
            </>
          )}
        </form>
      </div>
    </section>
  )
}
