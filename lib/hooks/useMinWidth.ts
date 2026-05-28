'use client'

import { useEffect, useState } from 'react'

/** Matches Tailwind `md` breakpoint (768px). */
export function useMinWidth(minWidthPx: number): boolean {
  const query = `(min-width: ${minWidthPx}px)`
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}
