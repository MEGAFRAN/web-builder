import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useRef } from 'react'
import { useSwipe } from '@/lib/hooks/useSwipe'

function SwipeHarness() {
  const ref = useRef<HTMLDivElement>(null)
  const { swipeDirection, onPointerDown, onPointerMove, onPointerUp } = useSwipe(ref)
  return (
    <div
      ref={ref}
      data-testid="zone"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span data-testid="direction">{swipeDirection ?? ''}</span>
    </div>
  )
}

describe('useSwipe', () => {
  it('detects swipe left after horizontal threshold', () => {
    const { getByTestId } = render(<SwipeHarness />)
    const zone = getByTestId('zone')
    fireEvent.pointerDown(zone, { clientX: 200, clientY: 50 })
    fireEvent.pointerMove(zone, { clientX: 170, clientY: 52 })
    fireEvent.pointerUp(zone, { clientX: 120, clientY: 55 })

    expect(getByTestId('direction').textContent).toBe('left')
  })

  it('detects swipe right when motion ends right of start', () => {
    const { getByTestId } = render(<SwipeHarness />)
    const zone = getByTestId('zone')
    fireEvent.pointerDown(zone, { clientX: 50, clientY: 40 })
    fireEvent.pointerMove(zone, { clientX: 90, clientY: 42 })
    fireEvent.pointerUp(zone, { clientX: 140, clientY: 45 })

    expect(getByTestId('direction').textContent).toBe('right')
  })

  it('does not classify vertical drags as swipes when vertical dominates', () => {
    const { getByTestId } = render(<SwipeHarness />)
    const zone = getByTestId('zone')
    fireEvent.pointerDown(zone, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(zone, { clientX: 102, clientY: 200 })

    expect(getByTestId('direction').textContent).toBe('')
  })

  it('does nothing on pointer-up without pointer-down', () => {
    const { getByTestId } = render(<SwipeHarness />)
    const zone = getByTestId('zone')
    fireEvent.pointerUp(zone, { clientX: 50, clientY: 50 })
    expect(getByTestId('direction').textContent).toBe('')
  })

  it('uses zero velocity when dt is 0', () => {
    const { getByTestId } = render(<SwipeHarness />)
    const zone = getByTestId('zone')
    const t = 5000
    vi.spyOn(performance, 'now').mockReturnValue(t)

    fireEvent.pointerDown(zone, { clientX: 100, clientY: 50 })
    fireEvent.pointerUp(zone, { clientX: 130, clientY: 52 })

    expect(getByTestId('direction').textContent).toBe('')
    vi.mocked(performance.now).mockRestore()
  })

  it('does not trigger swipe when distance and velocity are both low', () => {
    const { getByTestId } = render(<SwipeHarness />)
    const zone = getByTestId('zone')
    const start = 10_000
    vi.spyOn(performance, 'now').mockReturnValueOnce(start).mockReturnValueOnce(start + 1000)

    fireEvent.pointerDown(zone, { clientX: 100, clientY: 50 })
    fireEvent.pointerUp(zone, { clientX: 110, clientY: 52 })

    expect(getByTestId('direction').textContent).toBe('')
    vi.mocked(performance.now).mockRestore()
  })
  it('honors swipe based on velocity when distance < threshold but movement is fast', () => {
    const { getByTestId } = render(<SwipeHarness />)
    const zone = getByTestId('zone')
    const clock = typeof performance !== 'undefined' ? performance.now() : 10_000
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(clock)
      .mockReturnValueOnce(clock + 10)

    fireEvent.pointerDown(zone, { clientX: 100, clientY: 50 })
    fireEvent.pointerUp(zone, { clientX: 130, clientY: 52 })

    expect(Math.abs(30)).toBeLessThan(50)
    expect(getByTestId('direction').textContent).toBe('right')

    vi.mocked(performance.now).mockRestore()
  })

  it('clears swipe state on subsequent pointer-down', () => {
    const { getByTestId } = render(<SwipeHarness />)
    const zone = getByTestId('zone')

    fireEvent.pointerDown(zone, { clientX: 200, clientY: 50 })
    fireEvent.pointerUp(zone, { clientX: 140, clientY: 52 })
    expect(getByTestId('direction').textContent).toBe('left')

    fireEvent.pointerDown(zone, { clientX: 0, clientY: 0 })
    expect(getByTestId('direction').textContent).toBe('')
  })
})
