'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { Badge } from '@/components/content/Badge'
import { Button } from '@/components/inputs/Button'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { Heading } from '@/components/content/Heading'
import { AdminModal } from '@/components/admin/AdminModal'
import { BOOKING_SLOT_GRID } from '@/lib/booking-slot-grid'
import { resolveDayMinutesWindow } from '@/lib/booking-schedule-window'
import type { BookingScheduleFile } from '@/types/admin'

type ReservationRow = {
  id: string
  clientId: string
  serviceId?: string
  durationMinutes?: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  notes?: string | null
  status: string
  createdAt: string
  partySize?: number
  cancelReason?: string | null
  serviceName: string | null
}

function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function addDaysYmd(ymd: string, delta: number): string {
  const d = parseYmdLocal(ymd)
  d.setDate(d.getDate() + delta)
  return formatYmd(d)
}

function mondayOfWeek(ymd: string): string {
  const d = parseYmdLocal(ymd)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatYmd(d)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function bookingDurationMinutes(r: ReservationRow): number {
  if (typeof r.durationMinutes === 'number' && r.durationMinutes > 0) {
    return r.durationMinutes
  }
  return 60
}

function formatPrettyDate(ymd: string): string {
  const d = parseYmdLocal(ymd)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusBadge(status: string): { label: string; variant: string } {
  if (status === 'cancelled') return { label: 'Cancelled', variant: 'error' }
  if (status === 'no-show') return { label: 'No-show', variant: 'warning' }
  if (status === 'pending') return { label: 'To be confirmed', variant: 'warning' }
  return { label: 'Confirmed', variant: 'success' }
}

/** Day/week/simple-list cards: border colour encodes status (detail sheet still uses text Badge). */
function bookingCardBorderClasses(status: string): string {
  if (status === 'cancelled' || status === 'no-show') {
    return 'border border-border hover:border-primary'
  }
  if (status === 'pending') {
    return 'border-2 border-yellow-500 hover:border-yellow-600'
  }
  return 'border-2 border-green-600 hover:border-green-700'
}

function bookingStatusAriaLabel(status: string): string {
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'no-show') return 'No-show'
  if (status === 'pending') return 'To be confirmed'
  return 'Confirmed'
}

export default function AdminBookingsPage({ clientId }: { clientId: string }) {
  const [selectedYmd, setSelectedYmd] = useState<string>(() => formatYmd(new Date()))
  const [view, setView] = useState<'day' | 'week'>('day')
  const [schedule, setSchedule] = useState<BookingScheduleFile | null>(null)
  const [rows, setRows] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const [detail, setDetail] = useState<ReservationRow | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const weekStart = useMemo(() => mondayOfWeek(selectedYmd), [selectedYmd])
  const weekEnd = useMemo(() => addDaysYmd(weekStart, 6), [weekStart])

  const fetchRange = useCallback(
    async (start: string, end: string) => {
      setLoading(true)
      setError('')
      try {
        const [rs, sch] = await Promise.all([
          fetch(`/api/admin/reservations?startDate=${start}&endDate=${end}`).then(async (r) => {
            if (!r.ok) throw new Error('Failed to load reservations.')
            return r.json() as Promise<{ reservations: ReservationRow[] }>
          }),
          fetch(`/api/admin/schedule`).then(async (r) => {
            if (!r.ok) throw new Error('Failed to load schedule.')
            return r.json() as Promise<BookingScheduleFile>
          }),
        ])
        setRows(rs.reservations)
        setSchedule(sch)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (view === 'day') {
      void fetchRange(selectedYmd, selectedYmd)
    } else {
      void fetchRange(weekStart, weekEnd)
    }
  }, [fetchRange, selectedYmd, view, weekStart, weekEnd])

  const dayRows = useMemo(() => {
    const list = rows.filter((r) => r.date === selectedYmd)
    list.sort((a, b) => a.time.localeCompare(b.time))
    return list
  }, [rows, selectedYmd])

  const ppm = 1.15
  const dayWindow =
    schedule !== null ? resolveDayMinutesWindow(schedule, selectedYmd) : null
  const timelineHeight =
    dayWindow !== null ? Math.max((dayWindow.closeMin - dayWindow.openMin) * ppm, 120) : 0

  async function patchReservation(id: string, action: 'cancel' | 'no-show', reason?: string) {
    const res = await fetch(`/api/admin/reservations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(j.error ?? 'Update failed.')
    }
    setDetail(null)
    void fetchRange(view === 'day' ? selectedYmd : weekStart, view === 'day' ? selectedYmd : weekEnd)
  }

  return (
    <Section paddingY="lg" background="white">
      <Stack gap="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Heading text="Bookings" level="h1" />
            <p className="mt-1 text-sm text-muted">Day and week views of upcoming appointments.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              + New appointment
            </button>
          </div>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => setSelectedYmd((d) => addDaysYmd(d, -1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => setSelectedYmd(formatYmd(new Date()))}
            >
              Today
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => setSelectedYmd((d) => addDaysYmd(d, 1))}
            >
              Next
            </button>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <span className="sr-only">Jump to date</span>
              <span aria-hidden className="text-muted">
                📅
              </span>
              <input
                type="date"
                value={selectedYmd}
                onChange={(e) => setSelectedYmd(e.target.value)}
                className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
            </label>
          </div>

          <div
            role="group"
            aria-label="View mode"
            className="inline-flex rounded-md border border-border p-0.5"
          >
            <button
              type="button"
              className={`rounded px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                view === 'day' ? 'bg-primary text-primary-fg' : 'text-foreground'
              }`}
              onClick={() => setView('day')}
              aria-pressed={view === 'day'}
            >
              Day
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                view === 'week' ? 'bg-primary text-primary-fg' : 'text-foreground'
              }`}
              onClick={() => setView('week')}
              aria-pressed={view === 'week'}
            >
              Week
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : view === 'day' ? (
          dayWindow === null && dayRows.length === 0 ? (
            <ClosedDayMessage dateLabel={formatPrettyDate(selectedYmd)} onCreate={() => setCreateOpen(true)} />
          ) : dayWindow === null && dayRows.length > 0 ? (
            <SimpleDayList rows={dayRows} onSelect={setDetail} />
          ) : dayRows.length === 0 ? (
            <EmptyDay onCreate={() => setCreateOpen(true)} />
          ) : (
            <DayTimeline
              rows={dayRows}
              openMin={dayWindow!.openMin}
              closeMin={dayWindow!.closeMin}
              ppm={ppm}
              timelineHeight={timelineHeight}
              onSelect={setDetail}
            />
          )
        ) : (
          <WeekGrid
            weekStart={weekStart}
            rows={rows}
            onPickDay={(ymd) => {
              setSelectedYmd(ymd)
              setView('day')
            }}
            onSelect={setDetail}
          />
        )}
      </Stack>

      {detail && (
        <DetailPanel
          row={detail}
          onClose={() => setDetail(null)}
          onCancel={() => setCancelOpen(true)}
          onNoShow={() => void patchReservation(detail.id, 'no-show')}
        />
      )}

      <AdminModal
        open={cancelOpen}
        title="Cancel this appointment?"
        labelledById="cancel-appt-title"
        descriptionId="cancel-appt-desc"
        onClose={() => {
          setCancelOpen(false)
          setCancelReason('')
        }}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => {
                setCancelOpen(false)
                setCancelReason('')
              }}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() =>
                detail &&
                void patchReservation(detail.id, 'cancel', cancelReason.trim() || undefined).then(
                  () => {
                    setCancelOpen(false)
                    setCancelReason('')
                  },
                )
              }
            >
              Confirm cancel
            </button>
          </>
        }
      >
        <p id="cancel-appt-desc" className="text-sm text-muted">
          Optionally add a note for your records (visible internally only).
        </p>
        <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-foreground">
          Reason (optional)
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal placeholder-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            placeholder="e.g. Customer requested cancellation"
          />
        </label>
      </AdminModal>

      {createOpen && (
        <NewAppointmentModal
          clientId={clientId}
          initialDate={selectedYmd}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false)
            void fetchRange(view === 'day' ? selectedYmd : weekStart, view === 'day' ? selectedYmd : weekEnd)
          }}
        />
      )}
    </Section>
  )
}

