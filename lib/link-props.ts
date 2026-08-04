export function isExternalHttpHref(href: string): boolean {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//')
  )
}

export function getExternalLinkProps(
  href: string,
): { target: '_blank'; rel: 'noopener noreferrer' } | Record<string, never> {
  return isExternalHttpHref(href)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}
}
