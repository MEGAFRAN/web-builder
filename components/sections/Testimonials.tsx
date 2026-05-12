import type { CarouselItem } from '@/types/cms'
import { Carousel } from '@/components/sections/Carousel'

interface Testimonial {
  quote: string
  author: string
  role?: string | null
  company?: string | null
  avatar?: string | null
  stars?: number | null
}

interface TestimonialsProps {
  title?: string | null
  testimonials: Testimonial[]
}

export function Testimonials({ title, testimonials }: TestimonialsProps) {
  const items: CarouselItem[] = testimonials.map((t) => ({
    quote: t.quote,
    author: t.author,
    role: t.role ?? null,
    company: t.company ?? null,
    avatarUrl: t.avatar ?? null,
    stars: t.stars ?? null,
  }))

  return (
    <Carousel
      _type="carouselBlock"
      title={title ?? undefined}
      items={items}
      mode="testimonial"
      showArrows={true}
      showIndicators={true}
      loop={true}
      background="gray"
      paddingY="lg"
    />
  )
}
