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

// About page block types

export type MissionBlock = {
  _type: 'missionBlock'
  heading: string
  body: string
  imageUrl?: string | null
  imageAlt?: string | null
}

export type ValueCard = {
  title: string
  description: string
  icon?: string | null
}

export type ValuesBlock = {
  _type: 'valuesBlock'
  heading?: string | null
  items: ValueCard[]
}

export type TeamMember = {
  name: string
  role: string
  bio: string
  photoUrl?: string | null
  order: number
}

export type TeamBlock = {
  _type: 'teamBlock'
  heading?: string | null
  members: TeamMember[]
}

export type StatItem = {
  value: string
  label: string
}

export type StatsBlock = {
  _type: 'statsBlock'
  stats: StatItem[]
  background?: 'white' | 'gray' | 'dark' | null
}

export type LogoItem = {
  src?: string | null
  alt: string
  name?: string | null
}

export type LogoCloudBlock = {
  _type: 'logoCloud'
  title?: string | null
  context?: string | null
  logos: LogoItem[]
}

export type CTABlock = {
  _type: 'ctaBlock'
  headline: string
  subtext?: string | null
  ctaLabel: string
  ctaHref?: string | null
  background?: 'white' | 'gray' | 'dark' | null
}

export type NavLink = {
  label: string
  href: string
}

export type NavbarBlock = {
  _type: 'navbar'
  logo: string
  links?: NavLink[] | null
  ctaLabel?: string | null
  ctaAction?: string | null
}

export type BreadcrumbItem = {
  label: string
  href?: string | null
}

export type BreadcrumbBlock = {
  _type: 'breadcrumb'
  items: BreadcrumbItem[]
}

export type FooterColumn = {
  title: string
  links: NavLink[]
}

export type FooterBlock = {
  _type: 'footer'
  columns?: FooterColumn[] | null
  copyright?: string | null
}

export type DividerBlock = {
  _type: 'divider'
}

// Contact page block types

export type FaqItem = {
  question: string
  answer: string
}

export type FaqBlock = {
  _type: 'faqBlock'
  title?: string | null
  context?: string | null
  items: FaqItem[]
}

export type ContactInfoBlock = {
  _type: 'contactInfoBlock'
  email?: string | null
  phone?: string | null
  address?: string | null
  fallbackEmail?: string | null
}

// Homepage block types

export type HomepageHeroBlock = {
  _type: 'heroBlock'
  heading: string
  subtext?: string | null
  primaryButtonLabel?: string | null
  primaryButtonHref?: string | null
  secondaryButtonLabel?: string | null
  secondaryButtonHref?: string | null
  backgroundImageUrl?: string | null
}

export type FeatureGridItem = {
  heading: string
  description: string
  iconUrl?: string | null
}

export type FeatureGridBlock = {
  _type: 'featureGridBlock'
  heading?: string | null
  items: FeatureGridItem[]
}

export type TestimonialItem = {
  name: string
  company?: string | null
  role?: string | null
  quote: string
  avatarUrl?: string | null
}

export type TestimonialsBlock = {
  _type: 'testimonialsBlock'
  heading?: string | null
  items: TestimonialItem[]
}

// Case Studies page block types

export type CaseStudyItem = {
  title: string
  client: string
  industry: string
  summary: string
  coverImageUrl: string | null
  slug: string
  publishedAt: string | null
}

export type CaseStudiesBlock = {
  _type: 'caseStudiesBlock'
  heading?: string | null
  subtext?: string | null
  items: CaseStudyItem[]
}

export type Block =
  | HeroBlock
  | ServicesBlock
  | ContactBlock
  | BlogListBlock
  | MissionBlock
  | ValuesBlock
  | TeamBlock
  | StatsBlock
  | LogoCloudBlock
  | CTABlock
  | NavbarBlock
  | BreadcrumbBlock
  | FooterBlock
  | DividerBlock
  | CaseStudiesBlock
  | FaqBlock
  | ContactInfoBlock
  | HomepageHeroBlock
  | FeatureGridBlock
  | TestimonialsBlock

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
  contactEndpoint?: string
}
