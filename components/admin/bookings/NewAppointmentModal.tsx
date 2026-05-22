'use client'

import { useEffect, useState } from 'react'
import { AdminModal } from '@/components/admin/AdminModal'
import { Button } from '@/components/inputs/Button'
import { Stack } from '@/components/layout/Stack'
import { BOOKING_SLOT_GRID } from '@/lib/booking-slot-grid'
import { adminCopy } from '@/components/admin/admin-copy'
import { adminDataUrl, adminFetch } from '@/lib/admin-api'

type Service = {
  id: string
  name: string
  durationMinutes: number
}

interface NewAppointmentModalProps {
  clientId: string
  initialDate: string
  onClose: () => void
  onCreated: () => void
}

export function NewAppointmentModal({
  clientId,
  initialDate,
  onClose,
  onCreated,
}: NewAppointmentModalProps) {
  const [services, setServices] = useState<Service[]>([])
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
  const unavailableSlots = !selected || !date ? [] : bookedSlots

  useEffect(() => {
    void adminFetch(adminDataUrl('/services'))
      .then((r) => r.json())
      .then((d: { services: Service[] }) => {
        setServices(d.services)
        if (d.services[0]) setServiceId(d.services[0].id)
      })
      .catch(() => setFormError(adminCopy.appointmentForm.failedLoadServices))
  }, [])

  useEffect(() => {
    if (!selected || !date) return
    const dur = selected.durationMinutes
    const url = `/api/availability?clientId=${encodeURIComponent(clientId)}&date=${encodeURIComponent(date)}&duration=${encodeURIComponent(String(dur))}`
    let cancelled = false
    void fetch(url)
      .then((r) => (r.ok ? r.json() : { bookedSlots: [], outOfWindowSlots: [] }))
      .then((d: { bookedSlots?: string[]; outOfWindowSlots?: string[] }) => {
        if (cancelled) return
        const booked = d.bookedSlots ?? []
        const oow = d.outOfWindowSlots ?? []
        setBookedSlots([...new Set([...booked, ...oow])])
      })
      .catch(() => {
        if (!cancelled) setBookedSlots([])
      })
    return () => {
      cancelled = true
    }
  }, [clientId, date, selected])

  const openSlots = BOOKING_SLOT_GRID.filter((s) => !unavailableSlots.includes(s))

  async function submit() {
    setFormError('')
    if (!selected || !time) {
      setFormError(adminCopy.appointmentForm.selectServiceDateTime)
      return
    }
    setSubmitting(true)
    try {
      const res = await adminFetch(adminDataUrl('/reservations'), {
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
        throw new Error(j.error ?? adminCopy.appointmentForm.saveFailed)
      }
      onCreated()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : adminCopy.appointmentForm.saveError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminModal
      open
      title={adminCopy.appointmentForm.title}
      labelledById="new-appt-title"
      onClose={onClose}
      footer={
        <>
          <Button label={adminCopy.common.cancel} variant="secondary" onClick={onClose} />
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
          >
            {adminCopy.common.save}
          </button>
        </>
      }
    >
      {formError && <p className="mb-3 text-sm text-destructive">{formError}</p>}
      <Stack gap="md">
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.appointmentForm.service}
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
          {adminCopy.appointmentForm.date}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.appointmentForm.time}
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <option value="">{adminCopy.appointmentForm.chooseSlot}</option>
            {openSlots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.appointmentForm.customerName}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.appointmentForm.phone}
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.appointmentForm.email}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.appointmentForm.notes}
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
