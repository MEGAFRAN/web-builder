import type { ServicesBlock as ServicesBlockType } from '@/types/cms'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'

export default function ServicesBlock({ items }: ServicesBlockType) {
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <section data-component="services-block">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((service, i) => (
              <article key={i} className="rounded-lg border border-border p-6">
                <Stack gap="sm">
                  {service.icon && <span className="text-3xl">{service.icon}</span>}
                  <h3 className="text-xl font-semibold text-brand">{service.title}</h3>
                  <p className="text-muted">{service.description}</p>
                </Stack>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </Section>
  )
}
