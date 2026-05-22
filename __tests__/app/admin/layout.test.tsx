import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminRootLayout from '@/app/admin/layout'

vi.mock('@/lib/admin-auth-context', () => ({
  AdminAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-auth-provider">{children}</div>
  ),
}))

describe('AdminRootLayout (app/admin/layout.tsx)', () => {
  it('wraps children with AdminAuthProvider', () => {
    render(
      <AdminRootLayout>
        <section aria-label="Admin content">dashboard body</section>
      </AdminRootLayout>,
    )

    expect(screen.getByTestId('admin-auth-provider')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Admin content' })).toHaveTextContent('dashboard body')
  })
})
