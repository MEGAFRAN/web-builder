'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'

export default function AdminLoginForm({
  misconfigured,
}: {
  misconfigured?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/admin/bookings'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Incorrect email or password')
        return
      }
      router.push(redirectTo.startsWith('/admin') ? redirectTo : '/admin/bookings')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section paddingY="xl" background="gray">
      <div className="mx-auto flex max-w-md flex-col px-4">
        <h1 className="text-center text-2xl font-bold text-foreground">Sign in</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Business owner access — contact support if you need an account.
        </p>

        {misconfigured && (
          <div className="mt-6">
            <Alert
              variant="warning"
              title="Login unavailable"
              message="Admin authentication environment variables are missing. Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET on the server."
            />
          </div>
        )}

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mt-8 rounded-xl border border-border bg-background p-6 shadow-sm"
          noValidate
        >
          <Stack gap="md">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-border px-3 py-2 font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={busy || misconfigured}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Sign in
            </button>
          </Stack>
        </form>
      </div>
    </Section>
  )
}
