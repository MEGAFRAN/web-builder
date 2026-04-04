import type { PricingPageBlock as PricingPageBlockType } from '@/types/cms'
import { Navbar } from '@/components/navigation/Navbar'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Footer } from '@/components/navigation/Footer'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Divider } from '@/components/layout/Divider'
import { PricingTable } from '@/components/sections/PricingTable'
import { Testimonials } from '@/components/sections/Testimonials'
import { FAQ } from '@/components/sections/FAQ'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Badge } from '@/components/content/Badge'
import { Alert } from '@/components/content/Alert'

export default function PricingPageBlock({
  tiers,
  promotionBanner,
  testimonials,
  faqItems,
  navbarLogo,
  navbarLinks,
  footerColumns,
  footerCopyright,
}: PricingPageBlockType) {
  // Conditionally show promotion banner only if expiresAt is in the future at build time
  const now = new Date()
  const showBanner =
    promotionBanner != null &&
    promotionBanner.expiresAt != null &&
    new Date(promotionBanner.expiresAt) > now

  // Map tiers to the shape PricingTable expects
  const pricingTiers = (tiers ?? []).map((tier) => ({
    name: tier.name,
    price: `$${tier.price}`,
    period: tier.billingCadence,
    features: tier.features,
    ctaLabel: tier.ctaLabel,
    ctaAction: tier.ctaHref ?? null,
    highlighted: tier.recommended,
  }))

  // Map pricing testimonials to the shape Testimonials expects
  const mappedTestimonials = (testimonials ?? []).map((t) => {
    const roleParts = [t.role, t.company].filter(Boolean)
    return {
      quote: t.quote,
      author: t.name,
      role: roleParts.length > 0 ? roleParts.join(', ') : null,
      avatar: t.avatarUrl ?? null,
    }
  })

  const defaultFaqItems: Array<{ question: string; answer: string }> = [
    {
      question: 'What is included in each plan?',
      answer:
        'Each plan includes a different set of features and usage limits. You can review the full feature list for each tier in the pricing table above.',
    },
    {
      question: 'Can I switch plans after signing up?',
      answer:
        'Yes. You can upgrade or downgrade your plan at any time from your account settings. Changes take effect at the start of your next billing cycle.',
    },
    {
      question: 'What happens when my free trial ends?',
      answer:
        'At the end of the 14-day free trial your account moves to the plan you selected. No charge is made until the trial period ends, and you can cancel before then with no obligation.',
    },
    {
      question: 'Are there discounts for annual billing?',
      answer:
        'Yes. Choosing annual billing saves you up to 20% compared to the monthly rate. The discount is applied automatically when you select an annual plan at checkout.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit and debit cards (Visa, Mastercard, Amex) as well as PayPal. Enterprise customers can request invoice-based billing.',
    },
    {
      question: 'Is there a setup fee?',
      answer:
        'No. There are no setup fees, onboarding fees, or hidden charges. You only pay the advertised plan price.',
    },
    {
      question: 'Do you offer discounts for nonprofits or educational institutions?',
      answer:
        'Yes. We offer special pricing for qualifying nonprofits and educational organisations. Please contact our sales team with proof of eligibility to discuss your options.',
    },
  ]

  const resolvedFaqItems =
    faqItems && faqItems.length > 0 ? faqItems : defaultFaqItems

  return (
    <>
      {/* Navigation */}
      <Navbar
        logo={navbarLogo ?? 'Brand'}
        links={navbarLinks ?? [
          { label: 'Home', href: '/' },
          { label: 'Features', href: '/features' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Contact', href: '/contact' },
        ]}
        ctaLabel="Get started"
      />

      {/* Breadcrumb */}
      <Section background="white" paddingY="sm">
        <Container maxWidth="2xl" padding="md">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Pricing' },
            ]}
          />
        </Container>
      </Section>

      {/* Page header */}
      <Section background="gray" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md" align="center">
            <Badge label="14-Day Free Trial" variant="success" />
            <Heading
              text="Simple, Transparent Pricing"
              level="h1"
              align="center"
              color="default"
            />
            <Text
              content="No hidden fees. No long-term contracts. Cancel any time."
              size="lg"
              color="muted"
              align="center"
            />
          </Stack>
        </Container>
      </Section>

      {/* Promotion banner — only shown when expiresAt is in the future */}
      {showBanner && (
        <Section background="white" paddingY="sm">
          <Container maxWidth="2xl" padding="md">
            <Alert
              message={promotionBanner!.message}
              variant="info"
            />
          </Container>
        </Section>
      )}

      {/* Pricing table */}
      <Section background="white" paddingY="xl">
        <PricingTable tiers={pricingTiers} />
      </Section>

      <Section background="white" paddingY="none">
        <Container maxWidth="2xl" padding="md">
          <Divider />
        </Container>
      </Section>

      {/* Testimonials */}
      {mappedTestimonials.length > 0 && (
        <Testimonials
          title="What clients say about the value"
          testimonials={mappedTestimonials}
        />
      )}

      {/* FAQ */}
      <Section background="white" paddingY="lg">
        <FAQ title="Frequently asked questions" items={resolvedFaqItems} />
      </Section>

      {/* CTA — two-button variant, built from primitives */}
      <Section background="gray" paddingY="xl">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md" align="center">
            <Heading
              text="Still have questions?"
              level="h2"
              align="center"
              color="default"
            />
            <Text
              content="Our team can help you pick the right plan."
              size="lg"
              color="muted"
              align="center"
            />
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href="/contact"
                className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-fg transition-colors hover:opacity-90"
              >
                Talk to Sales
              </a>
              <a
                href="/signup"
                className="rounded-md border border-border bg-background px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted-bg"
              >
                Start Free Trial
              </a>
            </div>
          </Stack>
        </Container>
      </Section>

      {/* Footer */}
      <Footer columns={footerColumns ?? null} copyright={footerCopyright ?? null} />
    </>
  )
}
