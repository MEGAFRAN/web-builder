import type { ProductExampleBlock as ProductExampleBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Heading } from '@/components/content/Heading'
import { Image } from '@/components/content/Image'
import { getExternalLinkProps } from '@/lib/link-props'

export default function ProductExampleBlock({
  heading,
  imageUrl,
  imageAlt,
  href,
}: ProductExampleBlockType) {
  const image = (
    <Image src={imageUrl} alt={imageAlt ?? heading} rounded={false} />
  )

  const imageContent = href ? (
    <a href={href} className="block" {...getExternalLinkProps(href)}>
      {image}
    </a>
  ) : (
    image
  )

  return (
    <div data-component="product-example-block">
      <Section background="white" paddingY="xl">
        <Container maxWidth="xl" padding="md">
          <Stack gap="lg">
            <Heading text={heading} level="h2" align="center" color="default" />
            <div className="mx-auto w-full max-w-sm">{imageContent}</div>
          </Stack>
        </Container>
      </Section>
    </div>
  )
}
