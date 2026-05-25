'use client'

import ReactDOM from 'react-dom'

interface HeroImagePreloadProps {
  href: string
}

export function HeroImagePreload({ href }: HeroImagePreloadProps) {
  ReactDOM.preload(href, { as: 'image', fetchPriority: 'high' })
  return null
}
