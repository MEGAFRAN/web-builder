import type { Block } from '@/types/cms'
import HeroBlock from '@/components/blocks/HeroBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import ContactBlock from '@/components/blocks/ContactBlock'
import BlogListBlock from '@/components/blocks/BlogListBlock'
import MissionBlock from '@/components/blocks/MissionBlock'
import ValuesBlock from '@/components/blocks/ValuesBlock'
import TeamBlock from '@/components/blocks/TeamBlock'
import StatsBlock from '@/components/blocks/StatsBlock'
import LogoCloudBlock from '@/components/blocks/LogoCloudBlock'
import CTABlock from '@/components/blocks/CTABlock'
import NavbarBlock from '@/components/blocks/NavbarBlock'
import BreadcrumbBlock from '@/components/blocks/BreadcrumbBlock'
import FooterBlock from '@/components/blocks/FooterBlock'
import DividerBlock from '@/components/blocks/DividerBlock'
import CaseStudiesBlock from '@/components/blocks/CaseStudiesBlock'
import FaqBlock from '@/components/blocks/FaqBlock'
import ContactInfoBlock from '@/components/blocks/ContactInfoBlock'
import HomepageHeroBlock from '@/components/blocks/HomepageHeroBlock'
import FeatureGridBlock from '@/components/blocks/FeatureGridBlock'
import TestimonialsBlock from '@/components/blocks/TestimonialsBlock'

interface PageRendererProps {
  blocks: Block[]
}

export default function PageRenderer({ blocks }: PageRendererProps) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block._type) {
          case 'hero':
            return <HeroBlock key={i} {...block} />
          case 'services':
            return <ServicesBlock key={i} {...block} />
          case 'contact':
            return <ContactBlock key={i} {...block} />
          case 'contactInfoBlock':
            return <ContactInfoBlock key={i} {...block} />
          case 'blog_list':
            return <BlogListBlock key={i} {...block} />
          case 'missionBlock':
            return <MissionBlock key={i} {...block} />
          case 'valuesBlock':
            return <ValuesBlock key={i} {...block} />
          case 'teamBlock':
            return <TeamBlock key={i} {...block} />
          case 'statsBlock':
            return <StatsBlock key={i} {...block} />
          case 'logoCloud':
            return <LogoCloudBlock key={i} {...block} />
          case 'ctaBlock':
            return <CTABlock key={i} {...block} />
          case 'navbar':
            return <NavbarBlock key={i} {...block} />
          case 'breadcrumb':
            return <BreadcrumbBlock key={i} {...block} />
          case 'footer':
            return <FooterBlock key={i} {...block} />
          case 'divider':
            return <DividerBlock key={i} />
          case 'caseStudiesBlock':
            return <CaseStudiesBlock key={i} {...block} />
          case 'faqBlock':
            return <FaqBlock key={i} {...block} />
          case 'heroBlock':
            return <HomepageHeroBlock key={i} {...block} />
          case 'featureGridBlock':
            return <FeatureGridBlock key={i} {...block} />
          case 'testimonialsBlock':
            return <TestimonialsBlock key={i} {...block} />
          default:
            return null
        }
      })}
    </div>
  )
}
