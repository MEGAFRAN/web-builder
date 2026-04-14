import type { CaseStudyDetailBlock as CaseStudyDetailBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Divider } from '@/components/layout/Divider'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Badge } from '@/components/content/Badge'

export default function CaseStudyDetailBlock({
  title,
  breadcrumbItems,
  challengeHeading,
  challengeBody,
  techStackHeading,
  techStack,
  solutionHeading,
  solutionItems,
  ahaHeading,
  ahaBody,
  impactHeading,
  impactItems,
  tags,
}: CaseStudyDetailBlockType) {
  return (
    <div data-component="case-study-detail-block">
      {/* Breadcrumb */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <div className="bg-background border-b border-border py-3">
          <Container maxWidth="2xl" padding="md">
            <Breadcrumb items={breadcrumbItems} />
          </Container>
        </div>
      )}

      {/* Page title */}
      <Section background="gray" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md">
            <Heading text={title} level="h1" align="left" color="default" />
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <Badge key={i} label={tag} variant="default" />
                ))}
              </div>
            )}
          </Stack>
        </Container>
      </Section>

      {/* The Challenge */}
      <Section background="white" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md">
            <Heading
              text={challengeHeading ?? 'The Challenge'}
              level="h2"
              align="left"
              color="default"
            />
            <Text content={challengeBody} size="lg" color="muted" align="left" />
          </Stack>
        </Container>
      </Section>

      <Section background="white" paddingY="none">
        <Container maxWidth="2xl" padding="md">
          <Divider />
        </Container>
      </Section>

      {/* The Tech Stack */}
      <Section background="white" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="lg">
            <Heading
              text={techStackHeading ?? 'The Tech Stack'}
              level="h2"
              align="left"
              color="default"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {techStack.map((category, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-muted-bg p-5"
                >
                  <Stack gap="sm">
                    <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {category.category}
                    </p>
                    <p className="text-base text-muted">
                      {category.items.join(', ')}
                    </p>
                  </Stack>
                </div>
              ))}
            </div>
          </Stack>
        </Container>
      </Section>

      <Section background="white" paddingY="none">
        <Container maxWidth="2xl" padding="md">
          <Divider />
        </Container>
      </Section>

      {/* The Solution */}
      <Section background="white" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="lg">
            <Heading
              text={solutionHeading ?? 'The Solution'}
              level="h2"
              align="left"
              color="default"
            />
            <Stack gap="md">
              {solutionItems.map((item, i) => (
                <div key={i} className="rounded-lg border border-border bg-background p-6">
                  <Stack gap="sm">
                    <p className="text-base font-semibold text-foreground">
                      {item.title}
                    </p>
                    <Text content={item.description} size="base" color="muted" align="left" />
                  </Stack>
                </div>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Section>

      <Section background="white" paddingY="none">
        <Container maxWidth="2xl" padding="md">
          <Divider />
        </Container>
      </Section>

      {/* The "Aha!" Moment */}
      <Section background="gray" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="md">
            <Heading
              text={ahaHeading ?? 'The "Aha!" Moment'}
              level="h2"
              align="left"
              color="default"
            />
            <Text content={ahaBody} size="lg" color="muted" align="left" />
          </Stack>
        </Container>
      </Section>

      {/* The Business Impact */}
      <Section background="white" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="lg">
            <Heading
              text={impactHeading ?? 'The Business Impact'}
              level="h2"
              align="left"
              color="default"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {impactItems.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-background p-6"
                >
                  <Stack gap="sm">
                    <p className="text-2xl font-bold text-primary">{item.value}</p>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                  </Stack>
                </div>
              ))}
            </div>
          </Stack>
        </Container>
      </Section>

      {/* Back link */}
      <Section background="gray" paddingY="md">
        <Container maxWidth="2xl" padding="md">
          <a
            href="/success-cases"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">&larr;</span> Back to Success Cases
          </a>
        </Container>
      </Section>
    </div>
  )
}
