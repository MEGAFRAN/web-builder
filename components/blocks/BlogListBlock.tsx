import type { BlogListBlock as BlogListBlockType } from '@/types/cms'

export default function BlogListBlock({ postsPerPage }: BlogListBlockType) {
  return (
    <section className="section">
      <h2 className="text-3xl font-bold text-brand mb-8">Blog</h2>
      <p className="text-muted text-sm">
        Mostrando{' '}
        <span data-testid="posts-per-page">{postsPerPage}</span>{' '}
        entradas por página.
      </p>
      {/* Post grid populated with real CMS data at build time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8" />
    </section>
  )
}
