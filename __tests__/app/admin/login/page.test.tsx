import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLoginPage from '@/app/admin/login/page'

vi.mock('@/components/admin/AdminLoginForm', () => ({
  default: ({ misconfigured }: { misconfigured?: boolean }) => (
    <div data-testid="login-form-stub" data-misconfigured={String(!!misconfigured)} />
  ),
}))

describe('AdminLoginPage (app/admin/login/page.tsx)', () => {
  it.each([
    {
      label: 'no search params',
      searchParams: {} as Record<string, never>,
      expectedMisconfigured: 'false',
    },
    {
      label: 'unrelated error flag',
      searchParams: { error: 'other' as const },
      expectedMisconfigured: 'false',
    },
    {
      label: 'error=misconfigured',
      searchParams: { error: 'misconfigured' as const },
      expectedMisconfigured: 'true',
    },
  ])('reflects login configuration for $label', async ({ searchParams, expectedMisconfigured }) => {
    const jsx = await AdminLoginPage({
      searchParams: Promise.resolve(searchParams),
    })
    render(jsx)

    expect(screen.getByTestId('login-form-stub')).toHaveAttribute(
      'data-misconfigured',
      expectedMisconfigured,
    )
  })
})
