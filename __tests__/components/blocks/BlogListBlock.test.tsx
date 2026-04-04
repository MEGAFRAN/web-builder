import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BlogListBlock from '@/components/blocks/BlogListBlock'

describe('BlogListBlock', () => {
  it('renders the blog list section heading', () => {
    render(<BlogListBlock _type="blog_list" postsPerPage={6} />)
    expect(screen.getByRole('heading', { name: /blog/i })).toBeInTheDocument()
  })

  it('displays the postsPerPage configuration', () => {
    render(<BlogListBlock _type="blog_list" postsPerPage={3} />)
    expect(screen.getByTestId('posts-per-page')).toHaveTextContent('3')
  })
})
