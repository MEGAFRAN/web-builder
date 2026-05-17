import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import type { ClientConfig } from '@/types/cms'
import DashboardLayout from '@/app/admin/(dashboard)/layout'
import { getClientConfig } from '@/lib/client-config'

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(),
}))

vi.mock('@/components/admin/AdminShell', () => ({
  default: ({
    children,
    businessName,
    logoUrl,
  }: {
    children: React.ReactNode
    businessName: string
    logoUrl: string | null
  }) => (
    <aside
      data-testid="admin-shell-stub"
      data-business-name={businessName}
      data-logo-url={logoUrl ?? ''}>
      {children}
    </aside>
  ),
}))

const mockedGetClientConfig = vi.mocked(getClientConfig)

describe('AdminDashboardLayout (app/admin/(dashboard)/layout.tsx)', () => {
  beforeEach(() => {
    vi.stubEnv('CLIENT_ID', 'route-layout-client')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it.each([
    {
      description: 'forwards logo URL when header.logo is present',
      partialConfig: {
        displayName: 'Bright Spa',
        header: { logo: 'https://cdn.example/logo.png' },
      } satisfies Pick<ClientConfig, 'displayName' | 'header'>,
      expectedLogo: 'https://cdn.example/logo.png',
    },
    {
      description: 'uses null logo URL when header is missing',
      partialConfig: {
        displayName: 'Plain Co',
        header: undefined,
      },
      expectedLogo: '',
    },
    {
      description: 'uses null logo URL when header has no logo',
      partialConfig: {
        displayName: 'Bare Header',
        header: {},
      },
      expectedLogo: '',
    },
  ])('$description', ({ partialConfig, expectedLogo }) => {
    mockedGetClientConfig.mockReturnValue(partialConfig as ClientConfig)

    render(
      <DashboardLayout>
        <p>Inbox route</p>
      </DashboardLayout>,
    )

    expect(mockedGetClientConfig).toHaveBeenCalledWith('route-layout-client')

    const shell = screen.getByTestId('admin-shell-stub')
    expect(shell).toHaveAttribute('data-business-name', partialConfig.displayName)
    expect(shell).toHaveAttribute('data-logo-url', expectedLogo)
    expect(shell).toHaveTextContent('Inbox route')
  })
})
