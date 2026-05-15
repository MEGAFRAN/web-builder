import type { Meta, StoryObj } from '@storybook/react'
import { Carousel } from './Carousel'
import {
  mockCarouselImageItems,
  mockCarouselTestimonialItems,
  mockCarouselCardItems,
} from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Sections/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    mode: { control: 'select', options: ['image', 'testimonial', 'card'] },
    background: { control: 'select', options: ['white', 'gray', 'dark'] },
    transition: { control: 'select', options: ['slide', 'fade'] },
  },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

export const ImageSlide: Story = {
  args: {
    _type: 'carouselBlock',
    title: 'Our gallery',
    items: mockCarouselImageItems,
    mode: 'image',
    showArrows: true,
    showIndicators: true,
    loop: true,
    background: 'white',
  },
}
export const TestimonialSlide: Story = {
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
export const CardSlide: Story = {
  args: {
    _type: 'carouselBlock',
    title: 'Recent work',
    items: mockCarouselCardItems,
    mode: 'card',
    showArrows: true,
    showIndicators: true,
    loop: false,
    background: 'white',
  },
}
export const FadeTransition: Story = {
  args: {
    _type: 'carouselBlock',
    items: mockCarouselImageItems,
    mode: 'image',
    transition: 'fade',
    showArrows: true,
    showIndicators: true,
    loop: true,
    background: 'white',
  },
}
export const AutoPlay: Story = {
  args: {
    _type: 'carouselBlock',
    title: 'Auto-playing carousel',
    items: mockCarouselImageItems,
    mode: 'image',
    autoPlay: true,
    autoPlayInterval: 3000,
    loop: true,
    showArrows: true,
    showIndicators: true,
    background: 'white',
  },
}
