import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import AdminIndexRedirectPage from '@/app/admin/(dashboard)/page'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

describe('AdminIndexRedirectPage (app/admin/(dashboard)/page.tsx)', () => {
  beforeEach(() => {
    mockReplace.mockReset()
  })

  it('redirects bare /admin visits to bookings', () => {
    render(<AdminIndexRedirectPage />)
    expect(mockReplace).toHaveBeenCalledWith('/admin/bookings')
  })
})
