import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLoginPage from '@/app/admin/login/page'

const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

vi.mock('@/components/admin/AdminLoginForm', () => ({
  default: ({ misconfigured }: { misconfigured?: boolean }) => (
    <div data-testid="login-form-stub" data-misconfigured={String(!!misconfigured)} />
  ),
}))

describe('AdminLoginPage (app/admin/login/page.tsx)', () => {
  it.each([
    {
      label: 'no search params',
      error: null as string | null,
      expectedMisconfigured: 'false',
    },
    {
      label: 'unrelated error flag',
      error: 'other',
      expectedMisconfigured: 'false',
    },
    {
      label: 'error=misconfigured',
      error: 'misconfigured',
      expectedMisconfigured: 'true',
    },
  ])('reflects login configuration for $label', ({ error, expectedMisconfigured }) => {
    mockSearchParams.delete('error')
    if (error) mockSearchParams.set('error', error)

    render(<AdminLoginPage />)

    expect(screen.getByTestId('login-form-stub')).toHaveAttribute(
      'data-misconfigured',
      expectedMisconfigured,
    )
  })
})
