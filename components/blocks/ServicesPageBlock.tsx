import type { ServicesPageBlock as ServicesPageBlockType } from '@/types/cms'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Grid } from '@/components/layout/Grid'
import { Stack } from '@/components/layout/Stack'
import { Divider } from '@/components/layout/Divider'
import { Hero } from '@/components/sections/Hero'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { FAQ } from '@/components/sections/FAQ'
import { CTA } from '@/components/sections/CTA'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Badge } from '@/components/content/Badge'
import { Image } from '@/components/content/Image'
import { Card } from '@/components/data/Card'
import { List } from '@/components/data/List'

const defaultFaqItems = [
  {
    question: 'How long does a typical project take?',
    answer:
      'Project timelines vary based on scope and complexity. A focused engagement typically runs 4–8 weeks, while larger, multi-phase projects can span several months. We will give you a realistic timeline during the discovery call.',
  },
  {
    question: 'Do you work with small businesses?',
    answer:
      'Yes. We work with businesses of all sizes — from early-stage startups to established enterprises. Our service packages are designed to scale with your needs and budget.',
  },
  {
    question: 'What does the onboarding process look like?',
    answer:
      'After an initial consultation, we put together a tailored proposal and statement of work. Once agreed, we kick off with a discovery session to align on goals, success criteria, and delivery milestones.',
  },
  {
    question: 'Can I request a custom service package?',
    answer:
      'Absolutely. Our listed services are starting points. We regularly tailor engagements to match specific objectives. Book a consultation and we will scope a package that fits.',
  },
  {
    question: 'How do you handle revisions and feedback?',
    answer:
      'Feedback is built into every project phase. We schedule review checkpoints so you can assess progress and request adjustments before we move forward. Most packages include a defined number of revision rounds.',
  },
  {
    question: 'What happens after the project is delivered?',
    answer:
      'We offer post-delivery support and retainer options for ongoing work. Many clients choose to continue the relationship for maintenance, iteration, and new initiatives.',
  },
]

export default function ServicesPageBlock({
  heroHeading,
  heroText,
  featureCategories,
  serviceCards,
  faqItems,
}: ServicesPageBlockType) {
  const resolvedFaqItems =
    faqItems && faqItems.length > 0 ? faqItems : defaultFaqItems

  // Map featureCategories to the shape FeatureGrid expects
  const featureGridItems = (featureCategories ?? []).map((cat) => ({
    title: cat.title,
    description: cat.summary,
    // FeatureGrid renders `icon` as an emoji/string — we repurpose it to carry
    // the badge label so we can render it inline via the feature grid's icon slot
    icon: cat.categoryBadge ?? null,
  }))

  return (
    <div data-component="services-page-block">
      {/* Breadcrumb */}
      <Section background="white" paddingY="sm">
        <Container maxWidth="2xl" padding="md">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services' },
            ]}
          />
        </Container>
      </Section>

      {/* Hero — reduced height via paddingY sm on wrapping section */}
      <Section background="gray" paddingY="md">
        <Container maxWidth="2xl" padding="md">
          <Hero
            headline={heroHeading ?? 'Our Services'}
            subtext={
              heroText ??
              'We deliver end-to-end solutions tailored to your goals — from strategy and design through to development and ongoing support. Every engagement starts with understanding your problem, not selling you a package.'
            }
            ctaLabel="Talk to Us"
            align="center"
          />
        </Container>
      </Section>

      {/* Feature grid — high-level category overview */}
      {featureGridItems.length > 0 && (
        <Section background="white" paddingY="lg">
          <FeatureGrid
            title="What We Offer"
            subtitle="A clear picture of our service areas — find the right fit at a glance."
            features={featureGridItems}
            cols="3"
          />
        </Section>
      )}

      {/* Divider */}
      <Section background="white" paddingY="none">
        <Container maxWidth="2xl" padding="md">
          <Divider />
        </Container>
      </Section>

      {/* Service Cards */}
      {serviceCards && serviceCards.length > 0 && (
        <Section background="white" paddingY="xl">
          <Container maxWidth="2xl" padding="md">
            <Stack gap="lg">
              <Stack gap="sm" align="center">
                <Heading
                  text="Service Details"
                  level="h2"
                  align="center"
                  color="default"
                />
                <Text
                  content="Explore each offering in depth — including what is included, expected deliverables, and how to get started."
                  size="lg"
                  color="muted"
                  align="center"
                />
              </Stack>
              <Grid cols="3" gap="lg">
                {serviceCards.map((service, i) => (
                  <Card key={i} padding="lg" border>
                    <Stack gap="md">
                      {service.imageUrl && (
                        <Image
                          src={service.imageUrl}
                          alt={service.imageAlt ?? service.title}
                          rounded={false}
                        />
                      )}
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
                      {service.deliverables && service.deliverables.length > 0 && (
                        <Stack gap="sm">
                          <Text
                            content="What is included:"
                            size="sm"
                            color="default"
                            weight="semibold"
                            align="left"
                          />
                          <List items={service.deliverables} size="sm" />
                        </Stack>
                      )}
                      {service.ctaLabel && (
                        <div className="pt-2">
                          <a
                            href={service.ctaHref ?? '/contact'}
                            className="inline-block rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted-bg"
                          >
                            {service.ctaLabel}
                          </a>
                        </div>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Grid>
            </Stack>
          </Container>
        </Section>
      )}

      {/* FAQ */}
      <Section background="gray" paddingY="lg">
        <FAQ title="Common Questions" items={resolvedFaqItems} />
      </Section>

      {/* CTA */}
      <Section background="white" paddingY="xl">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md" align="center">
            <Heading
              text="Not sure which service fits?"
              level="h2"
              align="center"
              color="default"
            />
            <Text
              content="Let's talk — we'll help you find the right solution."
              size="lg"
              color="muted"
              align="center"
            />
            <div className="pt-2">
              <a
                href="/contact"
                className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-fg transition-colors hover:opacity-90"
              >
                Book a Free Consultation
              </a>
            </div>
          </Stack>
        </Container>
      </Section>

    </div>
  )
}
