import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MissionBlock from '@/components/blocks/MissionBlock'

describe('MissionBlock', () => {
  it('renders the heading as an h1', () => {
    render(
      <MissionBlock
        _type="missionBlock"
        heading="Our Mission"
        body="We exist to make great software accessible."
      />
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Our Mission' })
    ).toBeInTheDocument()
  })

  it('renders the body text', () => {
    render(
      <MissionBlock
        _type="missionBlock"
        heading="Our Mission"
        body="We exist to make great software accessible."
      />
    )
    expect(
      screen.getByText('We exist to make great software accessible.')
    ).toBeInTheDocument()
  })

  it('renders an image when imageUrl is provided', () => {
    render(
      <MissionBlock
        _type="missionBlock"
        heading="Our Mission"
        body="We build things."
        imageUrl="/images/team.jpg"
        imageAlt="Our team at work"
      />
    )
    expect(screen.getByRole('img', { name: 'Our team at work' })).toBeInTheDocument()
  })

  it('falls back to heading as image alt when imageAlt is not provided', () => {
    render(
      <MissionBlock
        _type="missionBlock"
        heading="Our Mission"
        body="We build things."
        imageUrl="/images/team.jpg"
      />
    )
    expect(screen.getByRole('img', { name: 'Our Mission' })).toBeInTheDocument()
  })

  it('does not render an image element when imageUrl is omitted', () => {
    render(
      <MissionBlock
        _type="missionBlock"
        heading="Our Mission"
        body="We build things."
      />
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('wraps content in a data-component="mission-block" element', () => {
    const { container } = render(
      <MissionBlock _type="missionBlock" heading="X" body="Y" />
    )
    expect(
      container.querySelector('[data-component="mission-block"]')
    ).toBeInTheDocument()
  })
})
