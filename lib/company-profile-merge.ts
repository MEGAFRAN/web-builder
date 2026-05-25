import type { CompanyProfile } from '@/types/admin'
import type {
  BottomActionBarItem,
  ContactInfoBlock,
  FooterBlock,
  LocationBlock,
  NavbarBlock,
  ClientFooter,
  ClientHeader,
} from '@/types/cms'

export function formatProfileAddress(address: CompanyProfile['address']): string {
  const parts = [address.street, address.city, address.postalCode, address.country].filter(
    (part) => part.trim().length > 0,
  )
  return parts.join(', ')
}

function normalizeTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits.startsWith('+') ? `tel:${digits}` : `tel:${digits.replace(/\D/g, '')}`
}

function normalizeWhatsAppHref(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

function isTelLink(href: string): boolean {
  return href.trim().toLowerCase().startsWith('tel:')
}

function isAddressLink(href: string): boolean {
  const h = href.trim().toLowerCase()
  return h === '#location' || h.endsWith('#location')
}

function isContactColumn(title: string): boolean {
  return title.toLowerCase().includes('contact')
}

function isHoursColumn(title: string): boolean {
  const t = title.toLowerCase()
  return t.includes('hours') || t.includes('horario')
}

function mergeHoursColumnLinks(hours: string): Array<{ label: string; href: string }> {
  const trimmed = hours.trim()
  if (!trimmed) return []
  return trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label, href: '#' }))
}

function mergeContactColumnLinks(
  links: ReadonlyArray<{ label: string; href: string }>,
  profile: CompanyProfile,
): Array<{ label: string; href: string }> {
  const phone = profile.phone.trim()
  const email = profile.email.trim()
  const addressText = formatProfileAddress(profile.address)

  let merged = links.filter((link) => !isAddressLink(link.href))

  if (phone) {
    const phoneLink = { label: phone, href: normalizeTelHref(phone) }
    const telIndex = merged.findIndex((link) => isTelLink(link.href))
    if (telIndex >= 0) {
      merged = merged.map((link, index) => (index === telIndex ? phoneLink : link))
    } else {
      merged = [phoneLink, ...merged]
    }
  }

  if (addressText) {
    merged.push({ label: addressText, href: '#location' })
  }

  if (email && !merged.some((link) => link.href.trim().toLowerCase().startsWith('mailto:'))) {
    merged.push({ label: email, href: `mailto:${email}` })
  }

  return merged
}

function mergeFooterColumns(
  columns: ClientFooter['columns'],
  profile: CompanyProfile | null,
): ClientFooter['columns'] {
  if (!columns) return columns
  if (!profile) return columns

  return columns.map((col) => {
    if (isContactColumn(col.title)) {
      return {
        ...col,
        links: mergeContactColumnLinks(col.links, profile),
      }
    }
    if (isHoursColumn(col.title) && profile.hours.trim()) {
      return {
        ...col,
        links: mergeHoursColumnLinks(profile.hours),
      }
    }
    return col
  })
}

function isWhatsAppLink(href: string): boolean {
  const lower = href.trim().toLowerCase()
  return lower.includes('wa.me') || lower.includes('whatsapp')
}

export function mergeLayoutHeader(
  header: ClientHeader | null | undefined,
  profile: CompanyProfile | null,
): ClientHeader | null {
  if (!header) return null
  const existingLogo = header.logo?.trim() ?? ''
  const logo =
    existingLogo.length > 0 ? header.logo : (profile?.businessName?.trim() ?? existingLogo)
  return {
    logo,
    links: header.links ?? null,
    ctaLabel: header.ctaLabel ?? null,
    ctaAction: header.ctaAction ?? null,
  }
}

export function mergeLayoutFooter(
  footer: ClientFooter | null | undefined,
  profile: CompanyProfile | null,
): ClientFooter | null {
  if (!footer) return null

  const columns = mergeFooterColumns(footer.columns, profile)

  return {
    columns,
    copyright: footer.copyright ?? null,
  }
}

export function mergeBottomActionBarItems(
  items: BottomActionBarItem[],
  profile: CompanyProfile | null,
): BottomActionBarItem[] {
  if (!profile) return items

  const merged = items.map((item) => {
    if (profile.phone.trim() && isTelLink(item.href)) {
      return { ...item, href: normalizeTelHref(profile.phone) }
    }
    return item
  })

  const hasWhatsApp = merged.some((item) => isWhatsAppLink(item.href))
  if (profile.whatsapp?.trim() && !hasWhatsApp) {
    merged.push({
      label: 'WhatsApp',
      href: normalizeWhatsAppHref(profile.whatsapp),
      icon: 'public/whatsapp.svg',
      iconColor: '#ffffff',
    })
  }

  return merged
}

export function mergeNavbarBlockProps(
  block: NavbarBlock,
  profile: CompanyProfile | null,
): NavbarBlock {
  const existingLogo = block.logo?.trim() ?? ''
  if (existingLogo.length > 0 || !profile?.businessName?.trim()) return block
  return { ...block, logo: profile.businessName.trim() }
}

export function mergeFooterBlockProps(
  block: FooterBlock,
  profile: CompanyProfile | null,
): FooterBlock {
  const merged = mergeLayoutFooter({ columns: block.columns, copyright: block.copyright }, profile)
  return {
    ...block,
    columns: merged?.columns ?? block.columns,
    copyright: merged?.copyright ?? block.copyright,
  }
}

export function mergeContactInfoBlockProps(
  block: ContactInfoBlock,
  profile: CompanyProfile | null,
): ContactInfoBlock {
  if (!profile) return block
  const addressText = formatProfileAddress(profile.address)
  return {
    ...block,
    email: block.email?.trim() ? block.email : profile.email.trim() || block.email,
    phone: block.phone?.trim() ? block.phone : profile.phone.trim() || block.phone,
    address: block.address?.trim() ? block.address : addressText || block.address,
    fallbackEmail: block.fallbackEmail?.trim()
      ? block.fallbackEmail
      : profile.email.trim() || block.fallbackEmail,
  }
}

function buildMapEmbedSrc(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
}

export function mergeLocationBlockProps(
  block: LocationBlock,
  profile: CompanyProfile | null,
): LocationBlock {
  if (!profile) return block

  const blockAddress = block.address?.trim() ?? ''
  const profileAddress = formatProfileAddress(profile.address)
  const resolvedAddress = blockAddress || profileAddress

  const updates: Partial<LocationBlock> = {}

  if (!blockAddress && profileAddress) {
    updates.address = profileAddress
  }

  const blockMapSrc = block.mapEmbedSrc?.trim() ?? ''
  if (block.showMap && !blockMapSrc && resolvedAddress) {
    updates.mapEmbedSrc = buildMapEmbedSrc(resolvedAddress)
  }

  if (Object.keys(updates).length === 0) return block
  return { ...block, ...updates }
}
