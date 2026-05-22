'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { AdminModal } from '@/components/admin/AdminModal'
import { Button } from '@/components/inputs/Button'
import type { BookingScheduleFile, DayCode, ScheduleException, WeeklyHoursRow } from '@/types/admin'
import { adminCopy, DAY_LABEL } from '@/components/admin/admin-copy'
import { adminDataUrl, adminFetch } from '@/lib/admin-api'

/** Hides the native clock/calendar affordance on `<input type="time" />`; the control remains usable. */
const TIME_INPUT_HIDE_NATIVE_ICON =
  '[&::-webkit-calendar-picker-indicator]:hidden [&::-moz-calendar-picker-indicator]:hidden'

/** Calendly-style week starting Sunday */
const DISPLAY_ORDER: WeeklyHoursRow['day'][] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const DAY_LETTER: Record<WeeklyHoursRow['day'], string> = {
  sun: 'D',
  mon: 'L',
  tue: 'M',
  wed: 'X',
  thu: 'J',
  fri: 'V',
  sat: 'S',
}

function sortWeekly(rows: WeeklyHoursRow[]): WeeklyHoursRow[] {
  return [...rows].sort((a, b) => DISPLAY_ORDER.indexOf(a.day) - DISPLAY_ORDER.indexOf(b.day))
}

function formatExceptionLabel(ex: ScheduleException): string {
  if (ex.closed) return adminCopy.availability.closed
  if (ex.from && ex.to) return `${ex.from} – ${ex.to}`
  return adminCopy.availability.custom
}

