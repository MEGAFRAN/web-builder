// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { CompanyProfile } from '@/types/admin'

const readCompanyProfileMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/company-profile-db', () => ({
  readCompanyProfile: readCompanyProfileMock,
}))

import { getCompanyProfile, isCompanyProfile, clearCompanyProfileCache } from '@/lib/company-profile'

const validProfile: CompanyProfile = {
  businessName: 'Acme Spa',
  phone: '+34 600 111 222',
  email: 'hello@acme.test',
  address: {
    street: 'Calle Mayor 1',
    city: 'Madrid',
    postalCode: '28001',
    country: 'España',
  },
  hours: 'Mon–Fri 9:00–18:00',
  logoUrl: null,
  whatsapp: null,
}

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as Response
}

describe('isCompanyProfile', () => {
  it('accepts a fully valid profile', () => {
    expect(isCompanyProfile(validProfile)).toBe(true)
  })

  it.each([
    null,
    undefined,
    'profile',
    42,
    {},
    { ...validProfile, address: null },
    { ...validProfile, businessName: '' },
    { ...validProfile, businessName: '   ' },
    { ...validProfile, phone: '' },
    { ...validProfile, email: 'not-an-email' },
    {
      ...validProfile,
      address: { ...validProfile.address, street: '' },
    },
    {
      ...validProfile,
      address: { ...validProfile.address, city: '  ' },
    },
    {
      ...validProfile,
      address: { ...validProfile.address, postalCode: '' },
    },
    {
      ...validProfile,
      address: { ...validProfile.address, country: '' },
    },
    { ...validProfile, logoUrl: 123 },
    { ...validProfile, whatsapp: false },
  ])('rejects invalid profile payloads: %j', (value) => {
    expect(isCompanyProfile(value)).toBe(false)
  })

  it.each([
    [null, null],
    [undefined, undefined],
    ['https://example.com/logo.png', '+34 611 222 333'],
  ] as const)('accepts optional logoUrl and whatsapp values: %j / %j', (logoUrl, whatsapp) => {
    expect(isCompanyProfile({ ...validProfile, logoUrl, whatsapp })).toBe(true)
  })
})

describe('getCompanyProfile', () => {
  beforeEach(() => {
    clearCompanyProfileCache()
    readCompanyProfileMock.mockReset()
    vi.stubGlobal('fetch', vi.fn())
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('reads the local profile when no remote admin API URL is configured', async () => {
    readCompanyProfileMock.mockResolvedValueOnce(validProfile)

    await expect(getCompanyProfile('hair-salon')).resolves.toEqual(validProfile)
    expect(readCompanyProfileMock).toHaveBeenCalledTimes(1)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns null without reading local data when CLIENT_ID does not match', async () => {
    vi.stubEnv('CLIENT_ID', 'other-client')

    await expect(getCompanyProfile('hair-salon')).resolves.toBeNull()
    expect(readCompanyProfileMock).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns the remote profile when fetch succeeds with a valid payload', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com/')
    vi.stubEnv('COMPANY_PROFILE_BUILD_TOKEN', 'build-token')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ profile: validProfile }))

    await expect(getCompanyProfile('hair-salon')).resolves.toEqual(validProfile)
    expect(fetch).toHaveBeenCalledWith(
      'https://fn.example.com/mgmt/company-profile?clientId=hair-salon',
      {
        headers: { Authorization: 'Bearer build-token' },
        cache: 'no-store',
      },
    )
    expect(readCompanyProfileMock).not.toHaveBeenCalled()
  })

  it('uses NEXT_PUBLIC_BOOKING_API_URL when admin API URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
    vi.stubEnv('COMPANY_PROFILE_BUILD_TOKEN', 'build-token')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ profile: validProfile }))

    await expect(getCompanyProfile('hair-salon')).resolves.toEqual(validProfile)
    expect(fetch).toHaveBeenCalledWith(
      'https://fn.example.com/api/mgmt/company-profile?clientId=hair-salon',
      {
        headers: { Authorization: 'Bearer build-token' },
        cache: 'no-store',
      },
    )
    expect(readCompanyProfileMock).not.toHaveBeenCalled()
  })

  it('caches the profile for repeated calls within one build', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com')
    vi.stubEnv('COMPANY_PROFILE_BUILD_TOKEN', 'build-token')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ profile: validProfile }))

    await expect(getCompanyProfile('hair-salon')).resolves.toEqual(validProfile)
    await expect(getCompanyProfile('hair-salon')).resolves.toEqual(validProfile)

    expect(fetch).toHaveBeenCalledOnce()
  })

  it('falls back to local read when remote URL is set but build token is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com')
    readCompanyProfileMock.mockResolvedValueOnce(validProfile)

    await expect(getCompanyProfile('hair-salon')).resolves.toEqual(validProfile)
    expect(fetch).not.toHaveBeenCalled()
    expect(readCompanyProfileMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['non-ok response', () => jsonResponse({ profile: validProfile }, false)],
    ['invalid profile payload', () => jsonResponse({ profile: { businessName: '' } })],
  ])('falls back to local read when remote fetch fails: %s', async (_label, makeResponse) => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com')
    vi.stubEnv('COMPANY_PROFILE_BUILD_TOKEN', 'build-token')
    vi.mocked(fetch).mockImplementationOnce(async () => makeResponse())
    readCompanyProfileMock.mockResolvedValueOnce(validProfile)

    await expect(getCompanyProfile('hair-salon')).resolves.toEqual(validProfile)
    expect(readCompanyProfileMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to local read when remote fetch throws', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com')
    vi.stubEnv('COMPANY_PROFILE_BUILD_TOKEN', 'build-token')
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    readCompanyProfileMock.mockResolvedValueOnce(validProfile)

    await expect(getCompanyProfile('hair-salon')).resolves.toEqual(validProfile)
    expect(readCompanyProfileMock).toHaveBeenCalledTimes(1)
  })
})
