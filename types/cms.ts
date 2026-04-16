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
  /** Optional explicit href. When provided, overrides the auto-generated /case-studies/{slug} link. */
  href?: string | null
}

export type CaseStudiesBlock = {
  _type: 'caseStudiesBlock'
  heading?: string | null
  subtext?: string | null
  items: CaseStudyItem[]
}

// Pricing page block types

export type PricingTierItem = {
  name: string
  price: number
  billingCadence: string
  features: string[]
  recommended: boolean
  ctaLabel: string
  ctaHref?: string | null
}

export type PromotionBanner = {
  message: string
  expiresAt: string
}

export type PricingTestimonialItem = {
  name: string
  company?: string | null
  role?: string | null
  quote: string
  avatarUrl?: string | null
}

export type PricingFaqItem = {
  question: string
  answer: string
}

export type PricingPageBlock = {
  _type: 'pricingPageBlock'
  tiers: PricingTierItem[]
  promotionBanner?: PromotionBanner | null
  testimonials: PricingTestimonialItem[]
  faqItems: PricingFaqItem[]
  navbarLogo?: string | null
  navbarLinks?: Array<{ label: string; href: string }> | null
  footerColumns?: Array<{ title: string; links: Array<{ label: string; href: string }> }> | null
  footerCopyright?: string | null
}

// Case study detail page block type

export type CaseStudyDetailTechStack = {
  category: string
  items: string[]
}

export type CaseStudyDetailSolutionItem = {
  title: string
  description: string
}

export type CaseStudyDetailImpactItem = {
  label: string
  value: string
}

export type CaseStudyDetailBlock = {
  _type: 'caseStudyDetailBlock'
  title: string
  breadcrumbItems?: Array<{ label: string; href?: string | null }> | null
  challengeHeading?: string | null
  challengeBody: string
  techStackHeading?: string | null
  techStack: CaseStudyDetailTechStack[]
  solutionHeading?: string | null
  solutionItems: CaseStudyDetailSolutionItem[]
  ahaHeading?: string | null
  ahaBody: string
  impactHeading?: string | null
  impactItems: CaseStudyDetailImpactItem[]
  tags?: string[] | null
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
  | PricingPageBlock
  | ServicesPageBlock
  | TestimonialsPageBlock
  | CaseStudyDetailBlock
  | CarouselBlock

// Services page block types

export type ServiceFeatureCategory = {
  title: string
  summary: string
  categoryBadge: string
}

export type ServiceCardItem = {
  title: string
  description: string
  deliverables: string[]
  imageUrl?: string | null
  imageAlt?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  slug?: string | null
}

export type ServicesFaqItem = {
  question: string
  answer: string
}

export type ServicesPageBlock = {
  _type: 'servicesPageBlock'
  heroHeading?: string | null
  heroText?: string | null
  featureCategories?: ServiceFeatureCategory[] | null
  serviceCards?: ServiceCardItem[] | null
  faqItems?: ServicesFaqItem[] | null
  navbarLogo?: string | null
  navbarLinks?: Array<{ label: string; href: string }> | null
  footerColumns?: Array<{ title: string; links: Array<{ label: string; href: string }> }> | null
  footerCopyright?: string | null
}

// Testimonials page block types

export type TestimonialsPageTestimonial = {
  authorName: string
  authorRole?: string | null
  authorCompany?: string | null
  authorPhotoUrl?: string | null
  quote: string
  featured: boolean
  publishedAt?: string | null
}

export type TestimonialsPageLogoItem = {
  src?: string | null
  alt: string
  name?: string | null
}

export type TestimonialsPageStatItem = {
  value: string
  label: string
}

export type TestimonialsPageBlock = {
  _type: 'testimonialsPageBlock'
  stats?: TestimonialsPageStatItem[] | null
  featuredTestimonials?: TestimonialsPageTestimonial[] | null
  allTestimonials?: TestimonialsPageTestimonial[] | null
  logoCloudLogos?: TestimonialsPageLogoItem[] | null
  navbarLogo?: string | null
  navbarLinks?: Array<{ label: string; href: string }> | null
  footerColumns?: Array<{ title: string; links: Array<{ label: string; href: string }> }> | null
  footerCopyright?: string | null
}

// Carousel block
export type CarouselItem = {
  imageUrl?: string | null
  imageAlt?: string | null
  caption?: string | null
  quote?: string | null
  author?: string | null
  role?: string | null
  company?: string | null
  avatarUrl?: string | null
  title?: string | null
  description?: string | null
}

export type CarouselBlock = {
  _type: 'carouselBlock'
  title?: string | null
  items: CarouselItem[]
  mode: 'image' | 'testimonial' | 'card'
  slidesVisible?: 1 | 2 | 3 | null
  aspectRatio?: string | null
  imageFit?: 'cover' | 'contain' | 'fill' | null
  autoPlay?: boolean | null
  autoPlayInterval?: number | null
  loop?: boolean | null
  showArrows?: boolean | null
  showIndicators?: boolean | null
  background?: 'white' | 'gray' | 'dark' | null
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | null
  transition?: 'slide' | 'fade' | null
}

// Page metadata
export type PageMetadata = {
  title?: string | null
  description?: string | null
  ogImage?: string | null
  noIndex?: boolean | null
}

// Site-level SEO defaults (lives in client.json)
export type SiteMetadata = {
  siteName?: string | null
  titleTemplate?: string | null
  defaultDescription?: string | null
  defaultOgImage?: string | null
}

// Page inset types
export type PageInsetResponsive = {
  mobile: string   // applied below the tablet breakpoint
  tablet?: string  // optional mid-breakpoint (768px–1279px)
  desktop: string  // applied at 1280px and above
}

export type PageInset = string | PageInsetResponsive

// Client config types
export type ClientTheme = {
  preset?: string
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  surfaceColor?: string
  surfaceDark?: string
  fontHeading?: string
  fontBody?: string
  borderRadius?: number
  pageInset?: PageInset   // e.g. "clamp(1rem, 5vw, 2rem)", "1.5rem", or { mobile: "10px", desktop: "30px" }
  sectionSpacing?: PageInset  // controls --section-spacing
  contentGap?: PageInset      // controls --content-gap
}

export type ClientFeatures = {
  blog: boolean
  booking: boolean
  gallery: boolean
  menu: boolean
}

export type ClientPage = {
  slug: string
  blocks: Block[]
  metadata?: PageMetadata | null
}

export type ClientHeader = {
  logo: string
  links?: NavLink[] | null
  ctaLabel?: string | null
  ctaAction?: string | null
}

export type ClientFooter = {
  columns?: FooterColumn[] | null
  copyright?: string | null
}

export type ClientConfig = {
  clientId: string
  displayName: string
  customDomain: string
  swaResourceName: string
  template?: string | null   // e.g. "restaurant-standard"
  features: ClientFeatures
  theme: ClientTheme
  header?: ClientHeader | null
  footer?: ClientFooter | null
  pages: ClientPage[]
  siteMetadata?: SiteMetadata | null
  contactEndpoint?: string
  externalReviewUrl?: string
  externalReviewPlatform?: string
}
