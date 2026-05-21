import type { ValuesBlock as ValuesBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Heading } from '@/components/content/Heading'
import { Card } from '@/components/data/Card'

export default function ValuesBlock({ heading, items }: ValuesBlockType) {
  return (
    <div data-component="values-block">
      <Section background="gray" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="lg">
            {heading && (
              <Heading text={heading} level="h2" align="center" color="default" />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-stretch">
              {items.map((value, i) => (
                <Card key={i} padding="lg">
                  <Stack gap="md">
                    <div className="flex items-center gap-3">
                      {value.icon && (
                        <span className="text-2xl">{value.icon}</span>
                      )}
                      <Heading
                        text={value.title}
                        level="h3"
                        align="left"
                        color="default"
                      />
                    </div>
                    <p className="text-base text-muted">{value.description}</p>
                  </Stack>
                </Card>
              ))}
            </div>
          </Stack>
        </Container>
      </Section>
    </div>
  )
}
