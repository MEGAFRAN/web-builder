import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { redirect } from 'next/navigation'
import AdminIndexRedirectPage from '@/app/admin/(dashboard)/page'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('AdminIndexRedirectPage (app/admin/(dashboard)/page.tsx)', () => {
  const mockedRedirect = vi.mocked(redirect)

  beforeEach(() => {
    mockedRedirect.mockReset()
    mockedRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })
  })

  it('redirects bare /admin visits to bookings', () => {
    expect(() => render(<AdminIndexRedirectPage />)).toThrow('NEXT_REDIRECT')
    expect(mockedRedirect).toHaveBeenCalledWith('/admin/bookings')
  })
})
