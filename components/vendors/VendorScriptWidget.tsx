'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'

const DEFAULT_CLICK_TARGET_CLASS = 'booksy-widget-button'

const RETRY_INTERVAL_MS = 100
const RETRY_MAX_ATTEMPTS = 30

function buildClassSelector(className: string): string {
  const token = className.trim().split(/\s+/).find(Boolean)
  if (!token) return `.${DEFAULT_CLICK_TARGET_CLASS}`
  return token.startsWith('.') ? token : `.${CSS.escape(token)}`
}

export type VendorScriptWidgetHandle = {
  /**
   * Finds the vendor-injected element (by class) and activates it via
   * `HTMLElement.click()`, after optional `scrollIntoView`. Prefers descendants
   * of this component’s root, then falls back to `document` (many embeds
   * append to `<body>` and are not nested under our wrapper).
   */
  activate: () => void
}

export type VendorScriptWidgetProps = {
  src: string
  isVisible: boolean
  /** CSS class token to pass to `querySelector`. */
  clickTargetClass?: string
}

/** Locates `[clickTargetClass]`: scoped to our root first, then whole document. */
function queryClickTarget(root: HTMLDivElement | null, selector: string): HTMLElement | null {
  if (root) {
    const scoped = root.querySelector(selector)
    if (scoped instanceof HTMLElement) return scoped
  }
  const global = document.querySelector(selector)
  return global instanceof HTMLElement ? global : null
}

/** Mounts vendor script beside a stable root; activation uses root + document fallback. */
export const VendorScriptWidget = forwardRef<
  VendorScriptWidgetHandle,
  VendorScriptWidgetProps
>(function VendorScriptWidget(
  { src, isVisible, clickTargetClass = DEFAULT_CLICK_TARGET_CLASS },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearRetry = useCallback(() => {
    if (retryIntervalRef.current != null) {
      clearInterval(retryIntervalRef.current)
      retryIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearRetry()
    }
  }, [clearRetry])

  const findTarget = useCallback((): HTMLElement | null => {
    const selector = buildClassSelector(clickTargetClass)
    return queryClickTarget(rootRef.current, selector)
  }, [clickTargetClass])

  const activateDomTarget = useCallback((target: HTMLElement) => {
    try {
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    } catch {
      /* scrollIntoView can throw if element is disconnected */
    }
    target.click()
  }, [])

  const activate = useCallback(() => {
    clearRetry()
    const immediate = findTarget()
    if (immediate) {
      activateDomTarget(immediate)
      return
    }
    let attempts = 0
    retryIntervalRef.current = setInterval(() => {
      attempts += 1
      const target = findTarget()
      if (target) {
        clearRetry()
        activateDomTarget(target)
      } else if (attempts >= RETRY_MAX_ATTEMPTS) {
        clearRetry()
      }
    }, RETRY_INTERVAL_MS)
  }, [activateDomTarget, clearRetry, findTarget])

  useImperativeHandle(ref, () => ({ activate }), [activate])

  const rootClassName = isVisible ? 'relative isolate' : 'sr-only'

  return (
    <div
      ref={rootRef}
      className={rootClassName}
      data-component="vendor-script-widget"
    >
      <script src={src} async />
    </div>
  )
})

VendorScriptWidget.displayName = 'VendorScriptWidget'
