import type { HeroBlock as HeroBlockType } from '@/types/cms'

export default function HeroBlock({ title, subtitle, cta }: HeroBlockType) {
  return (
    <section data-component="hero-block" className="section text-center">
      <h1 className="text-4xl font-bold text-brand mb-4">{title}</h1>
      {subtitle && (
        <p data-testid="hero-subtitle" className="text-xl text-muted mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      {cta && (
        <a href={cta.href} className="btn-primary inline-block">
          {cta.label}
        </a>
      )}
    </section>
  )
}
