// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { CompanyProfile, SessionPayload } from '@/types/admin'
import { suppressConsoleErrorDuring } from '../../../../suppressConsoleErrorDuring'

const requireAdminSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/company-profile-db', () => ({
  readCompanyProfile: vi.fn(),
  writeCompanyProfile: vi.fn(),
}))

import { GET, PUT } from '@/app/api/admin/company-profile/route'
import { readCompanyProfile, writeCompanyProfile } from '@/lib/company-profile-db'

describe('/api/admin/company-profile', () => {
  const session: SessionPayload = {
    email: 'owner@example.com',
    clientId: 'client-x',
    exp: Date.now() + 1e9,
  }

  const profile: CompanyProfile = {
    businessName: 'Acme Spa',
    phone: '+1 555 0100',
    email: 'hello@acme.example',
    address: {
      street: '1 Main St',
      city: 'Austin',
      postalCode: '78701',
      country: 'US',
    },
    hours: 'Mon–Fri 9–5',
    logoUrl: 'https://cdn.example/logo.png',
    whatsapp: '+15550100',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminSessionMock.mockResolvedValue(session)
    vi.mocked(readCompanyProfile).mockResolvedValue(profile)
    vi.mocked(writeCompanyProfile).mockResolvedValue(undefined)
  })

  function put(body: unknown) {
    return new NextRequest('http://localhost/api/admin/company-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  }

  it('GET returns the persisted company profile', async () => {
    const req = new NextRequest('http://localhost/api/admin/company-profile')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ profile })
  })

  it('GET returns 401 when the admin gate fails', async () => {
    requireAdminSessionMock.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const req = new NextRequest('http://localhost/api/admin/company-profile')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  describe('PUT', () => {
    it('returns 400 when the body is not valid JSON', async () => {
      const res = await PUT(put('{"profile"'))
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Invalid JSON' })
    })

    it.each([
      [{ profile: null }, 'Expected a company profile object.'],
      [{ profile: { ...profile, businessName: '   ' } }, 'businessName is required.'],
      [{ profile: { ...profile, email: 'not-an-email' } }, 'email must be a valid email address.'],
      [{ profile: { ...profile, address: { ...profile.address, city: '' } } }, 'address.city is required.'],
      [{ profile: { ...profile, logoUrl: 42 } }, 'logoUrl must be a string or null.'],
    ] as const)('returns 422 for invalid profile (#%#)', async (body, error) => {
      const res = await PUT(put(body))
      expect(res.status).toBe(422)
      expect(await res.json()).toEqual({ error })
      expect(writeCompanyProfile).not.toHaveBeenCalled()
    })

    it('normalizes whitespace and persists a valid profile', async () => {
      const res = await PUT(
        put({
          profile: {
            ...profile,
            businessName: '  Acme Spa  ',
            email: '  hello@acme.example  ',
            logoUrl: '   ',
            whatsapp: '',
          },
        }),
      )
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ ok: true })
      expect(writeCompanyProfile).toHaveBeenCalledWith({
        ...profile,
        businessName: 'Acme Spa',
        email: 'hello@acme.example',
        logoUrl: null,
        whatsapp: null,
      })
    })

    it('returns 500 when persistence fails downstream', async () => {
      await suppressConsoleErrorDuring(async () => {
        vi.mocked(writeCompanyProfile).mockRejectedValueOnce(new Error('locked'))
        const res = await PUT(put({ profile }))
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: 'Failed to save company profile.' })
      })
    })

    it('returns 401 when the admin gate fails', async () => {
      requireAdminSessionMock.mockResolvedValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      )
      const res = await PUT(put({ profile }))
      expect(res.status).toBe(401)
      expect(writeCompanyProfile).not.toHaveBeenCalled()
    })
  })
})
