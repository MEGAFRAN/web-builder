'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Section } from '@/components/layout/Section'
import { Stack } from '@/components/layout/Stack'
import { adminCopy } from '@/components/admin/admin-copy'
import { adminDataUrl, adminFetch, isRemoteAdminApi } from '@/lib/admin-api'
import type { CompanyProfile } from '@/types/admin'

const EMPTY_PROFILE: CompanyProfile = {
  businessName: '',
  phone: '',
  email: '',
  address: {
    street: '',
    city: '',
    postalCode: '',
    country: '',
  },
  hours: '',
  logoUrl: null,
  whatsapp: null,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FormState = {
  businessName: string
  phone: string
  email: string
  street: string
  city: string
  postalCode: string
  country: string
  hours: string
  logoUrl: string
  whatsapp: string
}

function profileToForm(profile: CompanyProfile | null): FormState {
  const base = profile ?? EMPTY_PROFILE
  return {
    businessName: base.businessName,
    phone: base.phone,
    email: base.email,
    street: base.address.street,
    city: base.address.city,
    postalCode: base.address.postalCode,
    country: base.address.country,
    hours: base.hours,
    logoUrl: base.logoUrl ?? '',
    whatsapp: base.whatsapp ?? '',
  }
}

function formToProfile(form: FormState): CompanyProfile {
  return {
    businessName: form.businessName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: {
      street: form.street.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
    },
    hours: form.hours.trim(),
    logoUrl: form.logoUrl.trim() ? form.logoUrl.trim() : null,
    whatsapp: form.whatsapp.trim() ? form.whatsapp.trim() : null,
  }
}

function validateForm(form: FormState): string[] {
  const missing: string[] = []
  const labels = adminCopy.companyProfile.form
  if (!form.businessName.trim()) missing.push(labels.businessName)
  if (!form.phone.trim()) missing.push(labels.phone)
  if (!form.email.trim() || !EMAIL_RE.test(form.email.trim())) missing.push(labels.email)
  if (!form.street.trim()) missing.push(labels.street)
  if (!form.city.trim()) missing.push(labels.city)
  if (!form.postalCode.trim()) missing.push(labels.postalCode)
  if (!form.country.trim()) missing.push(labels.country)
  return missing
}

function RequiredLabel({ htmlFor, text }: { htmlFor: string; text: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {text} <span aria-hidden="true">*</span>
    </label>
  )
}

function OptionalLabel({ htmlFor, text }: { htmlFor: string; text: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {text}
    </label>
  )
}

const inputClassName =
  'rounded-md border border-border px-3 py-2 text-sm font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

export default function AdminCompanyProfileForm() {
  const [form, setForm] = useState<FormState>(profileToForm(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const fetchProfile = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await adminFetch(adminDataUrl('/company-profile'))
      if (signal?.cancelled) return
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? adminCopy.companyProfile.form.saveError)
      }
      const data = (await res.json()) as { profile: CompanyProfile | null }
      if (signal?.cancelled) return
      setForm(profileToForm(data.profile))
    } catch (e) {
      if (signal?.cancelled) return
      setLoadError(e instanceof Error ? e.message : adminCopy.companyProfile.form.saveError)
    } finally {
      if (!signal?.cancelled) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const signal = { cancelled: false }
    queueMicrotask(() => {
      void fetchProfile(signal)
    })
    return () => {
      signal.cancelled = true
    }
  }, [fetchProfile])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')
    setSaveError('')
    setSaveSuccess('')

    const missing = validateForm(form)
    if (missing.length > 0) {
      setValidationError(`${adminCopy.companyProfile.form.validationError}${missing.join(', ')}.`)
      return
    }

    setSaving(true)
    try {
      const res = await adminFetch(adminDataUrl('/company-profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: formToProfile(form) }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? adminCopy.companyProfile.form.saveError)
      }
      setSaveSuccess(adminCopy.companyProfile.form.saveSuccess)
      await fetchProfile()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : adminCopy.companyProfile.form.saveError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section paddingY="lg" background="white">
      <Stack gap="md">
        <Heading text={adminCopy.settings.heading} level="h1" />
        <Text content={adminCopy.settings.intro} color="muted" size="sm" />

        {loadError ? (
          <Alert variant="error" title={adminCopy.common.error} message={loadError} />
        ) : null}

        {loading ? (
          <p className="text-sm text-muted">{adminCopy.common.loading}</p>
        ) : (
          <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {adminCopy.companyProfile.heading}
            </h2>
            <p className="mt-1 text-sm text-muted">{adminCopy.companyProfile.intro}</p>

            {validationError ? (
              <div className="mt-4">
                <Alert variant="error" title={adminCopy.common.error} message={validationError} />
              </div>
            ) : null}

            {saveError ? (
              <div className="mt-4">
                <Alert variant="error" title={adminCopy.common.error} message={saveError} />
              </div>
            ) : null}

            <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <RequiredLabel
                    htmlFor="company-businessName"
                    text={adminCopy.companyProfile.form.businessName}
                  />
                  <input
                    id="company-businessName"
                    name="businessName"
                    type="text"
                    required
                    aria-required="true"
                    value={form.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <RequiredLabel htmlFor="company-phone" text={adminCopy.companyProfile.form.phone} />
                  <input
                    id="company-phone"
                    name="phone"
                    type="tel"
                    required
                    aria-required="true"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <RequiredLabel htmlFor="company-email" text={adminCopy.companyProfile.form.email} />
                  <input
                    id="company-email"
                    name="email"
                    type="email"
                    required
                    aria-required="true"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <RequiredLabel htmlFor="company-street" text={adminCopy.companyProfile.form.street} />
                  <input
                    id="company-street"
                    name="street"
                    type="text"
                    required
                    aria-required="true"
                    value={form.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <RequiredLabel htmlFor="company-city" text={adminCopy.companyProfile.form.city} />
                  <input
                    id="company-city"
                    name="city"
                    type="text"
                    required
                    aria-required="true"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <RequiredLabel
                    htmlFor="company-postalCode"
                    text={adminCopy.companyProfile.form.postalCode}
                  />
                  <input
                    id="company-postalCode"
                    name="postalCode"
                    type="text"
                    required
                    aria-required="true"
                    value={form.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <RequiredLabel htmlFor="company-country" text={adminCopy.companyProfile.form.country} />
                  <input
                    id="company-country"
                    name="country"
                    type="text"
                    required
                    aria-required="true"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <OptionalLabel htmlFor="company-hours" text={adminCopy.companyProfile.form.hours} />
                  <input
                    id="company-hours"
                    name="hours"
                    type="text"
                    value={form.hours}
                    onChange={(e) => updateField('hours', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <OptionalLabel htmlFor="company-logoUrl" text={adminCopy.companyProfile.form.logoUrl} />
                  <input
                    id="company-logoUrl"
                    name="logoUrl"
                    type="url"
                    value={form.logoUrl}
                    onChange={(e) => updateField('logoUrl', e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <OptionalLabel
                    htmlFor="company-whatsapp"
                    text={adminCopy.companyProfile.form.whatsapp}
                  />
                  <input
                    id="company-whatsapp"
                    name="whatsapp"
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    className={inputClassName}
                  />
                  <span className="text-xs font-normal text-muted">
                    {adminCopy.companyProfile.form.whatsappHint}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 border-t border-border pt-4">
                {isRemoteAdminApi() ? (
                  <p className="w-full text-sm text-muted">{adminCopy.companyProfile.form.deployNote}</p>
                ) : null}
                <div className="flex items-center gap-4">
                  {saveSuccess ? (
                    <span className="text-sm text-muted" role="status">
                      {saveSuccess}
                    </span>
                  ) : null}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span
                          className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-fg border-t-transparent"
                          aria-hidden="true"
                        />
                        {adminCopy.common.loading}
                      </>
                    ) : (
                      adminCopy.companyProfile.form.saveButton
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Stack>
    </Section>
  )
}
