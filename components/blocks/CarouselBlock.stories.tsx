import type { Meta, StoryObj } from '@storybook/react'
import CarouselBlock from './CarouselBlock'
import {
  mockCarouselImageItems,
  mockCarouselTestimonialItems,
  mockCarouselCardItems,
} from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/CarouselBlock',
  component: CarouselBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CarouselBlock>

export default meta
type Story = StoryObj<typeof meta>

export const ImageMode: Story = {
  args: {
    _type: 'carouselBlock',
    title: 'Our gallery',
    items: mockCarouselImageItems,
    mode: 'image',
    showArrows: true,
    showIndicators: true,
    loop: true,
  },
}
export const TestimonialMode: Story = {
  args: {
    _type: 'carouselBlock',
    title: 'What our clients say',
    items: mockCarouselTestimonialItems,
    mode: 'testimonial',
    showArrows: true,
    showIndicators: true,
    loop: true,
    background: 'gray',
  },
}
export const CardMode: Story = {
  args: {
    _type: 'carouselBlock',
    title: 'Recent work',
    items: mockCarouselCardItems,
    mode: 'card',
    showArrows: true,
    showIndicators: true,
  },
}
