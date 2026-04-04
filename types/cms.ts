// Primitive building blocks
export type CTA = { label: string; href: string }
export type Service = { title: string; description: string; icon?: string }

// Block types — each has a unique `_type` literal for exhaustive narrowing
export type HeroBlock = {
  _type: 'hero'
  title: string
  subtitle?: string
  cta?: CTA
}

export type ServicesBlock = {
  _type: 'services'
  items: Service[]
}

export type ContactBlock = {
  _type: 'contact'
  showMap: boolean
  phone?: string
  email?: string
  address?: string
}

export type BlogListBlock = {
  _type: 'blog_list'
  postsPerPage: number
}

export type Block = HeroBlock | ServicesBlock | ContactBlock | BlogListBlock

// Client config types
export type ClientTheme = {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  fontHeading: string
  fontBody: string
  borderRadius: number
}

export type ClientFeatures = {
  blog: boolean
  booking: boolean
  gallery: boolean
  menu: boolean
}

export type ClientConfig = {
  clientId: string
  displayName: string
  sanityProjectId: string
  sanityDataset: string
  customDomain: string
  swaResourceName: string
  features: ClientFeatures
  theme: ClientTheme
}
