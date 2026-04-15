'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CarouselBlock } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Avatar } from '@/components/content/Avatar'
import { Card } from '@/components/data/Card'
import { Image } from '@/components/content/Image'
import { useSwipe } from '@/lib/hooks/useSwipe'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CarouselMode = 'image' | 'testimonial' | 'card'
type TransitionType = 'slide' | 'fade'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Previous / next arrow button rendered in the DOM regardless of showArrows */
function ArrowButton({
  direction,
  onClick,
  disabled,
  hidden,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
  hidden: boolean
}) {
  const label = direction === 'prev' ? 'Previous slide' : 'Next slide'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-hidden={hidden ? 'true' : undefined}
      tabIndex={hidden ? -1 : 0}
      className={[
        'flex items-center justify-center',
        'min-h-[44px] min-w-[44px] rounded-[var(--radius)]',
        'bg-primary text-primary-fg',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'transition-opacity hover:opacity-80 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        hidden ? 'pointer-events-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ minWidth: 44, minHeight: 44 }}
    >
      {direction === 'prev' ? (
        // Left chevron
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="13 4 7 10 13 16" />
        </svg>
      ) : (
        // Right chevron
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="7 4 13 10 7 16" />
        </svg>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Carousel({
  title,
  items,
  mode,
  slidesVisible = 1,
  aspectRatio,
  imageFit,
  autoPlay = false,
  autoPlayInterval = 4000,
  loop = false,
  showArrows = true,
  showIndicators = true,
  background = 'white',
  paddingY = 'lg',
  transition = 'slide',
}: CarouselBlock) {
  const safeItems = items ?? []
  const count = safeItems.length
  const visCount = Math.max(1, slidesVisible ?? 1) as 1 | 2 | 3
  const safeInterval = Math.max(2000, autoPlayInterval ?? 4000)
  const transitionType: TransitionType = transition ?? 'slide'
  const isLoop = loop ?? false
  const showArrowsResolved = showArrows !== false
  const showIndicatorsResolved = showIndicators !== false
  const useTextCounter = count > 8

  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(autoPlay ?? false)
  const trackRef = useRef<HTMLDivElement>(null)
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Swipe
  const { swipeDirection, onPointerDown, onPointerMove, onPointerUp } = useSwipe(trackRef)

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const canGoPrev = isLoop || active > 0
  const canGoNext = isLoop || active < count - 1

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      let next = index
      if (isLoop) {
        next = ((index % count) + count) % count
      } else {
        next = Math.max(0, Math.min(count - 1, index))
      }
      setActive(next)
    },
    [count, isLoop]
  )

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])
  const goNext = useCallback(() => goTo(active + 1), [active, goTo])

  // ---------------------------------------------------------------------------
  // Swipe direction effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!swipeDirection) return
    if (swipeDirection === 'left') goNext()
    else goPrev()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeDirection])

  // ---------------------------------------------------------------------------
  // Auto-play
  // ---------------------------------------------------------------------------

  const clearTimer = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    if (!playing || count <= 1) return
    clearTimer()
    autoPlayTimerRef.current = setInterval(() => {
      setActive((prev) => {
        if (isLoop) return ((prev + 1) % count)
        if (prev < count - 1) return prev + 1
        // Reached end and not looping — stop
        setPlaying(false)
        return prev
      })
    }, safeInterval)
  }, [playing, count, isLoop, safeInterval, clearTimer])

  useEffect(() => {
    startTimer()
    return clearTimer
  }, [startTimer, clearTimer])

  // Pause on visibilitychange
  useEffect(() => {
    const handler = () => {
      if (document.hidden) clearTimer()
      else if (playing) startTimer()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [playing, clearTimer, startTimer])

  // Respect prefers-reduced-motion for auto-play
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setPlaying(false)
      clearTimer()
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setPlaying(false)
        clearTimer()
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [clearTimer])

  // ---------------------------------------------------------------------------
  // Keyboard navigation on track
  // ---------------------------------------------------------------------------

  const handleTrackKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    },
    [goPrev, goNext]
  )

  // ---------------------------------------------------------------------------
  // 0 items edge case
  // ---------------------------------------------------------------------------

  if (count === 0) {
    return (
      <Section
        background={background ?? 'white'}
        paddingY={paddingY ?? 'lg'}
      >
        <Container maxWidth="2xl" padding="theme">
          <p className="text-center text-muted">No slides configured.</p>
        </Container>
      </Section>
    )
  }

  // ---------------------------------------------------------------------------
  // Slide styles
  // ---------------------------------------------------------------------------

  /**
   * Returns the inline styles for a given slide index.
   * All slides are always in the DOM (SSG SEO requirement).
   * Non-active slides use `inert` + `visibility: hidden`.
   */
  function getSlideStyle(index: number): React.CSSProperties {
    if (transitionType === 'fade') {
      return {
        opacity: index === active ? 1 : 0,
        transition: `opacity var(--carousel-transition-duration) ease`,
        position: 'absolute',
        inset: 0,
        visibility: index === active ? 'visible' : 'hidden',
      }
    }
    // slide mode: all slides stacked horizontally in a grid cell; use translateX
    const offset = (index - active) * 100
    return {
      transform: `translateX(${offset}%)`,
      transition: `transform var(--carousel-transition-duration) ease-in-out`,
      position: 'absolute',
      inset: 0,
      visibility: index === active ? 'visible' : 'hidden',
    }
  }

  // ---------------------------------------------------------------------------
  // Slide rendering by mode
  // ---------------------------------------------------------------------------

  const carouselMode: CarouselMode = mode

  function renderSlide(item: (typeof safeItems)[number], index: number) {
    const isActive = index === active

    if (carouselMode === 'image') {
      return (
        <figure
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${count}`}
          key={index}
          style={getSlideStyle(index)}
          inert={!isActive ? true : undefined}
          className="m-0"
        >
          <div
            className="relative w-full overflow-hidden bg-surface"
            style={{
              aspectRatio: aspectRatio ?? '16/9',
            }}
          >
            <Image
              fill
              src={item.imageUrl ?? ''}
              alt={item.imageAlt ?? ''}
              objectFit={imageFit ?? 'cover'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
          {item.caption && (
            <figcaption className="pt-2 text-center text-sm text-muted">
              {item.caption}
            </figcaption>
          )}
        </figure>
      )
    }

    if (carouselMode === 'testimonial') {
      return (
        <div
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${count}`}
          key={index}
          style={getSlideStyle(index)}
          inert={!isActive ? true : undefined}
          className="flex items-center justify-center"
        >
          <blockquote className="w-full rounded-xl border border-border bg-background p-8">
            <Stack gap="lg">
              <p className="text-lg leading-relaxed text-foreground">
                {item.quote}
              </p>
              <footer className="flex items-center gap-3">
                <Avatar
                  src={item.avatarUrl ?? null}
                  name={item.author ?? 'Author'}
                  size="md"
                />
                <div>
                  <span className="font-semibold text-foreground">
                    {item.author}
                  </span>
                  {item.role && (
                    <span className="ml-1 text-sm text-muted">{item.role}</span>
                  )}
                  {item.company && (
                    <p className="text-sm text-muted">{item.company}</p>
                  )}
                </div>
              </footer>
            </Stack>
          </blockquote>
        </div>
      )
    }

    // card mode
    return (
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${index + 1} of ${count}`}
        key={index}
        style={getSlideStyle(index)}
        inert={!isActive ? true : undefined}
        className="flex items-center justify-center"
      >
        <Card
          title={item.title ?? undefined}
          description={item.description ?? undefined}
          padding="lg"
        />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Track height (content modes: tallest slide)
  // For image mode we use aspect-ratio. For others we need a min-height via JS
  // but since we're SSG we use a reasonable default that CSS can expand.
  // ---------------------------------------------------------------------------

  const trackHeightStyle: React.CSSProperties =
    carouselMode === 'image' ? {} : { minHeight: '200px' }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isSingleItem = count === 1

  return (
    <Section
      background={background ?? 'white'}
      paddingY={paddingY ?? 'lg'}
    >
      <Container maxWidth="2xl" padding="theme">
        <section
          data-component="carousel"
          aria-label={title ?? 'Image carousel'}
        >
          <Stack gap="md">
            {/* Section title */}
            {title && (
              <h2 className="text-center text-3xl font-bold text-foreground">
                {title}
              </h2>
            )}

            {/* Auto-play controls (top-right, only when autoPlay is enabled and count > 1) */}
            {(autoPlay ?? false) && !isSingleItem && (
              <div className="flex justify-end">
                <button
                  type="button"
                  aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                  aria-pressed={playing}
                  onClick={() => setPlaying((p) => !p)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius)] border border-border bg-background text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none"
                  style={{ minWidth: 44, minHeight: 44 }}
                >
                  {playing ? (
                    // Pause icon
                    <svg
                      aria-hidden="true"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <rect x="5" y="4" width="3" height="12" rx="1" />
                      <rect x="12" y="4" width="3" height="12" rx="1" />
                    </svg>
                  ) : (
                    // Play icon
                    <svg
                      aria-hidden="true"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M6 4l10 6-10 6V4z" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Track + overlaid desktop arrows */}
            <div className="relative">
              {/* Slide track */}
              <div
                ref={trackRef}
                role="region"
                aria-live="polite"
                aria-atomic="false"
                tabIndex={0}
                onKeyDown={handleTrackKeyDown}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onMouseEnter={() => playing && clearTimer()}
                onMouseLeave={() => playing && startTimer()}
                onFocus={() => playing && clearTimer()}
                onBlur={() => playing && startTimer()}
                className="carousel-track relative w-full overflow-hidden focus:outline-none focus-visible:ring-2"
                style={trackHeightStyle}
              >
                {safeItems.map((item, index) => renderSlide(item, index))}
              </div>

              {/* Desktop overlay arrows (md and above) */}
              {!isSingleItem && (
                <>
                  <div
                    className="absolute inset-block-0 start-2 hidden items-center md:flex"
                    style={{ top: 0, bottom: 0, left: '0.5rem' }}
                  >
                    <ArrowButton
                      direction="prev"
                      onClick={goPrev}
                      disabled={!canGoPrev}
                      hidden={!showArrowsResolved}
                    />
                  </div>
                  <div
                    className="absolute inset-block-0 end-2 hidden items-center md:flex"
                    style={{ top: 0, bottom: 0, right: '0.5rem' }}
                  >
                    <ArrowButton
                      direction="next"
                      onClick={goNext}
                      disabled={!canGoNext}
                      hidden={!showArrowsResolved}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Mobile arrows — rendered below track on small screens */}
            {!isSingleItem && (
              <div className="flex justify-center gap-3 md:hidden">
                <ArrowButton
                  direction="prev"
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  hidden={!showArrowsResolved}
                />
                <ArrowButton
                  direction="next"
                  onClick={goNext}
                  disabled={!canGoNext}
                  hidden={!showArrowsResolved}
                />
              </div>
            )}

            {/* Indicators */}
            {!isSingleItem && showIndicatorsResolved && (
              <div className="flex justify-center">
                {useTextCounter ? (
                  <p
                    aria-live="polite"
                    className="text-sm text-muted"
                  >
                    Slide {active + 1} of {count}
                  </p>
                ) : (
                  <div
                    role="tablist"
                    aria-label="Slides"
                    className="flex items-center gap-2"
                  >
                    {safeItems.map((_, index) => {
                      const isCurrent = index === active
                      return (
                        <button
                          key={index}
                          type="button"
                          role="tab"
                          aria-label={`Go to slide ${index + 1}`}
                          aria-current={isCurrent ? 'true' : 'false'}
                          onClick={() => goTo(index)}
                          className="flex items-center justify-center focus-visible:outline-none focus-visible:ring-2"
                          /* 44×44 tap target via padding */
                          style={{ padding: '12px', lineHeight: 0 }}
                        >
                          <span
                            className="block rounded-full transition-all duration-200"
                            style={{
                              width: isCurrent ? '12px' : '8px',
                              height: isCurrent ? '12px' : '8px',
                              backgroundColor: isCurrent
                                ? 'var(--color-primary)'
                                : 'color-mix(in srgb, var(--color-text) 30%, transparent)',
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Stack>
        </section>
      </Container>
    </Section>
  )
}
