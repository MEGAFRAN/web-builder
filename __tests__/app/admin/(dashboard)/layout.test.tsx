import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import DashboardLayout from '@/app/admin/(dashboard)/layout'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/admin/bookings',
}))

vi.mock('@/lib/admin-auth-context', () => ({
  useAdminAuth: vi.fn(),
}))

vi.mock('@/components/admin/AdminShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <aside data-testid="admin-shell-stub">{children}</aside>
  ),
}))

import { useAdminAuth } from '@/lib/admin-auth-context'

const mockedUseAdminAuth = vi.mocked(useAdminAuth)

describe('AdminDashboardLayout (app/admin/(dashboard)/layout.tsx)', () => {
  beforeEach(() => {
    mockReplace.mockReset()
  })

  it('renders children inside AdminShell when authenticated', () => {
    mockedUseAdminAuth.mockReturnValue({
      session: { email: 'a@b.co', clientId: 'client-a' },
      status: 'authenticated',
      setSession: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <DashboardLayout>
        <p>Inbox route</p>
      </DashboardLayout>,
    )

    expect(screen.getByTestId('admin-shell-stub')).toHaveTextContent('Inbox route')
  })

  it('redirects unauthenticated users to login', () => {
    mockedUseAdminAuth.mockReturnValue({
      session: null,
      status: 'unauthenticated',
      setSession: vi.fn(),
      signOut: vi.fn(),
    })

    render(
      <DashboardLayout>
        <p>Inbox route</p>
      </DashboardLayout>,
    )

    expect(mockReplace).toHaveBeenCalledWith('/admin/login?redirect=%2Fadmin%2Fbookings')
  })
})
