import type { Meta, StoryObj } from '@storybook/react'
import TestimonialsPageBlock from './TestimonialsPageBlock'
import { mockStats, mockLogos } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/TestimonialsPageBlock',
  component: TestimonialsPageBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TestimonialsPageBlock>

export default meta
type Story = StoryObj<typeof meta>

const testimonials = [
  { authorName: 'Maria Garcia', authorRole: 'CEO', authorCompany: 'Acme Corp', quote: 'Outstanding results. Highly recommended.', featured: true },
  { authorName: 'John Smith', quote: 'Changed our business completely.', featured: false },
  { authorName: 'Ana Martínez', authorRole: 'Head of Design', authorCompany: 'Innovate Inc.', quote: 'Exceeded all expectations.', featured: true },
]

export const Default: Story = {
  args: {
    _type: 'testimonialsPageBlock',
    stats: mockStats,
    featuredTestimonials: testimonials.filter((t) => t.featured),
    allTestimonials: testimonials,
    logoCloudLogos: mockLogos,
  },
}
