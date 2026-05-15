import React from 'react'
import type { AnchorHTMLAttributes } from 'react'

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

export default function Link({ href, children, ...rest }: LinkProps) {
  return <a href={href} {...rest}>{children}</a>
}