function ClosedDayMessage({
  dateLabel,
  onCreate,
}: {
  dateLabel: string
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted-bg px-6 py-12 text-center">
      <p className="font-medium text-foreground">Closed · {dateLabel}</p>
      <p className="mt-2 text-sm text-muted">No bookings are accepted on this date.</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        + New appointment
      </button>
    </div>
  )
}

function SimpleDayList({
  rows,
  onSelect,
}: {
  rows: ReservationRow[]
  onSelect: (r: ReservationRow) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="mb-3 text-sm text-muted">
        This day is marked closed or uses special hours — appointments are listed below without a timeline.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => {
          const border = bookingCardBorderClasses(r.status)
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                aria-label={`${r.name}, ${r.time}, ${r.serviceName ?? 'Service'}, ${bookingStatusAriaLabel(r.status)}`}
                className={`flex w-full flex-col rounded-lg bg-surface px-3 py-2 text-left shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${border}`}
              >
                <span className="font-semibold text-foreground">{r.name}</span>
                <span className="text-xs text-muted">
                  {r.time} · {r.serviceName ?? 'Service'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function EmptyDay({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted-bg px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        📋
      </span>
      <p className="mt-4 text-foreground">No appointments for this day</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        + New appointment
      </button>
    </div>
  )
}

function DayTimeline({
  rows,
  openMin,
  closeMin,
  ppm,
  timelineHeight,
  onSelect,
}: {
  rows: ReservationRow[]
  openMin: number
  closeMin: number
  ppm: number
  timelineHeight: number
  onSelect: (r: ReservationRow) => void
}) {
  const ticks: number[] = []
  for (let m = openMin; m <= closeMin; m += 60) {
    ticks.push(m)
  }

  return (
    <div className="relative overflow-x-auto rounded-xl border border-border bg-background">
      <div className="relative" style={{ minHeight: timelineHeight }}>
        <div className="absolute top-0 bottom-0 left-14 border-border border-l" aria-hidden />
        {ticks.map((m) => {
          const top = (m - openMin) * ppm
          const hh = Math.floor(m / 60)
          const mm = m % 60
          const label = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
          return (
            <div
              key={m}
              className="pointer-events-none absolute right-0 left-14 border-border border-t border-dashed text-[11px] text-muted"
              style={{ top }}
            >
              <span className="absolute -top-2 -left-12 w-10 text-right">{label}</span>
            </div>
          )
        })}

        <ol className="absolute top-0 right-2 bottom-0 left-16 list-none space-y-1 p-2">
          {rows.map((r) => {
            const start = timeToMinutes(r.time)
            const dur = bookingDurationMinutes(r)
            const top = (start - openMin) * ppm
            const height = Math.max(dur * ppm, 36)
            const border = bookingCardBorderClasses(r.status)
            const dimmed = r.status === 'cancelled' || r.status === 'no-show'
            const endMin = start + dur
            const endHH = Math.floor(endMin / 60)
            const endMM = endMin % 60
            const endLabel = `${String(endHH).padStart(2, '0')}:${String(endMM).padStart(2, '0')}`
            const aria = `${r.name}, ${r.serviceName ?? 'Service'}, ${r.time}–${endLabel}, ${bookingStatusAriaLabel(r.status)}`
            return (
              <li
                key={r.id}
                className="absolute right-1 left-1 list-none"
                style={{ top, height }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(r)}
                  aria-label={aria}
                  className={`flex h-full w-full min-h-0 flex-col rounded-lg bg-surface px-3 py-2 text-left shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${border} ${
                    dimmed ? 'opacity-60' : ''
                  }`}
                >
                  <span className="truncate text-xs text-muted">
                    {r.serviceName ?? 'Service'}{' · '}
                    {r.time} – {endLabel}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function WeekGrid({
  weekStart,
  rows,
  onPickDay,
  onSelect,
}: {
  weekStart: string
  rows: ReservationRow[]
  onPickDay: (ymd: string) => void
  onSelect: (r: ReservationRow) => void
}) {
  const days = [...Array(7)].map((_, i) => addDaysYmd(weekStart, i))
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {days.map((ymd, i) => {
        const dayRows = rows.filter((r) => r.date === ymd).sort((a, b) => a.time.localeCompare(b.time))
        return (
          <div key={ymd} className="flex min-h-[220px] flex-col rounded-xl border border-border bg-background">
            <button
              type="button"
              onClick={() => onPickDay(ymd)}
              className="border-border border-b px-3 py-2 text-left text-sm font-semibold hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {labels[i]} · {ymd.slice(8)}
            </button>
            <ul className="flex flex-1 flex-col gap-1 p-2">
              {dayRows.map((r) => {
                const border = bookingCardBorderClasses(r.status)
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(r)}
                      aria-label={`${r.time}, ${r.name}, ${bookingStatusAriaLabel(r.status)}`}
                      className={`w-full rounded-md bg-surface px-2 py-1.5 text-left text-xs transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${border}`}
                    >
                      <div className="font-medium text-foreground">{r.time}</div>
                      <div className="truncate text-muted">{r.name}</div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function DetailPanel({
  row,
  onClose,
  onCancel,
  onNoShow,
}: {
  row: ReservationRow
  onClose: () => void
  onCancel: () => void
  onNoShow: () => void
}) {
  const dur = bookingDurationMinutes(row)
  const start = timeToMinutes(row.time)
  const endMin = start + dur
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const { label: stLabel, variant } = statusBadge(row.status)

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close panel" onClick={onClose} />
      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col border-border border-l bg-background shadow-xl"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-border border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">Appointment</h2>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto px-4 py-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-muted">Customer</dt>
              <dd className="text-foreground">{row.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Phone</dt>
              <dd className="text-foreground">{row.phone}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Email</dt>
              <dd className="text-foreground">{row.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Service</dt>
              <dd className="text-foreground">{row.serviceName ?? row.serviceId ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Duration</dt>
              <dd className="text-foreground">{dur} minutes</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">When</dt>
              <dd className="text-foreground">
                {formatPrettyDate(row.date)} · {fmt(start)} – {fmt(endMin)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Notes</dt>
              <dd className="text-foreground">{row.notes?.trim() ? row.notes : '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Status</dt>
              <dd>
                <Badge label={stLabel} variant={variant} />
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-2">
            <button
              type="button"
              disabled={row.status === 'cancelled'}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={onCancel}
            >
              Cancel appointment…
            </button>
            <button
              type="button"
              disabled={row.status === 'no-show' || row.status === 'cancelled'}
              className="rounded-md bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={onNoShow}
            >
              Mark as no-show
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function NewAppointmentModal({
  clientId,
  initialDate,
  onClose,
  onCreated,
}: {
  clientId: string
  initialDate: string
  onClose: () => void
  onCreated: () => void
}) {
  const [services, setServices] = useState<{ id: string; name: string; durationMinutes: number }[]>(
    [],
  )
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selected = services.find((s) => s.id === serviceId)

  useEffect(() => {
    void fetch('/api/admin/services')
      .then((r) => r.json())
      .then((d: { services: { id: string; name: string; durationMinutes: number }[] }) => {
        setServices(d.services)
        if (d.services[0]) setServiceId(d.services[0].id)
      })
      .catch(() => setFormError('Could not load services.'))
  }, [])

  useEffect(() => {
    if (!selected || !date) {
      setBookedSlots([])
      return
    }
    const dur = selected.durationMinutes
    const url = `/api/availability?clientId=${encodeURIComponent(clientId)}&date=${encodeURIComponent(date)}&duration=${encodeURIComponent(String(dur))}`
    void fetch(url)
      .then((r) => (r.ok ? r.json() : { bookedSlots: [], outOfWindowSlots: [] }))
      .then((d: { bookedSlots?: string[]; outOfWindowSlots?: string[] }) => {
        const booked = d.bookedSlots ?? []
        const oow = d.outOfWindowSlots ?? []
        setBookedSlots([...new Set([...booked, ...oow])])
      })
      .catch(() => setBookedSlots([]))
  }, [clientId, date, selected])

  const openSlots = BOOKING_SLOT_GRID.filter((s) => !bookedSlots.includes(s))

  async function submit() {
    setFormError('')
    if (!selected || !time) {
      setFormError('Choose a service, date, and time.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selected.id,
          date,
          time,
          name,
          email,
          phone,
          notes,
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? 'Could not save.')
      }
      onCreated()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminModal
      open
      title="New appointment"
      labelledById="new-appt-title"
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="secondary" onClick={onClose} />
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </>
      }
    >
      {formError && <p className="mb-3 text-sm text-destructive">{formError}</p>}
      <Stack gap="md">
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Service
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min)
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Time
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <option value="">Select a slot</option>
            {openSlots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Customer name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Phone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
      </Stack>
    </AdminModal>
  )
}
