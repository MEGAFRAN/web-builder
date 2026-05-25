'use client'

import { useCallback, useEffect, useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { Badge } from '@/components/content/Badge'
import { Button } from '@/components/inputs/Button'
import { Heading } from '@/components/content/Heading'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { AdminModal } from '@/components/admin/AdminModal'
import type { AdminBookingService } from '@/types/admin'
import { adminCopy } from '@/components/admin/admin-copy'
import { adminDataUrl, adminFetch } from '@/lib/admin-api'

function formatPrice(price: number, currency: string): string {
  const text = Number.isInteger(price)
    ? String(price)
    : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currency}${text}`
}

type ServiceCategoryGroup = {
  category: string
  services: AdminBookingService[]
}

/** Preserves catalog order; first appearance of each category defines group order. */
function groupServicesByCategory(services: AdminBookingService[]): ServiceCategoryGroup[] {
  const groups: ServiceCategoryGroup[] = []
  const indexByCategory = new Map<string, number>()

  for (const svc of services) {
    const category = svc.category?.trim() ?? ''
    let ix = indexByCategory.get(category)
    if (ix === undefined) {
      ix = groups.length
      indexByCategory.set(category, ix)
      groups.push({ category, services: [] })
    }
    groups[ix].services.push(svc)
  }

  return groups
}

const NEW_CATEGORY_VALUE = '__new__'

/** Unique non-empty categories in catalog order (first appearance). */
function collectServiceCategories(services: AdminBookingService[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const svc of services) {
    const category = svc.category?.trim()
    if (category && !seen.has(category)) {
      seen.add(category)
      out.push(category)
    }
  }
  return out
}

function ServiceCategoryField({
  existingCategories,
  value,
  onChange,
}: {
  existingCategories: string[]
  value: string
  onChange: (value: string) => void
}) {
  const trimmed = value.trim()
  const hasExisting = existingCategories.length > 0
  const isCustomCategory = trimmed.length > 0 && !existingCategories.includes(trimmed)
  const [mode, setMode] = useState<'select' | 'new'>(() => {
    if (!hasExisting) return 'new'
    if (isCustomCategory) return 'new'
    return 'select'
  })

  const selectValue =
    mode === 'new' ? NEW_CATEGORY_VALUE : trimmed

  function clearCategory() {
    onChange('')
    setMode('select')
  }

  if (!hasExisting) {
    return (
      <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
        {adminCopy.services.form.category}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={adminCopy.services.form.newCategoryPlaceholder}
          className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        />
        <span className="font-normal text-xs text-muted">
          {adminCopy.services.form.newCategoryHint}
        </span>
      </label>
    )
  }

  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-foreground">
      <span id="svc-category-label">{adminCopy.services.form.category}</span>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-labelledby="svc-category-label"
          value={selectValue}
          onChange={(e) => {
            const next = e.target.value
            if (next === NEW_CATEGORY_VALUE) {
              setMode('new')
              onChange('')
              return
            }
            setMode('select')
            onChange(next)
          }}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <option value="">{adminCopy.services.form.noCategory}</option>
          {existingCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value={NEW_CATEGORY_VALUE}>{adminCopy.services.form.newCategory}</option>
        </select>
        {trimmed && mode === 'select' ? (
          <button
            type="button"
            aria-label={adminCopy.services.form.removeCategory(trimmed)}
            onClick={clearCategory}
            className="rounded-md border border-border px-2 py-2 text-muted hover:bg-muted-bg hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            ✕
          </button>
        ) : null}
      </div>
      {mode === 'new' ? (
        <div className="flex flex-col gap-2">
          <input
            aria-label={adminCopy.services.form.newCategoryPlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={adminCopy.services.form.newCategoryPlaceholder}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setMode('select')
              onChange('')
            }}
            className="self-start text-xs font-normal text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {adminCopy.services.form.pickExistingCategory}
          </button>
        </div>
      ) : null}
      <span className="font-normal text-xs text-muted">
        Cada servicio puede tener como máximo una categoría. Los servicios con la misma categoría se agrupan bajo un encabezado.
      </span>
    </div>
  )
}

function ServiceCard({
  service: s,
  dragId,
  expandedId,
  onDragStart,
  onDragEnd,
  onDrop,
  onToggleExpanded,
  onEdit,
  onDelete,
}: {
  service: AdminBookingService
  dragId: string | null
  expandedId: string | null
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: () => void
  onToggleExpanded: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`rounded-xl border border-border bg-surface p-4 shadow-sm ${
        dragId === s.id ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden className="cursor-grab text-muted active:cursor-grabbing">
              ⋮⋮
            </span>
            <h3 className="truncate text-lg font-semibold text-foreground">{s.name}</h3>
            <Badge label={`${s.durationMinutes} min`} variant="default" />
            <Badge label={formatPrice(s.price, s.currency)} variant="default" />
          </div>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="mt-2 max-w-full text-left text-sm text-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-expanded={expandedId === s.id}
          >
            <span className={expandedId === s.id ? '' : 'line-clamp-2'}>
              {s.description.trim() ? s.description : adminCopy.common.noDescription}
            </span>
            <span className="ml-1 text-primary underline">
              {expandedId === s.id ? adminCopy.common.showLess : adminCopy.common.expand}
            </span>
          </button>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label={adminCopy.services.editAria(s.name)}
            onClick={onEdit}
            className="rounded-md border border-border p-2 hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            ✎
          </button>
          <button
            type="button"
            aria-label={adminCopy.services.deleteAria(s.name)}
            onClick={onDelete}
            className="rounded-md border border-border p-2 text-destructive hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            ✕
          </button>
        </div>
      </div>
    </article>
  )
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminBookingService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBookingService | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminBookingService | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const fetchServices = useCallback(async (signal?: { cancelled: boolean }) => {
    try {
      const res = await adminFetch(adminDataUrl('/services'))
      if (signal?.cancelled) return
      if (!res.ok) throw new Error(adminCopy.services.errors.failedLoad)
      const data = (await res.json()) as { services: AdminBookingService[] }
      if (signal?.cancelled) return
      setServices(data.services)
    } catch (e) {
      if (signal?.cancelled) return
      setError(e instanceof Error ? e.message : adminCopy.services.errors.loadFailed)
    } finally {
      if (!signal?.cancelled) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const signal = { cancelled: false }
    queueMicrotask(() => {
      void fetchServices(signal)
    })
    return () => {
      signal.cancelled = true
    }
  }, [fetchServices])

  async function persist(next: AdminBookingService[]) {
    setSaveError('')
    const res = await adminFetch(adminDataUrl('/services'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: next }),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(j.error ?? adminCopy.services.errors.saveFailed)
    }
    setServices(next)
  }

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(s: AdminBookingService) {
    setEditing(s)
    setModalOpen(true)
  }

  async function handleReorder(fromId: string, toId: string) {
    if (fromId === toId) return
    const ixFrom = services.findIndex((s) => s.id === fromId)
    const ixTo = services.findIndex((s) => s.id === toId)
    if (ixFrom < 0 || ixTo < 0) return
    const next = [...services]
    const [item] = next.splice(ixFrom, 1)
    next.splice(ixTo, 0, item)
    try {
      await persist(next)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : adminCopy.services.errors.reorderFailed)
    }
  }

  return (
    <Section paddingY="lg" background="white">
      <Stack gap="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Heading text={adminCopy.services.heading} level="h1" />
            <p className="mt-1 text-sm text-muted">
              Arrastre las tarjetas para cambiar el orden que ven los clientes en el widget de reservas.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {adminCopy.services.addServiceButton}
          </button>
        </div>

        {error && <Alert variant="error" title={adminCopy.common.error} message={error} />}
        {saveError && <Alert variant="error" title={adminCopy.common.error} message={saveError} />}

        {loading ? (
          <p className="text-sm text-muted">{adminCopy.common.loading}</p>
        ) : services.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted-bg px-6 py-14 text-center">
            <p className="text-foreground">{adminCopy.services.emptyOnboarding}</p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {adminCopy.services.addServiceButton}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groupServicesByCategory(services).map((group) => (
              <section key={group.category || '__uncategorized'}>
                <h2 className="mb-3 text-base font-semibold text-foreground">
                  {group.category || adminCopy.services.uncategorized}
                </h2>
                <ul className="flex flex-col gap-3">
                  {group.services.map((s) => (
                    <li key={s.id}>
                      <ServiceCard
                        service={s}
                        dragId={dragId}
                        expandedId={expandedId}
                        onDragStart={() => setDragId(s.id)}
                        onDragEnd={() => setDragId(null)}
                        onDrop={() => dragId && void handleReorder(dragId, s.id)}
                        onToggleExpanded={() =>
                          setExpandedId((id) => (id === s.id ? null : s.id))
                        }
                        onEdit={() => openEdit(s)}
                        onDelete={() => setDeleteTarget(s)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Stack>

      {modalOpen && (
        <ServiceFormModal
          initial={editing}
          existingCategories={collectServiceCategories(services)}
          onClose={() => setModalOpen(false)}
          onSave={async (row) => {
            const next = editing
              ? services.map((x) => (x.id === row.id ? row : x))
              : [...services, row]
            await persist(next)
            setModalOpen(false)
          }}
        />
      )}

      <AdminModal
        open={deleteTarget !== null}
        title={adminCopy.services.deleteServiceTitle}
        labelledById="del-svc-title"
        descriptionId="del-svc-desc"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button label={adminCopy.common.back} variant="secondary" onClick={() => setDeleteTarget(null)} />
            <button
              type="button"
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => {
                if (!deleteTarget) return
                const next = services.filter((x) => x.id !== deleteTarget.id)
                void persist(next).catch((e) =>
                  setSaveError(e instanceof Error ? e.message : adminCopy.services.errors.deleteFailed),
                )
                setDeleteTarget(null)
              }}
            >
              {adminCopy.common.delete}
            </button>
          </>
        }
      >
        <p id="del-svc-desc" className="text-sm text-muted">
          Esta acción no se puede deshacer. Las reservas existentes que usen este servicio pueden mostrar una etiqueta genérica.
        </p>
      </AdminModal>
    </Section>
  )
}

function ServiceFormModal({
  initial,
  existingCategories,
  onClose,
  onSave,
}: {
  initial: AdminBookingService | null
  existingCategories: string[]
  onClose: () => void
  onSave: (row: AdminBookingService) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? 60))
  const [price, setPrice] = useState(String(initial?.price ?? 0))
  const [currency, setCurrency] = useState(initial?.currency ?? '€')
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setFormError('')
    const dm = Number.parseInt(durationMinutes, 10)
    const pr = Number.parseFloat(price)
    if (!name.trim()) {
      setFormError(adminCopy.services.form.nameRequired)
      return
    }
    if (!Number.isFinite(dm) || dm < 1 || dm > 24 * 60) {
      setFormError(adminCopy.services.form.durationRange)
      return
    }
    if (!Number.isFinite(pr) || pr < 0) {
      setFormError(adminCopy.services.form.priceNonNegative)
      return
    }
    const trimmedCategory = category.trim()
    const row: AdminBookingService = {
      id: initial?.id ?? `svc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      description: description.trim(),
      durationMinutes: dm,
      price: pr,
      currency: currency.trim() || '€',
      ...(trimmedCategory ? { category: trimmedCategory } : {}),
    }
    setBusy(true)
    try {
      await onSave(row)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : adminCopy.services.errors.saveFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminModal
      open
      title={initial ? adminCopy.services.editService : adminCopy.services.addService}
      labelledById="svc-form-title"
      onClose={onClose}
      footer={
        <>
          <Button label={adminCopy.common.cancel} variant="secondary" onClick={onClose} />
          <button
            type="button"
            disabled={busy}
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
          {adminCopy.services.form.name}
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
        <ServiceCategoryField
          existingCategories={existingCategories}
          value={category}
          onChange={setCategory}
        />
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.services.form.description}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.services.form.duration}
          <input
            type="number"
            min={1}
            max={1440}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <span className="font-normal text-xs text-muted">
            Define la duración de cada franja que ven los clientes al elegir este servicio.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.services.form.price}
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          {adminCopy.services.form.currency}
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
      </Stack>
    </AdminModal>
  )
}
