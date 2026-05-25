import { describe, it, expect } from 'vitest'
import type { CompanyProfile } from '@/types/admin'
import type {
  BottomActionBarItem,
  ContactInfoBlock,
  FooterBlock,
  LocationBlock,
  NavbarBlock,
} from '@/types/cms'
import {
  formatProfileAddress,
  mergeBottomActionBarItems,
  mergeContactInfoBlockProps,
  mergeFooterBlockProps,
  mergeLayoutFooter,
  mergeLayoutHeader,
  mergeLocationBlockProps,
  mergeNavbarBlockProps,
} from '@/lib/company-profile-merge'

const sampleProfile: CompanyProfile = {
  businessName: 'Acme Spa',
  phone: '+34 600 111 222',
  email: 'hello@acme.test',
  address: {
    street: 'Calle Mayor 1',
    city: 'Madrid',
    postalCode: '28001',
    country: 'España',
  },
  hours: 'Mon–Fri 9:00–18:00\nSat 10:00–14:00',
  logoUrl: 'https://example.com/logo.png',
  whatsapp: '+34 611 222 333',
}

describe('formatProfileAddress', () => {
  it('joins non-empty address parts with commas', () => {
    expect(formatProfileAddress(sampleProfile.address)).toBe(
      'Calle Mayor 1, Madrid, 28001, España',
    )
  })

  it('skips blank address parts', () => {
    expect(
      formatProfileAddress({
        street: 'Main St',
        city: '',
        postalCode: '  ',
        country: 'Spain',
      }),
    ).toBe('Main St, Spain')
  })

  it('returns an empty string when all parts are blank', () => {
    expect(
      formatProfileAddress({ street: '', city: '', postalCode: '', country: '' }),
    ).toBe('')
  })
})

describe('mergeLayoutHeader', () => {
  const header = {
    logo: '',
    links: [{ label: 'Home', href: '/' }],
    ctaLabel: 'Book',
    ctaAction: '/book',
  }

  it('returns null when header is null or undefined', () => {
    expect(mergeLayoutHeader(null, sampleProfile)).toBeNull()
    expect(mergeLayoutHeader(undefined, sampleProfile)).toBeNull()
  })

  it('keeps an existing logo and preserves other fields', () => {
    expect(mergeLayoutHeader({ ...header, logo: 'My Logo' }, sampleProfile)).toEqual({
      logo: 'My Logo',
      links: header.links,
      ctaLabel: 'Book',
      ctaAction: '/book',
    })
  })

  it('uses profile business name when logo is empty', () => {
    expect(mergeLayoutHeader(header, sampleProfile)).toEqual({
      logo: 'Acme Spa',
      links: header.links,
      ctaLabel: 'Book',
      ctaAction: '/book',
    })
  })

  it('leaves logo empty when profile has no business name', () => {
    expect(
      mergeLayoutHeader(header, { ...sampleProfile, businessName: '   ' }),
    ).toEqual({
      logo: '',
      links: header.links,
      ctaLabel: 'Book',
      ctaAction: '/book',
    })
  })
})

describe('mergeLayoutFooter', () => {
  const footer = {
    columns: [
      {
        title: 'Contact Us',
        links: [
          { label: 'Old phone', href: 'tel:+34000000000' },
          { label: 'Old address', href: '#location' },
        ],
      },
      {
        title: 'Opening Hours',
        links: [{ label: 'Placeholder', href: '#' }],
      },
      {
        title: 'Legal',
        links: [{ label: 'Privacy', href: '/privacy' }],
      },
    ],
    copyright: '© Acme',
  }

  it('returns null when footer is null or undefined', () => {
    expect(mergeLayoutFooter(null, sampleProfile)).toBeNull()
    expect(mergeLayoutFooter(undefined, sampleProfile)).toBeNull()
  })

  it('returns footer unchanged when profile is null', () => {
    expect(mergeLayoutFooter(footer, null)).toEqual(footer)
  })

  it('merges contact and hours columns from profile', () => {
    const merged = mergeLayoutFooter(footer, sampleProfile)
    expect(merged?.columns?.[0]?.links).toEqual([
      { label: '+34 600 111 222', href: 'tel:+34600111222' },
      { label: 'Calle Mayor 1, Madrid, 28001, España', href: '#location' },
      { label: 'hello@acme.test', href: 'mailto:hello@acme.test' },
    ])
    expect(merged?.columns?.[1]?.links).toEqual([
      { label: 'Mon–Fri 9:00–18:00', href: '#' },
      { label: 'Sat 10:00–14:00', href: '#' },
    ])
    expect(merged?.columns?.[2]).toEqual(footer.columns![2])
  })

  it('recognizes Spanish hours column titles', () => {
    const merged = mergeLayoutFooter(
      {
        columns: [{ title: 'Horario', links: [] }],
        copyright: null,
      },
      sampleProfile,
    )
    expect(merged?.columns?.[0]?.links).toEqual([
      { label: 'Mon–Fri 9:00–18:00', href: '#' },
      { label: 'Sat 10:00–14:00', href: '#' },
    ])
  })

  it('does not add duplicate mailto links in contact column', () => {
    const merged = mergeLayoutFooter(
      {
        columns: [
          {
            title: 'Contact',
            links: [{ label: 'Email us', href: 'mailto:existing@example.com' }],
          },
        ],
        copyright: null,
      },
      sampleProfile,
    )
    expect(merged?.columns?.[0]?.links).toEqual([
      { label: '+34 600 111 222', href: 'tel:+34600111222' },
      { label: 'Email us', href: 'mailto:existing@example.com' },
      { label: 'Calle Mayor 1, Madrid, 28001, España', href: '#location' },
    ])
  })
})

