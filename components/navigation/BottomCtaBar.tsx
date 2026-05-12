import Link from 'next/link'
import type { BottomActionBarItem } from '@/types/cms'

function isInternalAppPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

function CtaAnchor({ item, className }: { item: BottomActionBarItem; className: string }) {
  const { label, href, icon } = item
  const content = (
    <span className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1">
      {icon ? <span className="text-lg leading-none" aria-hidden>{icon}</span> : null}
      <span className="max-w-full truncate text-center text-xs font-semibold leading-tight sm:text-sm">
        {label}
      </span>
    </span>
  )

  if (isInternalAppPath(href)) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  const external =
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//')

  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {content}
    </a>
  )
}

export interface BottomCtaBarProps {
  items: BottomActionBarItem[]
}

/**
 * Fixed bottom action strip (mobile app–style). Actions are plain links: internal paths,
 * `tel:`, `mailto:`, `https://wa.me/…`, etc.
 */
export function BottomCtaBar({ items }: BottomCtaBarProps) {
  if (!items.length) return null

  const itemClass =
    'flex min-h-[3.25rem] min-w-[4.5rem] flex-1 shrink-0 items-center justify-center rounded-lg ' +
    'bg-primary text-center text-primary-fg transition-opacity hover:opacity-90 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

  return (
    <nav
      data-component="bottom-cta-bar"
      aria-label="Quick actions"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm supports-[backdrop-filter]:bg-background/80"
    >
      <div
        className="mx-auto flex max-w-6xl items-stretch gap-2 overflow-x-auto overscroll-x-contain py-2 [-webkit-overflow-scrolling:touch]"
        style={{
          paddingInline: 'var(--page-inset)',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        {items.map((item, i) => (
          <CtaAnchor key={`${i}-${item.href}-${item.label}`} item={item} className={itemClass} />
        ))}
      </div>
    </nav>
  )
}
