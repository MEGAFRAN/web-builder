import type { Meta, StoryObj } from '@storybook/react'
import { Testimonials } from './Testimonials'

const meta = {
  title: 'Sections/Testimonials',
  component: Testimonials,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Testimonials>

export default meta
type Story = StoryObj<typeof meta>

const testimonials = [
  { quote: 'Outstanding service. Exceeded all expectations.', author: 'Maria Garcia', role: 'CEO', company: 'Acme Corp', stars: 5 },
  { quote: 'Changed our business completely. The results speak for themselves.', author: 'John Smith', stars: 4 },
  { quote: 'The attention to detail and responsiveness was remarkable.', author: 'Ana Martínez', role: 'Head of Design', company: 'Innovate Inc.', stars: 5 },
]

export const WithTitle: Story = {
  args: { title: 'What our clients say', testimonials },
}
export const NoTitle: Story = {
  args: { testimonials },
}
export const SingleTestimonial: Story = {
  args: { title: 'Client spotlight', testimonials: testimonials.slice(0, 1) },
}
