import type { ServicesBlock as ServicesBlockType } from '@/types/cms'

export default function ServicesBlock({ items }: ServicesBlockType) {
  return (
    <section data-component="services-block" className="section">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((service, i) => (
          <article key={i} className="rounded-lg border border-border p-6">
            {service.icon && <span className="text-3xl mb-3 block">{service.icon}</span>}
            <h3 className="text-xl font-semibold text-brand mb-2">{service.title}</h3>
            <p className="text-muted">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
