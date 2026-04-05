import type { TestimonialsPageBlock as TestimonialsPageBlockType } from '@/types/cms'
import { getClientConfig } from '@/lib/client-config'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Grid } from '@/components/layout/Grid'
import { Stack } from '@/components/layout/Stack'
import { Divider } from '@/components/layout/Divider'
import { StatsBar } from '@/components/sections/StatsBar'
import { LogoCloud } from '@/components/sections/LogoCloud'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Avatar } from '@/components/content/Avatar'
import { Badge } from '@/components/content/Badge'
import { Alert } from '@/components/content/Alert'
import { Card } from '@/components/data/Card'

const defaultStats = [
  { value: '120+', label: 'Reviews' },
  { value: '4.9 / 5', label: 'Average Rating' },
  { value: '100%', label: 'Would Recommend' },
]

export default function TestimonialsPageBlock({
  stats,
  featuredTestimonials,
  allTestimonials,
  logoCloudLogos,
}: TestimonialsPageBlockType) {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const externalReviewUrl = config.externalReviewUrl
  const externalReviewPlatform = config.externalReviewPlatform

  const resolvedStats = stats && stats.length > 0 ? stats : defaultStats
  const featured = featuredTestimonials ?? []
  const extended = allTestimonials ?? []

  return (
    <>
      {/* Breadcrumb */}
      <Section background="white" paddingY="sm">
        <Container maxWidth="2xl" padding="md">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Testimonials' },
            ]}
          />
        </Container>
      </Section>

      {/* Page Header */}
      <Section background="gray" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md" align="center">
            <Heading
              text="What Our Clients Say"
              level="h1"
              align="center"
              color="default"
            />
            <Text
              content="Real feedback from real clients — unedited and unfiltered."
              size="lg"
              color="muted"
              align="center"
            />
          </Stack>
        </Container>
      </Section>

      {/* StatsBar */}
      <StatsBar stats={resolvedStats} background="white" />

      {/* Featured Testimonials */}
      {featured.length > 0 && (
        <Section background="dark" paddingY="xl">
          <Container maxWidth="2xl" padding="md">
            <Stack gap="lg">
              <Heading
                text="Featured Reviews"
                level="h2"
                align="center"
                color="white"
              />
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((t, i) => (
                  <div
                    key={i}
                    className="card-overlay p-8"
                  >
                    <p className="mb-6 text-lg leading-relaxed text-primary-fg">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={t.authorPhotoUrl ?? null}
                        name={t.authorName}
                        size="md"
                      />
                      <div className="flex flex-col gap-1">
                        <Heading
                          text={t.authorName}
                          level="h4"
                          align="left"
                          color="white"
                        />
                        {(t.authorRole || t.authorCompany) && (
                          <Badge
                            label={
                              [t.authorRole, t.authorCompany]
                                .filter(Boolean)
                                .join(', ')
                            }
                            variant="default"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Stack>
          </Container>
        </Section>
      )}

      {/* Divider */}
      <Section background="white" paddingY="none">
        <Container maxWidth="2xl" padding="md">
          <Divider />
        </Container>
      </Section>

      {/* Extended Testimonials Grid */}
      {extended.length > 0 && (
        <Section background="white" paddingY="xl">
          <Container maxWidth="2xl" padding="md">
            <Stack gap="lg">
              <Stack gap="sm" align="center">
                <Heading
                  text="More Client Feedback"
                  level="h2"
                  align="center"
                  color="default"
                />
                <Text
                  content="A broader look at what clients across industries have to say."
                  size="lg"
                  color="muted"
                  align="center"
                />
              </Stack>
              <Grid cols="3" gap="lg">
                {extended.map((t, i) => (
                  <Card key={i} padding="md" border>
                    <Stack gap="md">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={t.authorPhotoUrl ?? null}
                          name={t.authorName}
                          size="sm"
                        />
                        <div className="flex flex-col gap-1">
                          <Heading
                            text={t.authorName}
                            level="h4"
                            align="left"
                            color="default"
                          />
                          {(t.authorRole || t.authorCompany) && (
                            <Badge
                              label={
                                [t.authorRole, t.authorCompany]
                                  .filter(Boolean)
                                  .join(', ')
                              }
                              variant="default"
                            />
                          )}
                        </div>
                      </div>
                      <Text
                        content={`"${t.quote}"`}
                        size="sm"
                        color="muted"
                        align="left"
                      />
                    </Stack>
                  </Card>
                ))}
              </Grid>
            </Stack>
          </Container>
        </Section>
      )}

      {/* External Review Alert — only shown when client config includes externalReviewUrl */}
      {externalReviewUrl && externalReviewPlatform && (
        <Section background="white" paddingY="sm">
          <Container maxWidth="2xl" padding="md">
            <Alert variant="info">
              Verified reviews from{' '}
              <a
                href={externalReviewUrl}
                className="font-semibold underline hover:opacity-80"
              >
                {externalReviewPlatform}
              </a>
            </Alert>
          </Container>
        </Section>
      )}

      {/* LogoCloud — "Clients Who Trust Us" */}
      {logoCloudLogos && logoCloudLogos.length > 0 && (
        <Section background="gray" paddingY="lg">
          <LogoCloud title="Clients Who Trust Us" logos={logoCloudLogos} />
        </Section>
      )}

      {/* CTA */}
      <Section background="white" paddingY="xl">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md" align="center">
            <Heading
              text="Convinced? Let's talk."
              level="h2"
              align="center"
              color="default"
            />
            <Text
              content="Join the growing list of clients who have transformed their business with us."
              size="lg"
              color="muted"
              align="center"
            />
            <div className="pt-2">
              <a
                href="/contact"
                className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-fg transition-colors hover:opacity-90"
              >
                Contact Us Today
              </a>
            </div>
          </Stack>
        </Container>
      </Section>

    </>
  )
}
