import type {
  Service,
  TestimonialItem,
  FaqItem,
  FeatureGridItem,
  TeamMember,
  StatItem,
  PricingTierItem,
  LogoItem,
  CaseStudyItem,
  FooterColumn,
  NavLink,
} from '@/types/cms'
import type { CarouselBlock } from '@/types/cms'

export const mockNavLinks: NavLink[] = [
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export const mockFooterColumns: FooterColumn[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Consulting', href: '/services/consulting' },
      { label: 'Design', href: '/services/design' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]

export const mockServices: Service[] = [
  {
    title: 'Haircut & Style',
    description: 'A full cut and blow-dry with our expert stylists.',
    price: '$55',
  },
  {
    title: 'Color Treatment',
    description: 'Full color service including consultation.',
    price: 'From $120',
    subItems: ['Highlights', 'Full color', 'Balayage'],
  },
  {
    title: 'Deep Conditioning',
    description: 'Restore moisture and shine to damaged hair.',
    price: '$45',
  },
]

export const mockServicesWithSubItems: Service[] = [
  {
    title: 'Deep Tissue Massage',
    description: 'Targets muscle knots and tension for lasting relief.',
    subItems: [
      {
        label: '60 min session',
        price: '$80',
        duration: '60 min',
        description: {
          title: 'Ideal for chronic tension',
          items: ['Lower back relief', 'Shoulder decompression', 'Neck tension'],
        },
      },
      {
        label: '90 min session',
        price: '$110',
        duration: '90 min',
        description: {
          title: 'Full body treatment',
          items: ['Full back', 'Legs and glutes', 'Arms and hands'],
        },
      },
    ],
  },
  {
    title: 'Swedish Massage',
    description: 'Gentle, relaxing massage for stress relief.',
    subItems: [
      {
        label: '60 min session',
        price: '$70',
        duration: '60 min',
      },
    ],
  },
]

export const mockTestimonials: TestimonialItem[] = [
  {
    name: 'Maria Garcia',
    company: 'Acme Corp',
    role: 'CEO',
    quote: 'Absolutely outstanding service. Would recommend to anyone looking for quality.',
    stars: 5,
  },
  {
    name: 'John Smith',
    quote: 'Changed our business completely. The results speak for themselves.',
    stars: 4,
  },
  {
    name: 'Ana Martínez',
    company: 'Innovate Inc.',
    role: 'Head of Design',
    quote: 'The attention to detail and responsiveness exceeded all expectations.',
    stars: 5,
  },
]

export const mockFaqItems: FaqItem[] = [
  {
    question: 'How long does the process take?',
    answer: 'Typically 2–3 business days depending on complexity.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee on all services.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers.',
  },
  {
    question: 'Do you work with international clients?',
    answer: 'Absolutely. We work with clients across more than 30 countries.',
  },
]

export const mockFeatures: FeatureGridItem[] = [
  {
    heading: 'Lightning Fast',
    description: 'Optimized for speed on all devices and network conditions.',
    iconUrl: null,
  },
  {
    heading: 'Fully Customizable',
    description: 'Every element can be tailored to match your brand identity.',
    iconUrl: null,
  },
  {
    heading: '24/7 Support',
    description: 'Our team is always available to help you succeed.',
    iconUrl: null,
  },
  {
    heading: 'Secure by Default',
    description: 'Enterprise-grade security baked into every layer.',
    iconUrl: null,
  },
  {
    heading: 'Analytics Ready',
    description: 'Built-in insights to help you make data-driven decisions.',
    iconUrl: null,
  },
  {
    heading: 'Scalable Architecture',
    description: 'Grows with your business from launch to millions of users.',
    iconUrl: null,
  },
]

export const mockTeamMembers: TeamMember[] = [
  {
    name: 'Alice Johnson',
    role: 'Lead Designer',
    bio: 'Alice brings 10 years of UX expertise to every project.',
    order: 1,
    photoUrl: null,
  },
  {
    name: 'Bob Martínez',
    role: 'Senior Developer',
    bio: 'Full-stack engineer specializing in React and Next.js.',
    order: 2,
    photoUrl: null,
  },
  {
    name: 'Clara Lee',
    role: 'Project Manager',
    bio: 'Clara keeps teams aligned and clients delighted.',
    order: 3,
    photoUrl: null,
  },
]

export const mockStats: StatItem[] = [
  { value: '500+', label: 'Clients served' },
  { value: '12yr', label: 'In business' },
  { value: '98%', label: 'Satisfaction rate' },
  { value: '24/7', label: 'Support available' },
]

export const mockPricingTiers: PricingTierItem[] = [
  {
    name: 'Starter',
    price: 29,
    billingCadence: '/mo',
    features: ['5 projects', '10 GB storage', 'Email support'],
    recommended: false,
    ctaLabel: 'Get started',
  },
  {
    name: 'Pro',
    price: 79,
    billingCadence: '/mo',
    features: ['Unlimited projects', '100 GB storage', 'Priority support', 'Analytics'],
    recommended: true,
    ctaLabel: 'Start Pro',
  },
  {
    name: 'Enterprise',
    price: 199,
    billingCadence: '/mo',
    features: ['Everything in Pro', 'SSO', 'Dedicated account manager', 'SLA guarantee'],
    recommended: false,
    ctaLabel: 'Contact sales',
  },
]

export const mockCarouselImageItems: CarouselBlock['items'] = [
  {
    imageUrl: 'https://picsum.photos/seed/slide1/800/450',
    imageAlt: 'Our flagship location',
    caption: 'Our flagship location',
  },
  {
    imageUrl: 'https://picsum.photos/seed/slide2/800/450',
    imageAlt: 'The team at work',
    caption: 'The team at work',
  },
  {
    imageUrl: 'https://picsum.photos/seed/slide3/800/450',
    imageAlt: 'Award ceremony',
    caption: 'Award ceremony 2024',
  },
]

export const mockCarouselTestimonialItems: CarouselBlock['items'] = mockTestimonials.map((t) => ({
  quote: t.quote,
  author: t.name,
  role: t.role ?? null,
  company: t.company ?? null,
  stars: t.stars ?? null,
  avatarUrl: t.avatarUrl ?? null,
}))

export const mockCarouselCardItems: CarouselBlock['items'] = [
  { title: 'Project Alpha', description: 'End-to-end redesign of a SaaS dashboard.' },
  { title: 'Brand Refresh', description: 'Visual identity overhaul for a retail chain.' },
  { title: 'Mobile App', description: 'iOS and Android app launched in 3 months.' },
]

export const mockLogos: LogoItem[] = [
  { alt: 'Acme Corp', name: 'Acme Corp' },
  { alt: 'Globex', name: 'Globex' },
  { alt: 'Initech', name: 'Initech' },
  { alt: 'Umbrella', name: 'Umbrella' },
  { alt: 'Prestige Worldwide', name: 'Prestige Worldwide' },
]

export const mockCaseStudies: CaseStudyItem[] = [
  {
    title: 'Redesigning the checkout flow',
    client: 'Acme Corp',
    industry: 'E-commerce',
    summary: 'Reduced cart abandonment by 40% through UX improvements.',
    coverImageUrl: null,
    slug: 'acme-checkout-flow',
    publishedAt: '2024-03-15',
  },
  {
    title: 'API migration to GraphQL',
    client: 'Globex',
    industry: 'Technology',
    summary: 'Halved API response times and improved developer experience.',
    coverImageUrl: null,
    slug: 'globex-graphql',
    publishedAt: '2024-06-01',
  },
]
