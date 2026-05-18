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
        setError(data.error ?? 'Correo o contraseña incorrectos')
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
        <h1 className="text-center text-2xl font-bold text-foreground">Iniciar sesión</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Acceso para el titular del negocio — contacte con soporte si necesita una cuenta.
        </p>

        {misconfigured && (
          <div className="mt-6">
            <Alert
              variant="warning"
              title="Inicio de sesión no disponible"
              message="Faltan variables de entorno de autenticación de administración. Configure ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_SESSION_SECRET en el servidor."
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
              Correo electrónico
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
              Contraseña
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
              Iniciar sesión
            </button>
          </Stack>
        </form>
      </div>
    </Section>
  )
}
