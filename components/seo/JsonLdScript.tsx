/**
 * JsonLdScript — server component.
 *
 * Renders a <script type="application/ld+json"> tag that is inlined into the
 * page's <head> at static generation time. No client-side JavaScript is needed.
 *
 * Usage:
 *   <JsonLdScript schema={buildJsonLd(config, page)} />
 */

import type { JsonLdSchema } from '@/lib/json-ld'

interface JsonLdScriptProps {
  schema: JsonLdSchema
}

export function JsonLdScript({ schema }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