function formatBrowserTimeZoneLabel(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const d = new Date()
  const parts = new Intl.DateTimeFormat('es', { timeZone: tz, timeZoneName: 'long' }).formatToParts(d)
  const longName = parts.find((p) => p.type === 'timeZoneName')?.value
  return longName ?? tz.replaceAll('_', ' ')
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconRefreshLoop({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0114 0 7 7 0 007 7M19 15a7 7 0 01-14 0 7 7 0 00-7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCalendarOutline({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7V5m8 2V5m-9 8h10M6 21h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M16 5h2a2 2 0 012 2v8M8 5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2V5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconKebab({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  )
}

export default function AdminAvailabilityPage() {
  const [schedule, setSchedule] = useState<BookingScheduleFile | null>(null)
  const [weeklyDraft, setWeeklyDraft] = useState<WeeklyHoursRow[]>([])
  const [serviceCount, setServiceCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weeklyMsg, setWeeklyMsg] = useState('')
  const [weeklySaving, setWeeklySaving] = useState(false)
  const [exceptionOpen, setExceptionOpen] = useState(false)
  const [copyFromDay, setCopyFromDay] = useState<WeeklyHoursRow['day'] | null>(null)
  const [kebabOpen, setKebabOpen] = useState(false)
  const kebabWrapRef = useRef<HTMLDivElement>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [scheduleRes, servicesRes] = await Promise.all([
        adminFetch(adminDataUrl('/schedule')),
        adminFetch(adminDataUrl('/services')),
      ])
      if (!scheduleRes.ok) throw new Error(adminCopy.availability.errors.failedLoad)
      const data = (await scheduleRes.json()) as BookingScheduleFile
      setSchedule(data)
      setWeeklyDraft(sortWeekly(data.weekly))

      if (servicesRes.ok) {
        const svc = (await servicesRes.json()) as { services?: unknown[] }
        setServiceCount(Array.isArray(svc.services) ? svc.services.length : 0)
      } else {
        setServiceCount(0)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : adminCopy.availability.errors.loadFailed)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!kebabOpen) return
    function onPointerDown(e: MouseEvent) {
      const el = kebabWrapRef.current
      if (el && !el.contains(e.target as Node)) setKebabOpen(false)
    }
    const t = window.setTimeout(() => document.addEventListener('mousedown', onPointerDown), 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [kebabOpen])

  const exceptionsSorted = useMemo(() => {
    if (!schedule) return []
    return [...schedule.exceptions].sort((a, b) => a.date.localeCompare(b.date))
  }, [schedule])

  async function saveWeekly() {
    setWeeklySaving(true)
    setWeeklyMsg('')
    try {
      const weeklyOrdered = [...weeklyDraft].sort(
        (a, b) =>
          ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(a.day) -
          ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(b.day),
      )
      const res = await adminFetch(adminDataUrl('/schedule'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekly: weeklyOrdered }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? adminCopy.availability.errors.saveFailed)
      }
      const data = (await res.json()) as { schedule: BookingScheduleFile }
      setSchedule(data.schedule)
      setWeeklyDraft(sortWeekly(data.schedule.weekly))
      setWeeklyMsg(adminCopy.availability.scheduleSaved)
    } catch (e) {
      setWeeklyMsg(e instanceof Error ? e.message : adminCopy.availability.errors.saveFailed)
    } finally {
      setWeeklySaving(false)
    }
  }

  function updateRow(day: WeeklyHoursRow['day'], patch: Partial<WeeklyHoursRow>) {
    setWeeklyDraft((rows) => rows.map((r) => (r.day === day ? { ...r, ...patch } : r)))
  }

  function applyCopiedHours(source: WeeklyHoursRow, targets: DayCode[]) {
    setWeeklyDraft((rows) =>
      rows.map((r) =>
        targets.includes(r.day) ? { ...r, open: source.open, from: source.from, to: source.to } : r,
      ),
    )
  }

  async function deleteException(id: string) {
    const res = await adminFetch(adminDataUrl(`/schedule?id=${encodeURIComponent(id)}`), {
      method: 'DELETE',
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      setError(j.error ?? adminCopy.availability.errors.deleteFailed)
      return
    }
    const data = (await res.json()) as { schedule: BookingScheduleFile }
    setSchedule(data.schedule)
  }

  return (
    <div className="min-h-full bg-surface">
      <div className="w-full py-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {adminCopy.availability.heading}
        </h1>

        {error && (
          <div className="mt-6">
            <Alert variant="error" title={adminCopy.common.error} message={error} />
          </div>
        )}

        {loading || !schedule ? (
          <p className="mt-10 text-sm text-muted">{adminCopy.common.loading}</p>
        ) : (
          <div className="mt-8 border-0 bg-transparent shadow-none md:rounded-xl md:border md:border-border md:bg-background md:shadow-sm">
            <div className="border-b border-border px-0 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Horario</p>
                  <button
                    type="button"
                    className="mt-1 flex items-center gap-1 text-lg font-semibold text-primary hover:opacity-90"
                  >
                    Horario laboral (predeterminado)
                    <IconChevronDown className="text-primary" />
                  </button>
                  <Link
                    href="/admin/services"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Activo en: {serviceCount}{' '}
                    {serviceCount === 1 ? 'servicio' : 'servicios'}
                    <IconChevronRight className="text-primary" />
                  </Link>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="hidden rounded-lg border border-border p-0.5 sm:flex">
                    <button
                      type="button"
                      className="rounded-md bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm"
                    >
                      Lista
                    </button>
                    <button
                      type="button"
                      disabled
                      title="La vista de calendario aún no está disponible"
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted disabled:cursor-not-allowed"
                    >
                      Calendario
                    </button>
                  </div>
                  <div className="relative" ref={kebabWrapRef}>
                    <button
                      type="button"
                      aria-expanded={kebabOpen}
                      aria-haspopup="menu"
                      aria-label="Opciones del horario"
                      onClick={() => setKebabOpen((o) => !o)}
                      className="rounded-md p-2 text-muted hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <IconKebab />
                    </button>
                    {kebabOpen ? (
                      <div
                        role="menu"
                        className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-border bg-background py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-surface"
                          onClick={() => {
                            setKebabOpen(false)
                            void reload()
                          }}
                        >
                          Recargar horario
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-10 px-0 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:gap-8 lg:py-8">
              <section aria-labelledby="weekly-hours-heading" className="min-w-0">
                <div className="flex flex-wrap items-start gap-3">
                  <IconRefreshLoop className="mt-0.5 shrink-0 text-foreground" />
                  <div>
                    <h2 id="weekly-hours-heading" className="text-base font-semibold text-foreground">
                      {adminCopy.availability.weeklyHours}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">
                      Configure cuándo suele estar disponible para citas
                    </p>
                  </div>
                </div>

                <div className="mt-6 divide-y divide-border" role="list">
                  {sortWeekly(weeklyDraft).map((row) => (
                    <div
                      key={row.day}
                      role="listitem"
                      className="flex gap-3 py-3.5 first:pt-0"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white"
                        aria-hidden
                      >
                        {DAY_LETTER[row.day]}
                      </div>
                      <span className="sr-only">{DAY_LABEL[row.day]}</span>
                      <div className="min-w-0 flex-1">
                        {!row.open ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted">No disponible</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateRow(row.day, {
                                  open: true,
                                  from: '09:00',
                                  to: '17:00',
                                })
                              }
                              aria-label={adminCopy.availability.addHoursAria(DAY_LABEL[row.day])}
                              className="inline-flex rounded-md p-1 text-muted hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                            >
                              <IconPlus />
                            </button>
                          </div>
                        ) : (
                          <div className="flex min-w-0 flex-row items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                              <label className="sr-only" htmlFor={`from-${row.day}`}>
                                Desde · {DAY_LABEL[row.day]}
                              </label>
                              <input
                                id={`from-${row.day}`}
                                type="time"
                                value={row.from}
                                onChange={(e) => updateRow(row.day, { from: e.target.value })}
                                className={`min-w-0 flex-1 basis-0 rounded-full border border-border bg-surface px-2 py-1.5 text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:min-w-[6.5rem] sm:flex-none sm:basis-auto sm:px-3 sm:py-2 sm:text-sm ${TIME_INPUT_HIDE_NATIVE_ICON}`}
                              />
                              <span className="shrink-0 text-sm text-muted">–</span>
                              <label className="sr-only" htmlFor={`to-${row.day}`}>
                                Hasta · {DAY_LABEL[row.day]}
                              </label>
                              <input
                                id={`to-${row.day}`}
                                type="time"
                                value={row.to}
                                onChange={(e) => updateRow(row.day, { to: e.target.value })}
                                className={`min-w-0 flex-1 basis-0 rounded-full border border-border bg-surface px-2 py-1.5 text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:min-w-[6.5rem] sm:flex-none sm:basis-auto sm:px-3 sm:py-2 sm:text-sm ${TIME_INPUT_HIDE_NATIVE_ICON}`}
                              />
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5 sm:ml-2 sm:gap-1">
                              <button
                                type="button"
                                aria-label={adminCopy.availability.removeHoursAria(DAY_LABEL[row.day])}
                                onClick={() => updateRow(row.day, { open: false })}
                                className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:p-2"
                              >
                                <IconClose />
                              </button>
                              <button
                                type="button"
                                disabled
                                title="Un intervalo por día. Rangos partidos podrían añadirse más adelante."
                                aria-label={`Añadir otro intervalo para ${DAY_LABEL[row.day]} (no disponible)`}
                                className="rounded-md p-1.5 text-muted opacity-40 disabled:cursor-not-allowed sm:p-2"
                              >
                                <IconPlus />
                              </button>
                              <button
                                type="button"
                                aria-label={`Copiar el horario de ${DAY_LABEL[row.day]} a otros días`}
                                onClick={() => setCopyFromDay(row.day)}
                                className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:p-2"
                              >
                                <IconCopy />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  {formatBrowserTimeZoneLabel()}
                  <IconChevronDown className="text-primary" />
                </button>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                  <button
                    type="button"
                    disabled={weeklySaving}
                    onClick={() => void saveWeekly()}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg shadow-sm hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {adminCopy.availability.saveSchedule}
                  </button>
                  {weeklyMsg ? (
                    <span className="text-sm text-muted" role="status">
                      {weeklyMsg}
                    </span>
                  ) : null}
                </div>
              </section>

              <section
                aria-labelledby="date-specific-heading"
                className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <IconCalendarOutline className="mt-0.5 shrink-0 text-foreground" />
                    <div>
                      <h2 id="date-specific-heading" className="text-base font-semibold text-foreground">
                        {adminCopy.availability.dateSpecificHours}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted">Ajuste el horario de días concretos</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExceptionOpen(true)}
                    className="shrink-0 rounded-lg border-2 border-primary bg-background px-4 py-2 text-sm font-semibold text-primary hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {adminCopy.availability.addHoursButton}
                  </button>
                </div>

                <ul className="mt-6 flex flex-col gap-2">
                  {exceptionsSorted.length === 0 ? (
                    <li className="text-sm text-muted">Aún no hay excepciones por fecha.</li>
                  ) : (
                    exceptionsSorted.map((ex) => (
                      <li
                        key={ex.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5"
                      >
                        <div>
                          <span className="font-medium text-foreground">
                            {new Date(`${ex.date}T12:00:00`).toLocaleDateString('es', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="ml-2 text-sm text-muted">{formatExceptionLabel(ex)}</span>
                        </div>
                        <button
                          type="button"
                          aria-label={adminCopy.availability.removeExceptionAria(ex.date)}
                          onClick={() => void deleteException(ex.id)}
                          className="rounded-md p-2 text-destructive hover:bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          <IconClose />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>

      {exceptionOpen && schedule && (
        <ExceptionModal
          onClose={() => setExceptionOpen(false)}
          onSaved={(next) => {
            setSchedule(next)
            setExceptionOpen(false)
          }}
        />
      )}

      {copyFromDay !== null && (
        <CopyHoursModal
          sourceDay={copyFromDay}
          weeklyDraft={weeklyDraft}
          onClose={() => setCopyFromDay(null)}
          onApply={(targets) => {
            const src = weeklyDraft.find((r) => r.day === copyFromDay)
            if (src) applyCopiedHours(src, targets)
            setCopyFromDay(null)
          }}
        />
      )}
    </div>
  )
}

function CopyHoursModal({
  sourceDay,
  weeklyDraft,
  onClose,
  onApply,
}: {
  sourceDay: WeeklyHoursRow['day']
  weeklyDraft: WeeklyHoursRow[]
  onClose: () => void
  onApply: (targets: DayCode[]) => void
}) {
  const others = DISPLAY_ORDER.filter((d) => d !== sourceDay)
  const [picked, setPicked] = useState<Set<DayCode>>(() => new Set())

  function toggle(day: DayCode) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  return (
    <AdminModal
      open
      title={`Copiar horario desde ${DAY_LABEL[sourceDay]}`}
      labelledById="copy-hours-title"
      onClose={onClose}
      footer={
        <>
          <Button label={adminCopy.common.cancel} variant="secondary" onClick={onClose} />
          <button
            type="button"
            onClick={() => onApply([...picked])}
            disabled={picked.size === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Aplicar a {picked.size || '…'} {picked.size === 1 ? 'día' : 'días'}
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted">
        Copie {weeklyDraft.find((r) => r.day === sourceDay)?.open ? 'este horario' : '«no disponible»'}{' '}
        a:
      </p>
      <ul className="flex flex-col gap-2">
        {others.map((day) => (
          <li key={day}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={picked.has(day)}
                onChange={() => toggle(day)}
                className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary"
              />
              {DAY_LABEL[day]}
            </label>
          </li>
        ))}
      </ul>
    </AdminModal>
  )
}

function ExceptionModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (s: BookingScheduleFile) => void
}) {
  const [date, setDate] = useState('')
  const [mode, setMode] = useState<'closed' | 'custom'>('closed')
  const [from, setFrom] = useState('09:00')
  const [to, setTo] = useState('18:00')
  const [err, setErr] = useState('')

  async function submit() {
    setErr('')
    const body = mode === 'closed' ? { date, closed: true } : { date, closed: false, from, to }
    const res = await adminFetch(adminDataUrl('/schedule'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      setErr(j.error ?? adminCopy.appointmentForm.saveFailed)
      return
    }
    const data = (await res.json()) as { schedule: BookingScheduleFile }
    onSaved(data.schedule)
  }

  return (
    <AdminModal
      open
      title={adminCopy.availability.addException}
      labelledById="ex-title"
      onClose={onClose}
      footer={
        <>
          <Button label={adminCopy.common.cancel} variant="secondary" onClick={onClose} />
          <button
            type="button"
            onClick={() => void submit()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {adminCopy.availability.saveException}
          </button>
        </>
      }
    >
      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}
      <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
        {adminCopy.availability.date}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        />
      </label>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-foreground">Tipo de sustitución</legend>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="ex-mode"
              checked={mode === 'closed'}
              onChange={() => setMode('closed')}
              className="text-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
            {adminCopy.availability.closed}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="ex-mode"
              checked={mode === 'custom'}
              onChange={() => setMode('custom')}
              className="text-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
            {adminCopy.availability.customHours}
          </label>
        </div>
      </fieldset>
      {mode === 'custom' && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            {adminCopy.availability.from}
            <input
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={`rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${TIME_INPUT_HIDE_NATIVE_ICON}`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            {adminCopy.availability.to}
            <input
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={`rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${TIME_INPUT_HIDE_NATIVE_ICON}`}
            />
          </label>
        </div>
      )}
    </AdminModal>
  )
}
