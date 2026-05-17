'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { Heading } from '@/components/content/Heading'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { AdminModal } from '@/components/admin/AdminModal'
import { Button } from '@/components/inputs/Button'
import type { BookingScheduleFile, ScheduleException, WeeklyHoursRow } from '@/types/admin'

const DAY_LABEL: Record<WeeklyHoursRow['day'], string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const ORDER: WeeklyHoursRow['day'][] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function sortWeekly(rows: WeeklyHoursRow[]): WeeklyHoursRow[] {
  return [...rows].sort((a, b) => ORDER.indexOf(a.day) - ORDER.indexOf(b.day))
}

function formatExceptionLabel(ex: ScheduleException): string {
  if (ex.closed) return 'Closed'
  if (ex.from && ex.to) return `${ex.from} – ${ex.to}`
  return 'Custom'
}

export default function AdminAvailabilityPage() {
  const [schedule, setSchedule] = useState<BookingScheduleFile | null>(null)
  const [weeklyDraft, setWeeklyDraft] = useState<WeeklyHoursRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weeklyMsg, setWeeklyMsg] = useState('')
  const [weeklySaving, setWeeklySaving] = useState(false)
  const [exceptionOpen, setExceptionOpen] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/schedule')
      if (!res.ok) throw new Error('Failed to load schedule.')
      const data = (await res.json()) as BookingScheduleFile
      setSchedule(data)
      setWeeklyDraft(sortWeekly(data.weekly))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const exceptionsSorted = useMemo(() => {
    if (!schedule) return []
    return [...schedule.exceptions].sort((a, b) => a.date.localeCompare(b.date))
  }, [schedule])

  async function saveWeekly() {
    setWeeklySaving(true)
    setWeeklyMsg('')
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekly: weeklyDraft }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? 'Save failed.')
      }
      const data = (await res.json()) as { schedule: BookingScheduleFile }
      setSchedule(data.schedule)
      setWeeklyDraft(sortWeekly(data.schedule.weekly))
      setWeeklyMsg('Schedule saved.')
    } catch (e) {
      setWeeklyMsg(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setWeeklySaving(false)
    }
  }

  function updateRow(day: WeeklyHoursRow['day'], patch: Partial<WeeklyHoursRow>) {
    setWeeklyDraft((rows) =>
      rows.map((r) => (r.day === day ? { ...r, ...patch } : r)),
    )
  }

  async function deleteException(id: string) {
    const res = await fetch(`/api/admin/schedule?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      setError(j.error ?? 'Could not delete.')
      return
    }
    const data = (await res.json()) as { schedule: BookingScheduleFile }
    setSchedule(data.schedule)
  }

  return (
    <Section paddingY="lg" background="white">
      <Stack gap="xl">
        <div>
          <Heading text="Availability" level="h1" />
          <p className="mt-1 text-sm text-muted">
            Weekly defaults apply until overridden by a dated exception below.
          </p>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}

        {loading || !schedule ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <section aria-labelledby="weekly-hours-heading">
              <h2 id="weekly-hours-heading" className="text-xl font-semibold text-foreground">
                Weekly hours
              </h2>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[36rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-border border-b bg-muted-bg text-left">
                      <th className="px-3 py-2 font-semibold text-foreground">Day</th>
                      <th className="px-3 py-2 font-semibold text-foreground">Open</th>
                      <th className="px-3 py-2 font-semibold text-foreground">From</th>
                      <th className="px-3 py-2 font-semibold text-foreground">To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortWeekly(weeklyDraft).map((row) => (
                      <tr key={row.day} className="border-border border-b last:border-b-0">
                        <td className="px-3 py-3 font-medium text-foreground">
                          {DAY_LABEL[row.day]}
                        </td>
                        <td className="px-3 py-3">
                          <label className="flex items-center gap-2 text-foreground">
                            <input
                              type="checkbox"
                              checked={row.open}
                              onChange={(e) => updateRow(row.day, { open: e.target.checked })}
                              className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary"
                            />
                            <span>{row.open ? 'Open' : 'Closed'}</span>
                          </label>
                        </td>
                        <td className="px-3 py-3">
                          <label className="sr-only" htmlFor={`from-${row.day}`}>
                            From · {DAY_LABEL[row.day]}
                          </label>
                          <input
                            id={`from-${row.day}`}
                            type="time"
                            disabled={!row.open}
                            value={row.from}
                            onChange={(e) => updateRow(row.day, { from: e.target.value })}
                            className="w-full rounded-md border border-border px-2 py-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <label className="sr-only" htmlFor={`to-${row.day}`}>
                            To · {DAY_LABEL[row.day]}
                          </label>
                          <input
                            id={`to-${row.day}`}
                            type="time"
                            disabled={!row.open}
                            value={row.to}
                            onChange={(e) => updateRow(row.day, { to: e.target.value })}
                            className="w-full rounded-md border border-border px-2 py-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={weeklySaving}
                  onClick={() => void saveWeekly()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  Save schedule
                </button>
                {weeklyMsg && (
                  <span className="text-sm text-muted" role="status">
                    {weeklyMsg}
                  </span>
                )}
              </div>
            </section>

            <section aria-labelledby="exceptions-heading">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="exceptions-heading" className="text-xl font-semibold text-foreground">
                  Exceptions
                </h2>
                <button
                  type="button"
                  onClick={() => setExceptionOpen(true)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  + Add exception
                </button>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {exceptionsSorted.length === 0 ? (
                  <li className="text-sm text-muted">No exceptions yet.</li>
                ) : (
                  exceptionsSorted.map((ex) => (
                    <li
                      key={ex.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <div>
                        <span className="font-medium text-foreground">
                          {new Date(`${ex.date}T12:00:00`).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="ml-2 text-sm text-muted">{formatExceptionLabel(ex)}</span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove exception ${ex.date}`}
                        onClick={() => void deleteException(ex.id)}
                        className="rounded-md p-2 text-destructive hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        ✕
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </>
        )}
      </Stack>

      {exceptionOpen && schedule && (
        <ExceptionModal
          onClose={() => setExceptionOpen(false)}
          onSaved={(next) => {
            setSchedule(next)
            setExceptionOpen(false)
          }}
        />
      )}
    </Section>
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
    const body =
      mode === 'closed'
        ? { date, closed: true }
        : { date, closed: false, from, to }
    const res = await fetch('/api/admin/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      setErr(j.error ?? 'Could not save.')
      return
    }
    const data = (await res.json()) as { schedule: BookingScheduleFile }
    onSaved(data.schedule)
  }

  return (
    <AdminModal
      open
      title="Add exception"
      labelledById="ex-title"
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="secondary" onClick={onClose} />
          <button
            type="button"
            onClick={() => void submit()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Save exception
          </button>
        </>
      }
    >
      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}
      <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        />
      </label>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-foreground">Override type</legend>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="ex-mode"
              checked={mode === 'closed'}
              onChange={() => setMode('closed')}
              className="text-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
            Closed
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="ex-mode"
              checked={mode === 'custom'}
              onChange={() => setMode('custom')}
              className="text-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
            Custom hours
          </label>
        </div>
      </fieldset>
      {mode === 'custom' && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            From
            <input
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            To
            <input
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            />
          </label>
        </div>
      )}
    </AdminModal>
  )
}
