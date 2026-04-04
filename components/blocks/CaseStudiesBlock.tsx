import type { CaseStudiesBlock as CaseStudiesBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Grid } from '@/components/layout/Grid'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Image } from '@/components/content/Image'
import { Badge } from '@/components/content/Badge'
import { Card } from '@/components/data/Card'

export default function CaseStudiesBlock({
  heading,
  subtext,
  items,
}: CaseStudiesBlockType) {
  const sorted = [...items].sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0
    if (!a.publishedAt) return 1
    if (!b.publishedAt) return -1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  return (
    <Section background="white" paddingY="lg">
      <Container maxWidth="2xl" padding="md">
        <Stack gap="lg">
          {(heading || subtext) && (
            <Stack gap="sm" align="center">
              {heading && (
                <Heading text={heading} level="h2" align="center" color="default" />
              )}
              {subtext && (
                <Text content={subtext} size="lg" color="muted" align="center" />
              )}
            </Stack>
          )}
          <Grid cols="2" gap="lg">
            {sorted.map((item, i) => (
              <Card key={i} padding="md" border>
                <Stack gap="md">
                  {item.coverImageUrl && (
                    <div className="overflow-hidden rounded-md">
                      <Image
                        src={item.coverImageUrl}
                        alt={`${item.client} case study cover`}
                        rounded={false}
                      />
                    </div>
                  )}
                  <Stack gap="sm">
                    <Badge label={item.industry} variant="default" />
                    <Heading
                      text={item.title}
                      level="h3"
                      align="left"
                      color="default"
                    />
                    <Text
                      content={item.summary}
                      size="base"
                      color="muted"
                      align="left"
                    />
                  </Stack>
                  <a
                    href={`/case-studies/${item.slug}`}
                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-opacity hover:opacity-90 self-start"
                  >
                    Read Case Study
                  </a>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  )
}
