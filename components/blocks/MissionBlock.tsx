import type { MissionBlock as MissionBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Image } from '@/components/content/Image'

export default function MissionBlock({
  heading,
  body,
  imageUrl,
  imageAlt,
}: MissionBlockType) {
  return (
    <div data-component="mission-block">
      <Section background="white" paddingY="xl">
        <Container maxWidth="2xl" padding="md">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
            <div className="flex-1">
              <Stack gap="lg">
                <Heading text={heading} level="h1" align="left" color="default" />
                <Text content={body} size="lg" color="muted" align="left" />
              </Stack>
            </div>
            {imageUrl && (
              <div className="flex-1">
                <Image
                  src={imageUrl}
                  alt={imageAlt ?? heading}
                  rounded={false}
                />
              </div>
            )}
          </div>
        </Container>
      </Section>
    </div>
  )
}
