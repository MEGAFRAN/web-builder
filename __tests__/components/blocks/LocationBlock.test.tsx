import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LocationBlock from '@/components/blocks/LocationBlock'

const SAMPLE_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1'

describe('LocationBlock', () => {
  it('renders title when provided', () => {
    render(
      <LocationBlock _type="location" showMap title="Ubicación" mapEmbedSrc={SAMPLE_EMBED} />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Ubicación' })).toBeInTheDocument()
  })

  it('renders map iframe when showMap is true and mapEmbedSrc is set', () => {
    render(<LocationBlock _type="location" showMap mapEmbedSrc={SAMPLE_EMBED} />)
    const iframe = screen.getByTestId('location-map-iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', SAMPLE_EMBED)
  })

  it('renders address when provided alongside map', () => {
    render(
      <LocationBlock
        _type="location"
        showMap
        mapEmbedSrc={SAMPLE_EMBED}
        address="Calle Mayor 1, Madrid"
      />,
    )
    expect(screen.getByText('Calle Mayor 1, Madrid')).toBeInTheDocument()
    expect(screen.getByTestId('location-map-iframe')).toBeInTheDocument()
  })

  it('renders address when map is disabled but address is set', () => {
    render(
      <LocationBlock _type="location" showMap={false} address="Plaza Central 2, León" />,
    )
    expect(screen.getByText('Plaza Central 2, León')).toBeInTheDocument()
    expect(screen.queryByTestId('location-map-iframe')).not.toBeInTheDocument()
  })

  it('does not render map when showMap is false', () => {
    render(<LocationBlock _type="location" showMap={false} mapEmbedSrc={SAMPLE_EMBED} />)
    expect(screen.queryByTestId('location-map-iframe')).not.toBeInTheDocument()
  })

  it('renders nothing when there is no map and no address', () => {
    render(<LocationBlock _type="location" showMap={false} />)
    expect(screen.queryByTestId('location-map-iframe')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('does not render map when showMap is true but mapEmbedSrc is missing', () => {
    render(<LocationBlock _type="location" showMap />)
    expect(screen.queryByTestId('location-map-iframe')).not.toBeInTheDocument()
  })

  it('does not render map when mapEmbedSrc is whitespace only', () => {
    render(<LocationBlock _type="location" showMap mapEmbedSrc="   " />)
    expect(screen.queryByTestId('location-map-iframe')).not.toBeInTheDocument()
  })
})
