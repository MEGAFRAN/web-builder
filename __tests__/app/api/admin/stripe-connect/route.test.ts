// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { GET, POST } from '@/app/api/admin/stripe-connect/route'

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: vi.fn(),
}))

vi.mock('@/lib/stripe-connect-db', () => ({
  readStripeAccountId: vi.fn(),
  writeStripeAccountId: vi.fn(),
}))

vi.mock('@/lib/company-profile-db', () => ({
  readCompanyProfile: vi.fn(),
}))

import { requireAdminSession } from '@/lib/require-admin'
import { readStripeAccountId, writeStripeAccountId } from '@/lib/stripe-connect-db'
import { readCompanyProfile } from '@/lib/company-profile-db'

describe('/api/admin/stripe-connect', () => {
  beforeEach(() => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      email: 'owner@example.com',
      clientId: 'client-x',
      exp: 9999999999,
    })
    vi.mocked(readStripeAccountId).mockResolvedValue(null)
    vi.mocked(writeStripeAccountId).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET returns not_connected when no account is stored', async () => {
    const req = new NextRequest('http://localhost/api/admin/stripe-connect')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      accountId: null,
      status: 'not_connected',
    })
  })

  it('GET returns mock status when an account id exists locally', async () => {
    vi.mocked(readStripeAccountId).mockResolvedValue('acct_mock_local_dev')
    const req = new NextRequest('http://localhost/api/admin/stripe-connect')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      accountId: 'acct_mock_local_dev',
      status: 'mock',
      chargesEnabled: true,
    })
  })

  it('POST returns 422 when country is missing', async () => {
    const req = new NextRequest('http://localhost/api/admin/stripe-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('POST returns 422 when company profile email is missing', async () => {
    vi.mocked(readCompanyProfile).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/admin/stripe-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'ES' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('POST mocks connect and persists account id', async () => {
    vi.mocked(readCompanyProfile).mockResolvedValue({
      businessName: 'Test',
      phone: '+1',
      email: 'owner@example.com',
      address: {
        street: '1 Main',
        city: 'Madrid',
        postalCode: '28001',
        country: 'ES',
      },
      hours: '',
      logoUrl: null,
      whatsapp: null,
    })
    const req = new NextRequest('http://localhost/api/admin/stripe-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'CO' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('mock')
    expect(body.accountId).toBe('acct_mock_local_dev')
    expect(writeStripeAccountId).toHaveBeenCalledWith('acct_mock_local_dev')
  })

  it('returns 401 when session is missing', async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const req = new NextRequest('http://localhost/api/admin/stripe-connect')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
