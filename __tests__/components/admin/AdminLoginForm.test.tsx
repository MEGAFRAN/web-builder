import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import { adminCopy } from '@/components/admin/admin-copy'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}))

describe('AdminLoginForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSearchParams.delete('redirect')
    mockPush.mockReset()
    mockRefresh.mockReset()
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({ error: 'bad' }),
        }),
      ),
    )
  })

  it('renders sign-in copy and submits credentials to the admin login API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)

    render(<AdminLoginForm />)

    expect(screen.getByRole('heading', { name: adminCopy.login.heading })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.login.emailLabel, 'i')), {
      target: { value: 'owner@example.com' },
    })
    fireEvent.change(screen.getByLabelText(new RegExp(`^${adminCopy.login.passwordLabel}`, 'i')), {
      target: { value: 'secret-pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: adminCopy.login.submit }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'owner@example.com', password: 'secret-pass' }),
        }),
      )
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/bookings')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('shows server validation feedback when login fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    } as Response)

    render(<AdminLoginForm />)

    fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.login.emailLabel, 'i')), {
      target: { value: 'a@b.co' },
    })
    fireEvent.change(screen.getByLabelText(new RegExp(`^${adminCopy.login.passwordLabel}`, 'i')), {
      target: { value: 'x' },
    })
    fireEvent.click(screen.getByRole('button', { name: adminCopy.login.submit }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })
  })

  it('disables submit and surfaces misconfiguration messaging when misconfigured', () => {
    render(<AdminLoginForm misconfigured />)

    expect(screen.getByText(adminCopy.login.misconfiguredTitle)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: adminCopy.login.submit })).toBeDisabled()
  })

  it('redirects to the ?redirect target when it stays inside /admin', async () => {
    mockSearchParams.set('redirect', '/admin/settings')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)

    render(<AdminLoginForm />)

    fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.login.emailLabel, 'i')), {
      target: { value: 'o@z.co' },
    })
    fireEvent.change(screen.getByLabelText(new RegExp(`^${adminCopy.login.passwordLabel}`, 'i')), {
      target: { value: 'pw' },
    })
    fireEvent.click(screen.getByRole('button', { name: adminCopy.login.submit }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/settings')
    })
  })

  it('falls back to /admin/bookings when redirect points outside /admin', async () => {
    mockSearchParams.set('redirect', 'https://evil.example')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)

    render(<AdminLoginForm />)

    fireEvent.change(screen.getByLabelText(new RegExp(adminCopy.login.emailLabel, 'i')), {
      target: { value: 'o@z.co' },
    })
    fireEvent.change(screen.getByLabelText(new RegExp(`^${adminCopy.login.passwordLabel}`, 'i')), {
      target: { value: 'pw' },
    })
    fireEvent.click(screen.getByRole('button', { name: adminCopy.login.submit }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/bookings')
    })
  })
})
