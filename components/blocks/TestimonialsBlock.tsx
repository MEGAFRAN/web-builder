import type { TestimonialsBlock as TestimonialsBlockType } from '@/types/cms'
import { Testimonials } from '@/components/sections/Testimonials'

export default function TestimonialsBlock({
  heading,
  items,
}: TestimonialsBlockType) {
  const testimonials = items.map((item) => ({
    quote: item.quote,
    author: item.name,
    role: item.role ?? null,
    company: item.company ?? null,
    avatar: item.avatarUrl ?? null,
  }))

  return (
    <div data-component="testimonials-block">
      <Testimonials title={heading} testimonials={testimonials} />
    </div>
  )
}
