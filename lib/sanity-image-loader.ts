import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import type { ImageLoaderProps } from 'next/image'

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = imageUrlBuilder(sanityClient)

export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  return builder.image(src).width(width).quality(quality ?? 75).auto('format').url()
}
