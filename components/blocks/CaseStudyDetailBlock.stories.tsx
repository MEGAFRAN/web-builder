import type { Meta, StoryObj } from '@storybook/react'
import CaseStudyDetailBlock from './CaseStudyDetailBlock'

const meta = {
  title: 'Blocks/CaseStudyDetailBlock',
  component: CaseStudyDetailBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CaseStudyDetailBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    _type: 'caseStudyDetailBlock',
    title: 'Redesigning the checkout flow for Acme Corp',
    breadcrumbItems: [{ label: 'Case Studies', href: '/case-studies' }, { label: 'Acme Corp' }],
    challengeBody: 'Acme Corp was losing 60% of customers at checkout. The existing flow had 7 steps, lacked mobile optimization, and offered limited payment options.',
    techStack: [
      { category: 'Frontend', items: ['Next.js', 'Tailwind CSS', 'React'] },
      { category: 'Backend', items: ['Node.js', 'PostgreSQL', 'Stripe'] },
    ],
    solutionItems: [
      { title: 'Streamlined checkout', description: 'Reduced checkout from 7 to 3 steps using progressive disclosure.' },
      { title: 'Mobile-first redesign', description: 'Built mobile-first with large tap targets and thumb-friendly layout.' },
    ],
    ahaBody: 'The biggest insight was that users were abandoning not because of friction, but because of trust. Adding social proof and security badges to the payment step alone reduced drop-off by 18%.',
    impactItems: [
      { label: 'Checkout completion', value: '+40%' },
      { label: 'Mobile conversion', value: '+62%' },
      { label: 'Revenue uplift', value: '$2.4M/yr' },
    ],
    tags: ['E-commerce', 'UX Design', 'Conversion'],
  },
}
