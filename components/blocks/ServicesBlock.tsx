import type { ServicesBlock as ServicesBlockType } from '@/types/cms'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Image } from '@/components/content/Image'

export default function ServicesBlock({ heading, items }: ServicesBlockType) {
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <section data-component="services-block">
          <div className="flex flex-col gap-8">
            {heading != null && heading !== '' && (
              <h2 className="text-center text-3xl font-bold text-foreground">{heading}</h2>
            )}
            {items.map((service, i) => (
              <article key={i} className="overflow-hidden rounded-lg border border-border">
                {service.imageUrl && (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={service.imageUrl}
                      alt={service.imageAlt ?? service.title}
                      fill
                      objectFit="cover"
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                )}
                <div className="p-6">
                  <Stack gap="sm">
                    <h3 className="text-xl font-semibold text-brand">{service.title}</h3>
                    <p className="text-muted">{service.description}</p>
                    {service.price != null && service.price !== '' && (
                      <p className="text-base font-medium text-foreground">{service.price}</p>
                    )}
                    {service.subItems != null &&
                      service.subItems.length > 0 && (
                        <ul
                          className="flex flex-col gap-1.5 border-t border-border pt-3 text-muted"
                          role="list"
                        >
                          {service.subItems.map((line, j) => (
                            <li key={j} className="flex gap-2 text-left text-sm">
                              <span className="select-none text-brand" aria-hidden>
                                •
                              </span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                  </Stack>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </Section>
  )
}
