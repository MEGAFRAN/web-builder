import type { HeroBlock as HeroBlockType } from '@/types/cms'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'

export default function HeroBlock({ title, subtitle, cta }: HeroBlockType) {
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <div data-component="hero-block" className="text-center">
          <Stack gap="md" align="center">
            <h1 className="text-4xl font-bold text-brand">{title}</h1>
            {subtitle && (
              <p data-testid="hero-subtitle" className="text-xl text-muted max-w-2xl">
                {subtitle}
              </p>
            )}
            {cta && (
              <a href={cta.href} className="btn-primary inline-block">
                {cta.label}
              </a>
            )}
          </Stack>
        </div>
      </Container>
    </Section>
  )
}