describe('mergeBottomActionBarItems', () => {
  const items: BottomActionBarItem[] = [
    { label: 'Call', href: 'tel:+34000000000', icon: 'phone.svg' },
    { label: 'Home', href: '/', icon: 'home.svg' },
  ]

  it('returns items unchanged when profile is null', () => {
    expect(mergeBottomActionBarItems(items, null)).toEqual(items)
  })

  it('updates tel links and appends WhatsApp when missing', () => {
    expect(mergeBottomActionBarItems(items, sampleProfile)).toEqual([
      { label: 'Call', href: 'tel:+34600111222', icon: 'phone.svg' },
      { label: 'Home', href: '/', icon: 'home.svg' },
      {
        label: 'WhatsApp',
        href: 'https://wa.me/34611222333',
        icon: 'public/whatsapp.svg',
        iconColor: '#ffffff',
      },
    ])
  })

  it('does not append WhatsApp when an item already links to WhatsApp', () => {
    const withWhatsApp: BottomActionBarItem[] = [
      ...items,
      { label: 'Chat', href: 'https://wa.me/34600000000' },
    ]
    expect(mergeBottomActionBarItems(withWhatsApp, sampleProfile)).toEqual([
      { label: 'Call', href: 'tel:+34600111222', icon: 'phone.svg' },
      { label: 'Home', href: '/', icon: 'home.svg' },
      { label: 'Chat', href: 'https://wa.me/34600000000' },
    ])
  })
})

describe('mergeNavbarBlockProps', () => {
  const block: NavbarBlock = {
    _type: 'navbar',
    logo: '',
    links: [{ label: 'Home', href: '/' }],
  }

  it('returns block unchanged when logo is already set', () => {
    const withLogo = { ...block, logo: 'Site Logo' }
    expect(mergeNavbarBlockProps(withLogo, sampleProfile)).toBe(withLogo)
  })

  it('returns block unchanged when profile business name is missing', () => {
    expect(
      mergeNavbarBlockProps(block, { ...sampleProfile, businessName: '  ' }),
    ).toBe(block)
  })

  it('fills logo from profile business name when empty', () => {
    expect(mergeNavbarBlockProps(block, sampleProfile)).toEqual({
      ...block,
      logo: 'Acme Spa',
    })
  })
})

describe('mergeFooterBlockProps', () => {
  it('merges footer block columns through layout footer merge', () => {
    const block: FooterBlock = {
      _type: 'footer',
      columns: [
        {
          title: 'Contact',
          links: [{ label: 'Call', href: 'tel:+34000000000' }],
        },
      ],
      copyright: '© Acme',
    }

    expect(mergeFooterBlockProps(block, sampleProfile)).toEqual({
      ...block,
      columns: [
        {
          title: 'Contact',
          links: [
            { label: '+34 600 111 222', href: 'tel:+34600111222' },
            { label: 'Calle Mayor 1, Madrid, 28001, España', href: '#location' },
            { label: 'hello@acme.test', href: 'mailto:hello@acme.test' },
          ],
        },
      ],
    })
  })
})

describe('mergeContactInfoBlockProps', () => {
  const block: ContactInfoBlock = {
    _type: 'contactInfoBlock',
    email: '',
    phone: '',
    address: '',
    fallbackEmail: '',
  }

  it('returns block unchanged when profile is null', () => {
    expect(mergeContactInfoBlockProps(block, null)).toBe(block)
  })

  it('fills empty contact fields from profile', () => {
    expect(mergeContactInfoBlockProps(block, sampleProfile)).toEqual({
      ...block,
      email: 'hello@acme.test',
      phone: '+34 600 111 222',
      address: 'Calle Mayor 1, Madrid, 28001, España',
      fallbackEmail: 'hello@acme.test',
    })
  })

  it('preserves block values when already set', () => {
    const populated: ContactInfoBlock = {
      ...block,
      email: 'block@example.com',
      phone: '+1 555 0100',
      address: 'Block address',
      fallbackEmail: 'fallback@example.com',
    }
    expect(mergeContactInfoBlockProps(populated, sampleProfile)).toEqual(populated)
  })
})

describe('mergeLocationBlockProps', () => {
  const block: LocationBlock = {
    _type: 'location',
    title: 'Find us',
    showMap: true,
    mapEmbedSrc: '',
    address: '',
  }

  it('returns block unchanged when profile is null', () => {
    expect(mergeLocationBlockProps(block, null)).toBe(block)
  })

  it('fills address and map embed from profile when block values are empty', () => {
    const merged = mergeLocationBlockProps(block, sampleProfile)
    expect(merged.address).toBe('Calle Mayor 1, Madrid, 28001, España')
    expect(merged.mapEmbedSrc).toBe(
      'https://www.google.com/maps?q=Calle%20Mayor%201%2C%20Madrid%2C%2028001%2C%20Espa%C3%B1a&output=embed',
    )
  })

  it('does not overwrite existing address or map embed', () => {
    const populated: LocationBlock = {
      ...block,
      address: 'Existing address',
      mapEmbedSrc: 'https://maps.example/embed',
    }
    expect(mergeLocationBlockProps(populated, sampleProfile)).toBe(populated)
  })

  it('does not build map embed when showMap is false', () => {
    const noMap: LocationBlock = { ...block, showMap: false }
    expect(mergeLocationBlockProps(noMap, sampleProfile)).toEqual({
      ...noMap,
      address: 'Calle Mayor 1, Madrid, 28001, España',
    })
  })
})
