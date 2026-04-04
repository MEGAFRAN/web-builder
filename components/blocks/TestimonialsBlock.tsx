import type { TestimonialsBlock as TestimonialsBlockType } from '@/types/cms'
import { Testimonials } from '@/components/sections/Testimonials'

export default function TestimonialsBlock({
  heading,
  items,
}: TestimonialsBlockType) {
  const testimonials = items.map((item) => {
    const roleParts = [item.role, item.company].filter(Boolean)
    return {
      quote: item.quote,
      author: item.name,
      role: roleParts.length > 0 ? roleParts.join(', ') : null,
      avatar: item.avatarUrl ?? null,
    }
  })

  return <Testimonials title={heading} testimonials={testimonials} />
}
