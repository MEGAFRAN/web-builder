'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Container } from '@/components/layout/Container'

const nav = [
  { href: '/admin/bookings', label: 'Bookings', icon: IconCalendar },
  { href: '/admin/services', label: 'Services', icon: IconTag },
  { href: '/admin/availability', label: 'Availability', icon: IconClock },
  { href: '/admin/settings', label: 'Settings', icon: IconGear },
] as const

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7V5m8 2V5m-9 8h10M6 21h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M9 16l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-4.172 4.172a2 2 0 01-2.828 0l-7-7A2 2 0 013 9V7a4 4 0 014-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function AdminShell({
  businessName,
  logoUrl,
  children,
}: {
  businessName: string
  logoUrl?: string | null
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const title =
    nav.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))?.label ??
    'Admin'

  async function signOut() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav aria-label="Admin">
        <ul className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none ring-primary transition-colors focus-visible:ring-2 ${
                    active
                      ? 'bg-primary text-primary-fg'
                      : 'text-foreground hover:bg-muted-bg'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="shrink-0 opacity-90" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="hidden w-56 shrink-0 border-border bg-surface md:flex md:flex-col md:border-r">
        <div className="flex flex-col gap-6 p-4">
          <div className="flex items-center gap-2 border-border border-b pb-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- CMS-provided logo URL
              <img src={logoUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-fg"
                aria-hidden
              >
                {businessName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-foreground leading-tight">{businessName}</span>
          </div>
          <NavLinks />
          <div className="mt-auto border-border border-t pt-4">
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <MobileChrome pathname={pathname} title={title} businessName={businessName}>
        <NavLinks />
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 w-full rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium text-foreground"
        >
          Sign out
        </button>
      </MobileChrome>

      <main className="min-h-screen flex-1 pb-20 md:pb-0">
        <Container>{children}</Container>
      </main>
    </div>
  )
}

function MobileChrome({
  pathname,
  title,
  businessName,
  children,
}: {
  pathname: string
  title: string
  businessName: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-semibold text-foreground">{title}</span>
        <button
          type="button"
          className="rounded-md p-2 text-foreground hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          aria-expanded={open}
          aria-controls="admin-mobile-drawer"
          onClick={() => setOpen(true)}
        >
          <span className="sr-only">Open menu</span>
          <IconMenu />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            id="admin-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${businessName} admin menu`}
            className="absolute top-0 right-0 flex h-full w-[min(100%,18rem)] flex-col bg-surface p-4 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-foreground">{businessName}</span>
              <button
                type="button"
                className="rounded-md p-2 hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                onClick={() => setOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <IconClose />
              </button>
            </div>
            <div onClick={() => setOpen(false)}>{children}</div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-border border-t bg-background/95 backdrop-blur md:hidden"
        aria-label="Admin sections"
      >
        {nav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active ? 'text-primary' : 'text-muted'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
