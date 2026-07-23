import type { ServicesPageBlock as ServicesPageBlockType } from '@/types/cms'
import Link from 'next/link'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Grid } from '@/components/layout/Grid'
import { Stack } from '@/components/layout/Stack'
import { Divider } from '@/components/layout/Divider'
import { Hero } from '@/components/sections/Hero'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { FAQ } from '@/components/sections/FAQ'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
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
  breadcrumbHomeLabel,
  breadcrumbPageLabel,
  heroCtaLabel,
  heroCtaHref,
  heroBackgroundImageUrl,
  featureGridTitle,
  featureGridSubtitle,
  serviceDetailsHeading,
  serviceDetailsSubtext,
  deliverablesLabel,
  faqTitle,
  bottomCtaHeading,
  bottomCtaSubtext,
  bottomCtaLabel,
  bottomCtaHref,
}: ServicesPageBlockType) {
  const resolvedFaqItems =
    faqItems && faqItems.length > 0 ? faqItems : defaultFaqItems

  const resolvedBreadcrumbHomeLabel = breadcrumbHomeLabel ?? 'Home'
  const resolvedBreadcrumbPageLabel = breadcrumbPageLabel ?? 'Services'
  const resolvedFeatureGridTitle = featureGridTitle ?? 'What We Offer'
  const resolvedFeatureGridSubtitle =
    featureGridSubtitle ??
    'A clear picture of our service areas — find the right fit at a glance.'
  const resolvedServiceDetailsHeading = serviceDetailsHeading ?? 'Service Details'
  const resolvedServiceDetailsSubtext =
    serviceDetailsSubtext ??
    'Explore each offering in depth — including what is included, expected deliverables, and how to get started.'
  const resolvedDeliverablesLabel = deliverablesLabel ?? 'What is included:'
  const resolvedFaqTitle = faqTitle ?? 'Common Questions'
  const resolvedBottomCtaHeading = bottomCtaHeading ?? 'Not sure which service fits?'
  const resolvedBottomCtaSubtext =
    bottomCtaSubtext ?? "Let's talk — we'll help you find the right solution."
  const resolvedBottomCtaLabel = bottomCtaLabel ?? 'Book a Free Consultation'
  const resolvedBottomCtaHref = bottomCtaHref ?? '/contact'

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
              { label: resolvedBreadcrumbHomeLabel, href: '/' },
              { label: resolvedBreadcrumbPageLabel },
            ]}
          />
        </Container>
      </Section>

      {/* Hero — reduced height via paddingY sm on wrapping section */}
      {heroBackgroundImageUrl ? (
        <Hero
          headline={heroHeading ?? 'Our Services'}
          subtext={
            heroText ??
            'We deliver end-to-end solutions tailored to your goals — from strategy and design through to development and ongoing support. Every engagement starts with understanding your problem, not selling you a package.'
          }
          ctaLabel={heroCtaLabel}
          ctaAction={heroCtaHref}
          align="center"
          backgroundImageUrl={heroBackgroundImageUrl}
        />
      ) : (
        <Section background="gray" paddingY="md">
          <Container maxWidth="2xl" padding="md">
            <Hero
              headline={heroHeading ?? 'Our Services'}
              subtext={
                heroText ??
                'We deliver end-to-end solutions tailored to your goals — from strategy and design through to development and ongoing support. Every engagement starts with understanding your problem, not selling you a package.'
              }
              ctaLabel={heroCtaLabel}
              ctaAction={heroCtaHref}
              align="center"
            />
          </Container>
        </Section>
      )}

      {/* Feature grid — high-level category overview */}
      {featureGridItems.length > 0 && (
        <Section background="white" paddingY="lg">
          <FeatureGrid
            title={resolvedFeatureGridTitle}
            subtitle={resolvedFeatureGridSubtitle}
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
          <Container maxWidth="2xl" padding="md" className="md:max-w-none">
            <Stack gap="lg">
              <Stack gap="sm" align="center">
                <Heading
                  text={resolvedServiceDetailsHeading}
                  level="h2"
                  align="center"
                  color="default"
                />
                <Text
                  content={resolvedServiceDetailsSubtext}
                  size="lg"
                  color="muted"
                  align="center"
                />
              </Stack>
              <Grid cols="3" gap="lg">
                {serviceCards.map((service, i) => (
                  <Card key={i} padding="lg" border>
                    <Stack gap="md" className="flex-1">
                      {service.imageUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border shadow-sm">
                          <Image
                            src={service.imageUrl}
                            alt={service.imageAlt ?? service.title}
                            fill
                            objectFit="cover"
                            loading="lazy"
                          />
                        </div>
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
                            content={resolvedDeliverablesLabel}
                            size="sm"
                            color="default"
                            weight="semibold"
                            align="left"
                          />
                          <List items={service.deliverables} size="sm" />
                        </Stack>
                      )}
                      {service.ctaLabel && (
                        <div className="mt-auto self-end pt-2">
                          <a
                            href={service.ctaHref ?? '/contact'}
                            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
        <FAQ title={resolvedFaqTitle} items={resolvedFaqItems} />
      </Section>

      {/* CTA */}
      <Section background="white" paddingY="xl">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md" align="center">
            <Heading
              text={resolvedBottomCtaHeading}
              level="h2"
              align="center"
              color="default"
            />
            <Text
              content={resolvedBottomCtaSubtext}
              size="lg"
              color="muted"
              align="center"
            />
            <div className="pt-2">
              <Link
                href={resolvedBottomCtaHref}
                className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-fg transition-colors hover:opacity-90"
              >
                {resolvedBottomCtaLabel}
              </Link>
            </div>
          </Stack>
        </Container>
      </Section>

    </div>
  )
}
