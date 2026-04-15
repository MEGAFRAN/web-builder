import type { CarouselBlock as CarouselBlockType } from '@/types/cms'
import { Carousel } from '@/components/sections/Carousel'

export default function CarouselBlock(props: CarouselBlockType) {
  return <Carousel {...props} />
}
