'use client'

import { RefObject, useCallback, useRef, useState } from 'react'

interface SwipePoint {
  x: number
  y: number
  t: number
}

interface UseSwipeReturn {
  swipeDirection: 'left' | 'right' | null
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
}

const THRESHOLD_PX = 50
const VERTICAL_DRIFT_MAX = 30
const VELOCITY_THRESHOLD = 0.3 // px/ms

/**
 * Detects horizontal swipe gestures on a ref'd element.
 *
 * Triggers when:
 * - Horizontal movement ≥ 50px AND vertical drift < 30px, OR
 * - Velocity > 0.3px/ms (even for distances below 50px) AND vertical drift < 30px
 *
 * Does NOT call preventDefault on vertical gestures — page scroll is preserved.
 */
export function useSwipe(
  _ref: RefObject<HTMLElement | null>,
  onSwipe?: (direction: 'left' | 'right') => void,
): UseSwipeReturn {
  const start = useRef<SwipePoint | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    setSwipeDirection(null)
  }, [])

  const onPointerMove = useCallback((_e: React.PointerEvent) => {
    // No-op during move — gesture is resolved on pointer up
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!start.current) return

    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    const dt = performance.now() - start.current.t

    start.current = null

    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    // Vertical gesture — do not suppress, allow page scroll
    if (absY >= VERTICAL_DRIFT_MAX && absY > absX) return

    // Velocity in px/ms
    const velocity = dt > 0 ? absX / dt : 0

    const triggered =
      absX >= THRESHOLD_PX || (velocity > VELOCITY_THRESHOLD && absX > 0)

    if (!triggered) return

    const direction = dx < 0 ? 'left' : 'right'
    setSwipeDirection(direction)
    onSwipe?.(direction)
  }, [onSwipe])

  return { swipeDirection, onPointerDown, onPointerMove, onPointerUp }
}
