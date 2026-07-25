import dynamic from 'next/dynamic'
import type React from 'react'

// Record<string, React.ComponentType<any>> is intentional: the registry maps
// _type strings to heterogeneous block components whose props don't share a
// common structural type beyond the Block union.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentRegistry: Record<string, React.ComponentType<any>> = {
  hero: dynamic(() => import('@/components/blocks/HeroBlock')),
  services: dynamic(() => import('@/components/blocks/ServicesBlock')),
  contact: dynamic(() => import('@/components/blocks/ContactBlock')),
  location: dynamic(() => import('@/components/blocks/LocationBlock')),
  contactInfoBlock: dynamic(() => import('@/components/blocks/ContactInfoBlock')),
  contactFormSection: dynamic(() => import('@/components/blocks/ContactFormSection')),
  blog_list: dynamic(() => import('@/components/blocks/BlogListBlock')),
  missionBlock: dynamic(() => import('@/components/blocks/MissionBlock')),
  valuesBlock: dynamic(() => import('@/components/blocks/ValuesBlock')),
  teamBlock: dynamic(() => import('@/components/blocks/TeamBlock')),
  statsBlock: dynamic(() => import('@/components/blocks/StatsBlock')),
  logoCloud: dynamic(() => import('@/components/blocks/LogoCloudBlock')),
  ctaBlock: dynamic(() => import('@/components/blocks/CTABlock')),
  navbar: dynamic(() => import('@/components/blocks/NavbarBlock')),
  breadcrumb: dynamic(() => import('@/components/blocks/BreadcrumbBlock')),
  footer: dynamic(() => import('@/components/blocks/FooterBlock')),
  divider: dynamic(() => import('@/components/blocks/DividerBlock')),
  caseStudiesBlock: dynamic(() => import('@/components/blocks/CaseStudiesBlock')),
  faqBlock: dynamic(() => import('@/components/blocks/FaqBlock')),
  heroBlock: dynamic(() => import('@/components/blocks/HomepageHeroBlock')),
  featureGridBlock: dynamic(() => import('@/components/blocks/FeatureGridBlock')),
  testimonialsBlock: dynamic(() => import('@/components/blocks/TestimonialsBlock')),
  pricingPageBlock: dynamic(() => import('@/components/blocks/PricingPageBlock')),
  servicesPageBlock: dynamic(() => import('@/components/blocks/ServicesPageBlock')),
  pricedServicesBlock: dynamic(() => import('@/components/blocks/PricedServicesBlock')),
  testimonialsPageBlock: dynamic(() => import('@/components/blocks/TestimonialsPageBlock')),
  caseStudyDetailBlock: dynamic(() => import('@/components/blocks/CaseStudyDetailBlock')),
  carouselBlock: dynamic(() => import('@/components/blocks/CarouselBlock')),
  reservationBlock: dynamic(() => import('@/components/blocks/ReservationBlock')),
}

export default componentRegistry
