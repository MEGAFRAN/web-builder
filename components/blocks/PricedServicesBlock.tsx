import type {
  PricedServicesBlock as PricedServicesBlockType,
  PricedServiceCardItem,
} from '@/types/cms'
import Link from 'next/link'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Grid } from '@/components/layout/Grid'
import { Stack } from '@/components/layout/Stack'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Card } from '@/components/data/Card'

function resolvePrice(service: PricedServiceCardItem): string | null {
  return service.price ?? service.deliverables?.[0] ?? null
}

export default function PricedServicesBlock({
  heading,
  subtext,
  viewAllLabel,
  viewAllHref,
  serviceCards,
}: PricedServicesBlockType) {
  return (
    <div data-component="priced-services-block">
      <Section background="white" paddingY="xl">
        <Container maxWidth="2xl" padding="md" className="md:max-w-none">
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

            {serviceCards && serviceCards.length > 0 && (
              <Grid cols="3" gap="lg">
                {serviceCards.map((service, index) => {
                  const displayPrice = resolvePrice(service)

                  return (
                    <Card key={index} padding="md" border>
                      <Stack gap="md" className="flex-1">
                        <Heading
                          text={service.title}
                          level="h3"
                          align="left"
                          color="default"
                        />
                        <Text
                          content={service.description}
                          size="base"
                          color="muted"
                          align="left"
                        />
                        {displayPrice && (
                          <span className="text-2xl font-bold text-primary">{displayPrice}</span>
                        )}
                        {service.ctaLabel && (
                          <div className="mt-auto border-t border-border pt-4">
                            <a
                              href={service.ctaHref ?? '/contact'}
                              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:w-auto"
                            >
                              {service.ctaLabel}
                            </a>
                          </div>
                        )}
                      </Stack>
                    </Card>
                  )
                })}
              </Grid>
            )}

            {viewAllLabel && viewAllHref && (
              <div className="flex justify-center pt-2">
                <Link
                  href={viewAllHref}
                  className="text-base font-medium text-primary transition-opacity hover:opacity-80"
                >
                  {viewAllLabel}
                </Link>
              </div>
            )}
          </Stack>
        </Container>
      </Section>
    </div>
  )
}
