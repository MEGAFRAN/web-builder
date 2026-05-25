import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import AdminCompanyProfileForm from '@/components/admin/AdminCompanyProfileForm'
import { adminCopy } from '@/components/admin/admin-copy'
import type { CompanyProfile } from '@/types/admin'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleProfile: CompanyProfile = {
  businessName: 'Acme Spa',
  phone: '+34 600 111 222',
  email: 'hello@acme.test',
  address: {
    street: 'Calle Mayor 1',
    city: 'Madrid',
    postalCode: '28001',
    country: 'España',
  },
  hours: 'Lun–Vie 9:00–18:00',
  logoUrl: 'https://example.com/logo.png',
  whatsapp: '+34 611 222 333',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as Response
}

function fetchInputUrl(input: Parameters<typeof fetch>[0]): string {
  return typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
}

function companyProfileCalls(fetchSpy: { mock: { calls: unknown[][] } }) {
  return fetchSpy.mock.calls.filter(
    (c): c is [string, RequestInit | undefined] =>
      Array.isArray(c) && typeof c[0] === 'string' && c[0] === '/api/admin/company-profile',
  )
}

/** Mount queues profile fetch in a microtask; flush so setState runs inside act. */
async function renderCompanyProfileForm() {
  const utils = render(<AdminCompanyProfileForm />)
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  })
  return utils
}

async function waitForFormLoaded() {
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: adminCopy.companyProfile.heading })).toBeInTheDocument()
  })
  expect(screen.queryByText(adminCopy.common.loading)).not.toBeInTheDocument()
}

function fillRequiredFields(overrides: Partial<CompanyProfile & CompanyProfile['address']> = {}) {
  const merged = {
    ...sampleProfile,
    ...overrides,
    address: { ...sampleProfile.address, ...(overrides as CompanyProfile['address']) },
  }

  fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.businessName, 'i')), {
    target: { value: merged.businessName },
  })
  fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.phone, 'i')), {
    target: { value: merged.phone },
  })
  fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.email, 'i')), {
    target: { value: merged.email },
  })
  fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.street, 'i')), {
    target: { value: merged.address.street },
  })
  fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.city, 'i')), {
    target: { value: merged.address.city },
  })
  fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.postalCode, 'i')), {
    target: { value: merged.address.postalCode },
  })
  fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.country, 'i')), {
    target: { value: merged.address.country },
  })
}

function submitForm() {
  fireEvent.click(screen.getByRole('button', { name: adminCopy.companyProfile.form.saveButton }))
}

