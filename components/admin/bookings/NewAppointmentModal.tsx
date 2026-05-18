'use client'

import { useEffect, useState } from 'react'
import { AdminModal } from '@/components/admin/AdminModal'
import { Button } from '@/components/inputs/Button'
import { Stack } from '@/components/layout/Stack'
import { BOOKING_SLOT_GRID } from '@/lib/booking-slot-grid'

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

  useEffect(() => {
    void fetch('/api/admin/services')
      .then((r) => r.json())
      .then((d: { services: Service[] }) => {
        setServices(d.services)
        if (d.services[0]) setServiceId(d.services[0].id)
      })
      .catch(() => setFormError('No se pudieron cargar los servicios.'))
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
      setFormError('Seleccione un servicio, una fecha y una hora.')
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
        throw new Error(j.error ?? 'No se pudo guardar.')
      }
      onCreated()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminModal
      open
      title="Nueva cita"
      labelledById="new-appt-title"
      onClose={onClose}
      footer={
        <>
          <Button label="Cancelar" variant="secondary" onClick={onClose} />
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
          >
            Guardar
          </button>
        </>
      }
    >
      {formError && <p className="mb-3 text-sm text-destructive">{formError}</p>}
      <Stack gap="md">
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Servicio
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
          Fecha
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Hora
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <option value="">Elija una franja</option>
            {openSlots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Nombre del cliente
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Teléfono
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Notas
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
