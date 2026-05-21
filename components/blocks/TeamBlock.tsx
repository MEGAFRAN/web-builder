import type { TeamBlock as TeamBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Heading } from '@/components/content/Heading'
import { Avatar } from '@/components/content/Avatar'
import { Card } from '@/components/data/Card'

export default function TeamBlock({ heading, members }: TeamBlockType) {
  const sorted = [...members].sort((a, b) => a.order - b.order)

  return (
    <div data-component="team-block">
      <Section background="white" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="lg">
            {heading && (
              <Heading text={heading} level="h2" align="center" color="default" />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-stretch">
              {sorted.map((member, i) => (
                <Card key={i} padding="lg">
                  <Stack gap="md" align="start">
                    <Avatar
                      src={member.photoUrl ?? null}
                      name={member.name}
                      size="lg"
                    />
                    <Heading
                      text={member.name}
                      level="h3"
                      align="center"
                      color="default"
                    />
                    <p className="text-sm text-muted">{member.role}</p>
                    <p className="text-sm text-muted">{member.bio}</p>
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
