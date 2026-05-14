'use client'

import Link from 'next/link'
import { useRef } from 'react'
import type {
  BottomActionBarItem,
  BottomActionBarVendorScriptWidget,
} from '@/types/cms'
import {
  VendorScriptWidget,
  type VendorScriptWidgetHandle,
} from '@/components/vendors/VendorScriptWidget'

function isInternalAppPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

function CtaItemContent({ item }: { item: BottomActionBarItem }) {
  const { label, icon } = item
  return (
    <span className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1">
      {icon ? (
        <span className="text-lg leading-none" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="max-w-full truncate text-center text-xs font-semibold leading-tight sm:text-sm">
        {label}
      </span>
    </span>
  )
}

function CtaNavigateControl({
  item,
  className,
}: {
  item: BottomActionBarItem
  className: string
}) {
  const { href } = item
  const content = <CtaItemContent item={item} />

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
  vendorScriptWidget?: BottomActionBarVendorScriptWidget | null
}

/**
 * Fixed bottom action strip (mobile app–style). Actions are plain links unless
 * `action: 'activateVendorScript'` with a configured `vendorScriptWidget`.
 */
export function BottomCtaBar({ items, vendorScriptWidget }: BottomCtaBarProps) {
  const widgetRef = useRef<VendorScriptWidgetHandle>(null)

  if (!items.length) return null

  const vendorSrc = vendorScriptWidget?.src?.trim()
  const hasActivateItems = items.some((i) => i.action === 'activateVendorScript')
  const embedVendor =
    Boolean(vendorSrc) && hasActivateItems

  const itemClass =
    'flex min-h-[3.25rem] min-w-[4.5rem] flex-1 shrink-0 items-center justify-center rounded-lg ' +
    'bg-primary text-center text-primary-fg transition-opacity hover:opacity-90 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

  return (
    <>
      {embedVendor && vendorSrc ? (
        <VendorScriptWidget
          ref={widgetRef}
          src={vendorSrc}
          isVisible={vendorScriptWidget?.isVisible ?? false}
          clickTargetClass={vendorScriptWidget?.clickTargetClass ?? undefined}
        />
      ) : null}
      <nav
        data-component="bottom-cta-bar"
        aria-label="Quick actions"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      >
        <div
          className="mx-auto flex max-w-6xl items-stretch gap-2 overflow-x-auto overscroll-x-contain py-2 [-webkit-overflow-scrolling:touch]"
          style={{
            paddingInline: 'var(--page-inset)',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          {items.map((item, i) => {
            const key = `${i}-${item.action ?? 'navigate'}-${item.href}-${item.label}`
            const wantsActivate = item.action === 'activateVendorScript' && embedVendor

            if (wantsActivate) {
              return (
                <button
                  key={key}
                  type="button"
                  className={`${itemClass} cursor-pointer border-0`}
                  onClick={() => widgetRef.current?.activate()}
                >
                  <CtaItemContent item={item} />
                </button>
              )
            }

            return <CtaNavigateControl key={key} item={item} className={itemClass} />
          })}
        </div>
      </nav>
    </>
  )
}
