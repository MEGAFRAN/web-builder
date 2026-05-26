// React 19 / @types/react ≥19 defines `inert` as `boolean | undefined`.
// Earlier versions omit it entirely. This declaration safely adds the attribute
// if it is not already present — it is a no-op when the type ships natively.
import 'react'

declare module 'react' {
  // Generic parameter required to match HTMLAttributes; not referenced in augmentation.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    inert?: '' | undefined
  }
}