function mockProfileFetch(profile: CompanyProfile | null) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = fetchInputUrl(input)
    if (url !== '/api/admin/company-profile') {
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    }
    if (init?.method === 'PUT') {
      return Promise.resolve(jsonResponse({ ok: true }))
    }
    return Promise.resolve(jsonResponse({ profile }))
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminCompanyProfileForm', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = mockProfileFetch(sampleProfile)
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  describe('initial load', () => {
    it('shows settings copy then loads the company profile into the form', async () => {
      await renderCompanyProfileForm()

      expect(screen.getByRole('heading', { name: adminCopy.settings.heading })).toBeInTheDocument()
      expect(screen.getByText(adminCopy.settings.intro)).toBeInTheDocument()

      await waitForFormLoaded()

      expect(fetch).toHaveBeenCalledWith('/api/admin/company-profile', { credentials: 'include' })
      expect(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.businessName, 'i'))).toHaveValue(
        sampleProfile.businessName,
      )
      expect(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.phone, 'i'))).toHaveValue(
        sampleProfile.phone,
      )
      expect(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.email, 'i'))).toHaveValue(
        sampleProfile.email,
      )
      expect(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.hours, 'i'))).toHaveValue(
        sampleProfile.hours,
      )
      expect(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.logoUrl, 'i'))).toHaveValue(
        sampleProfile.logoUrl,
      )
      expect(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.whatsapp, 'i'))).toHaveValue(
        sampleProfile.whatsapp,
      )
    })

    it('renders empty required fields when the API returns a null profile', async () => {
      fetchSpy.mockRestore()
      fetchSpy = mockProfileFetch(null)

      await renderCompanyProfileForm()
      await waitForFormLoaded()

      for (const label of adminCopy.companyProfile.form.requiredFields) {
        expect(screen.getByLabelText(new RegExp(label, 'i'))).toHaveValue('')
      }
    })

    it('shows a load error alert when the profile cannot be fetched', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        jsonResponse({ error: 'Profile unavailable' }, false),
      )

      await renderCompanyProfileForm()

      await waitFor(() => {
        expect(screen.getByText(adminCopy.common.error)).toBeInTheDocument()
        expect(screen.getByText('Profile unavailable')).toBeInTheDocument()
      })

      await waitForFormLoaded()
      expect(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.businessName, 'i'))).toHaveValue('')
    })
  })

  describe('validation', () => {
    it('blocks submit and lists missing required fields', async () => {
      fetchSpy.mockRestore()
      fetchSpy = mockProfileFetch(null)

      await renderCompanyProfileForm()
      await waitForFormLoaded()

      submitForm()

      await waitFor(() => {
        expect(screen.getByText(adminCopy.common.error)).toBeInTheDocument()
      })

      const validationMessage = `${adminCopy.companyProfile.form.validationError}${adminCopy.companyProfile.form.requiredFields.join(', ')}.`
      expect(screen.getByText(validationMessage)).toBeInTheDocument()
      expect(companyProfileCalls(fetchSpy).filter(([, init]) => init?.method === 'PUT')).toHaveLength(0)
    })

    it('includes email in validation when the address format is invalid', async () => {
      fetchSpy.mockRestore()
      fetchSpy = mockProfileFetch(null)

      await renderCompanyProfileForm()
      await waitForFormLoaded()

      fillRequiredFields({ email: 'not-an-email' })
      submitForm()

      await waitFor(() => {
        expect(
          screen.getByText(
            `${adminCopy.companyProfile.form.validationError}${adminCopy.companyProfile.form.email}.`,
          ),
        ).toBeInTheDocument()
      })
    })
  })

  describe('save flow', () => {
    it('PUTs trimmed profile data and shows success after a valid submit', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url !== '/api/admin/company-profile') {
          return Promise.reject(new Error(`Unexpected fetch: ${url}`))
        }
        if (init?.method === 'PUT') {
          return Promise.resolve(jsonResponse({ ok: true }))
        }
        return Promise.resolve(jsonResponse({ profile: null }))
      })

      await renderCompanyProfileForm()
      await waitForFormLoaded()

      fillRequiredFields({
        businessName: '  New Name  ',
        phone: ' +34 600 000 000 ',
        email: ' contact@new.test ',
        street: ' Calle 2 ',
        city: ' Barcelona ',
        postalCode: ' 08001 ',
        country: ' España ',
      })
      fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.hours, 'i')), {
        target: { value: ' 9:00–17:00 ' },
      })
      fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.logoUrl, 'i')), {
        target: { value: '   ' },
      })
      fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.companyProfile.form.whatsapp, 'i')), {
        target: { value: '   ' },
      })

      submitForm()

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(adminCopy.companyProfile.form.saveSuccess)
      })

      const putCalls = companyProfileCalls(fetchSpy).filter(([, init]) => init?.method === 'PUT')
      expect(putCalls).toHaveLength(1)

      const [, putInit] = putCalls[0]
      expect(putInit).toMatchObject({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const body = JSON.parse(String(putInit?.body)) as { profile: CompanyProfile }
      expect(body.profile).toEqual({
        businessName: 'New Name',
        phone: '+34 600 000 000',
        email: 'contact@new.test',
        address: {
          street: 'Calle 2',
          city: 'Barcelona',
          postalCode: '08001',
          country: 'España',
        },
        hours: '9:00–17:00',
        logoUrl: null,
        whatsapp: null,
      })

      expect(companyProfileCalls(fetchSpy).filter(([, init]) => init?.method !== 'PUT')).toHaveLength(2)
    })

    it('shows a save error when the PUT request fails', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url !== '/api/admin/company-profile') {
          return Promise.reject(new Error(`Unexpected fetch: ${url}`))
        }
        if (init?.method === 'PUT') {
          return Promise.resolve(jsonResponse({ error: 'Write denied' }, false))
        }
        return Promise.resolve(jsonResponse({ profile: null }))
      })

      await renderCompanyProfileForm()
      await waitForFormLoaded()

      fillRequiredFields()
      submitForm()

      await waitFor(() => {
        expect(screen.getByText('Write denied')).toBeInTheDocument()
      })
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('disables the submit button and shows loading copy while saving', async () => {
      fetchSpy.mockRestore()
      let resolvePut: ((value: Response) => void) | undefined
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url !== '/api/admin/company-profile') {
          return Promise.reject(new Error(`Unexpected fetch: ${url}`))
        }
        if (init?.method === 'PUT') {
          return new Promise<Response>((resolve) => {
            resolvePut = resolve
          })
        }
        return Promise.resolve(jsonResponse({ profile: null }))
      })

      await renderCompanyProfileForm()
      await waitForFormLoaded()

      fillRequiredFields()
      submitForm()

      const savingButton = await screen.findByRole('button', { name: adminCopy.common.loading })
      expect(savingButton).toBeDisabled()

      resolvePut!(jsonResponse({ ok: true }))

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(adminCopy.companyProfile.form.saveSuccess)
      })
      expect(screen.getByRole('button', { name: adminCopy.companyProfile.form.saveButton })).not.toBeDisabled()
    })
  })
})
