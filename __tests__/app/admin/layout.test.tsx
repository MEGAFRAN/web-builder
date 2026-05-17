import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminRootLayout from '@/app/admin/layout'

describe('AdminRootLayout (app/admin/layout.tsx)', () => {
  it('renders a single child element', () => {
    render(
      <AdminRootLayout>
        <section aria-label="Admin content">dashboard body</section>
      </AdminRootLayout>,
    )

    expect(screen.getByRole('region', { name: 'Admin content' })).toHaveTextContent('dashboard body')
  })

  it('renders multiple sibling children', () => {
    render(
      <AdminRootLayout>
        <p>alpha</p>
        <p>beta</p>
      </AdminRootLayout>,
    )

    expect(screen.getByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
  })
})
