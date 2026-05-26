/** Resolve tenant id for client-side booking blocks (props → public build env → server build env). */
export function resolveBuildClientId(explicit?: string | null): string | null {
  return (
    explicit?.trim() ||
    process.env.NEXT_PUBLIC_CLIENT_ID?.trim() ||
    process.env.CLIENT_ID?.trim() ||
    null
  )
}
