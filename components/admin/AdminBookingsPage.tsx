'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { Heading } from '@/components/content/Heading'
import { AdminModal } from '@/components/admin/AdminModal'
import { CalendarNavBar } from '@/components/admin/bookings/CalendarNavBar'
import { CalendarEmptyState } from '@/components/admin/bookings/CalendarEmptyState'
import { DayTimeline } from '@/components/admin/bookings/DayTimeline'
import { WeekGrid } from '@/components/admin/bookings/WeekGrid'
import { BookingDetailDrawer } from '@/components/admin/bookings/BookingDetailDrawer'
import { NewAppointmentModal } from '@/components/admin/bookings/NewAppointmentModal'

import { formatYmd, mondayOfWeek, addDaysYmd } from '@/lib/booking-utils'
import { adminCopy, formatPrettyDateEs } from '@/components/admin/admin-copy'
import { resolveDayMinutesWindow } from '@/lib/booking-schedule-window'
import type { BookingScheduleFile, ReservationRow } from '@/types/admin'
import { SimpleDayList } from '@/components/admin/bookings/SimpleDayList'
import { useAdminAuth } from '@/lib/admin-auth-context'
import { adminDataUrl, adminFetch } from '@/lib/admin-api'

export default function AdminBookingsPage() {
  const { session } = useAdminAuth()
  const clientId = session?.clientId ?? ''
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

  const fetchRange = useCallback(async (start: string, end: string) => {
    setLoading(true)
    setError('')
    try {
      const [rs, sch] = await Promise.all([
        adminFetch(adminDataUrl(`/reservations?startDate=${start}&endDate=${end}`)).then(async (r) => {
          if (!r.ok) throw new Error(adminCopy.bookings.errors.failedReservations)
          return r.json() as Promise<{ reservations: ReservationRow[] }>
        }),
        adminFetch(adminDataUrl('/schedule')).then(async (r) => {
          if (!r.ok) throw new Error(adminCopy.bookings.errors.failedSchedule)
          return r.json() as Promise<BookingScheduleFile>
        }),
      ])
      setRows(rs.reservations)
      setSchedule(sch)
    } catch (e) {
      setError(e instanceof Error ? e.message : adminCopy.bookings.errors.generic)
    } finally {
      setLoading(false)
    }
  }, [])

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
    const res = await adminFetch(adminDataUrl(`/reservations/${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(j.error ?? adminCopy.bookings.errors.updateFailed)
    }
    setDetail(null)
    void fetchRange(
      view === 'day' ? selectedYmd : weekStart,
      view === 'day' ? selectedYmd : weekEnd,
    )
  }

  function refreshRange() {
    void fetchRange(
      view === 'day' ? selectedYmd : weekStart,
      view === 'day' ? selectedYmd : weekEnd,
    )
  }

  return (
    <Section paddingY="lg" background="white">
      <Stack gap="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Heading text={adminCopy.bookings.heading} level="h1" />
            <p className="mt-1 text-sm text-muted">
              Vistas diaria y semanal de las próximas citas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {adminCopy.bookings.newAppointmentButton}
            </button>
          </div>
        </div>

        {error && <Alert variant="error" title={adminCopy.common.error} message={error} />}

        <CalendarNavBar
          selectedYmd={selectedYmd}
          onSelectedYmdChange={setSelectedYmd}
          view={view}
          onViewChange={setView}
        />

        {loading ? (
          <p className="text-sm text-muted">{adminCopy.common.loading}</p>
        ) : view === 'day' ? (
          dayWindow === null && dayRows.length === 0 ? (
            <CalendarEmptyState
              variant="closed"
              dateLabel={formatPrettyDateEs(selectedYmd)}
              onCreate={() => setCreateOpen(true)}
            />
          ) : dayWindow === null && dayRows.length > 0 ? (
            <SimpleDayList rows={dayRows} onSelect={setDetail} />
          ) : dayRows.length === 0 ? (
            <CalendarEmptyState variant="empty" onCreate={() => setCreateOpen(true)} />
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
        <BookingDetailDrawer
          row={detail}
          onClose={() => setDetail(null)}
          onCancel={() => setCancelOpen(true)}
          onNoShow={() => void patchReservation(detail.id, 'no-show')}
        />
      )}

      <AdminModal
        open={cancelOpen}
        title={adminCopy.bookings.cancelModalTitle}
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
              {adminCopy.common.back}
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
              {adminCopy.bookings.confirmCancel}
            </button>
          </>
        }
      >
        <p id="cancel-appt-desc" className="text-sm text-muted">
          Puede añadir una nota interna para sus registros (solo visible aquí).
        </p>
        <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-foreground">
          Motivo (opcional)
          <input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal placeholder-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            placeholder="p. ej., El cliente pidió cancelar"
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
            refreshRange()
          }}
        />
      )}
    </Section>
  )
}
