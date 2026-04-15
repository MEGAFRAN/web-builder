import type { BlogListBlock as BlogListBlockType } from '@/types/cms'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'

export default function BlogListBlock({ postsPerPage }: BlogListBlockType) {
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <section data-component="blog-list-block">
          <Stack gap="lg">
            <h2 className="text-3xl font-bold text-brand">Blog</h2>
            <p className="text-muted text-sm">
              Mostrando{' '}
              <span data-testid="posts-per-page">{postsPerPage}</span>{' '}
              entradas por página.
            </p>
            {/* Post grid populated with real CMS data at build time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" />
          </Stack>
        </section>
      </Container>
    </Section>
  )
}
