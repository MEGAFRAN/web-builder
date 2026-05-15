import type { Meta, StoryObj } from '@storybook/react'
import TestimonialsBlock from './TestimonialsBlock'
import { mockTestimonials } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/TestimonialsBlock',
  component: TestimonialsBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TestimonialsBlock>

export default meta
type Story = StoryObj<typeof meta>

export const WithHeading: Story = {
  args: { _type: 'testimonialsBlock', heading: 'What our clients say', items: mockTestimonials },
}
export const NoHeading: Story = {
  args: { _type: 'testimonialsBlock', items: mockTestimonials },
}
