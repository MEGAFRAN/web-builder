import type { TeamBlock as TeamBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Grid } from '@/components/layout/Grid'
import { Heading } from '@/components/content/Heading'
import { Avatar } from '@/components/content/Avatar'
import { Badge } from '@/components/content/Badge'
import { Card } from '@/components/data/Card'

export default function TeamBlock({ heading, members }: TeamBlockType) {
  const sorted = [...members].sort((a, b) => a.order - b.order)

  return (
    <Section background="white" paddingY="lg">
      <Container maxWidth="2xl" padding="md">
        <Stack gap="lg">
          {heading && (
            <Heading text={heading} level="h2" align="center" color="default" />
          )}
          <Grid cols="3" gap="lg">
            {sorted.map((member, i) => (
              <Card key={i} padding="lg" border>
                <Stack gap="md" align="center">
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
                  <Badge label={member.role} variant="default" />
                  <p className="text-sm text-muted text-center">{member.bio}</p>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  )
}
