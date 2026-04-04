import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import type { Block } from '@/types/cms'

type SanityPageSlug = { slug: { current: string } }
type SanityPage = { slug: { current: string }; blocks: Block[] }

/**
 * GROQ projection for a single block in the `blocks[]` array.
 *
 * Each block is spread with `...` so all scalar fields are included.
 * Reference arrays (teamBlock.members, valuesBlock.items, logoCloud.logos)
 * are projected explicitly so Sanity dereferences the linked documents
 * and resolves image asset URLs.
 */
const BLOCK_PROJECTION = `
  _type,
  ...,
  _type == "teamBlock" => {
    heading,
    "members": members[]->{
      name,
      role,
      bio,
      "photoUrl": photo.asset->url,
      order
    }
  },
  _type == "valuesBlock" => {
    heading,
    "items": items[]{
      title,
      description,
      icon
    }
  },
  _type == "missionBlock" => {
    heading,
    body,
    "imageUrl": image.asset->url,
    imageAlt
  },
  _type == "logoCloud" => {
    title,
    context,
    "logos": logos[]{
      "src": asset->url,
      alt,
      name
    }
  },
  _type == "statsBlock" => {
    background,
    "stats": stats[]{
      value,
      label
    }
  },
  _type == "navbar" => {
    logo,
    ctaLabel,
    ctaAction,
    "links": links[]{
      label,
      href
    }
  },
  _type == "footer" => {
    copyright,
    "columns": columns[]{
      title,
      "links": links[]{
        label,
        href
      }
    }
  },
  _type == "breadcrumb" => {
    "items": items[]{
      label,
      href
    }
  },
  _type == "caseStudiesBlock" => {
    heading,
    subtext,
    "items": items[]->{
      title,
      client,
      industry,
      summary,
      "coverImageUrl": coverImage.asset->url,
      "slug": slug.current,
      publishedAt
    }
  },
  _type == "faqBlock" => {
    title,
    context,
    "items": items[]{
      question,
      answer
    }
  },
  _type == "contactInfoBlock" => {
    email,
    phone,
    address,
    fallbackEmail
  },
  _type == "heroBlock" => {
    heading,
    subtext,
    primaryButtonLabel,
    primaryButtonHref,
    secondaryButtonLabel,
    secondaryButtonHref,
    "backgroundImageUrl": backgroundImage.asset->url
  },
  _type == "featureGridBlock" => {
    heading,
    "items": items[]{
      heading,
      description,
      "iconUrl": icon.asset->url
    }
  },
  _type == "testimonialsBlock" => {
    heading,
    "items": items[]{
      name,
      company,
      role,
      quote,
      "avatarUrl": avatar.asset->url
    }
  },
  _type == "servicesPageBlock" => {
    heroHeading,
    heroText,
    "featureCategories": featureCategories[]{
      title,
      summary,
      categoryBadge
    },
    "serviceCards": serviceCards[]{
      title,
      description,
      deliverables,
      "imageUrl": image.asset->url,
      imageAlt,
      ctaLabel,
      ctaHref,
      "slug": slug.current
    },
    "faqItems": faqItems[]{
      question,
      answer
    },
    navbarLogo,
    "navbarLinks": navbarLinks[]{
      label,
      href
    },
    "footerColumns": footerColumns[]{
      title,
      "links": links[]{
        label,
        href
      }
    },
    footerCopyright
  },
  _type == "testimonialsPageBlock" => {
    "stats": stats[]{
      value,
      label
    },
    "featuredTestimonials": *[_type == "testimonial" && featured == true] | order(publishedAt desc) {
      authorName,
      authorRole,
      authorCompany,
      "authorPhotoUrl": authorPhoto.asset->url,
      quote,
      featured,
      publishedAt
    },
    "allTestimonials": *[_type == "testimonial" && featured != true] | order(publishedAt desc) {
      authorName,
      authorRole,
      authorCompany,
      "authorPhotoUrl": authorPhoto.asset->url,
      quote,
      featured,
      publishedAt
    },
    "logoCloudLogos": *[_type == "logoCloud" && context == "testimonials"][0].logos[]{
      "src": asset->url,
      alt,
      name
    },
    navbarLogo,
    "navbarLinks": navbarLinks[]{
      label,
      href
    },
    "footerColumns": footerColumns[]{
      title,
      "links": links[]{
        label,
        href
      }
    },
    footerCopyright
  },
  _type == "pricingPageBlock" => {
    "tiers": *[_type == "pricingTier"] | order(price asc) {
      name,
      price,
      billingCadence,
      features,
      recommended,
      ctaLabel,
      "ctaHref": ctaHref
    },
    "promotionBanner": *[_type == "promotionBanner"][0]{
      message,
      expiresAt
    },
    "testimonials": *[_type == "testimonial" && "pricing" in tags && "value" in tags]{
      name,
      company,
      role,
      quote,
      "avatarUrl": avatar.asset->url
    },
    "faqItems": faqItems[]{
      question,
      answer
    },
    navbarLogo,
    "navbarLinks": navbarLinks[]{
      label,
      href
    },
    "footerColumns": footerColumns[]{
      title,
      "links": links[]{
        label,
        href
      }
    },
    footerCopyright
  }
`

export function createCMSClient(projectId: string, dataset: string) {
  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: true,
  })

  const builder = createImageUrlBuilder(client)

  return {
    async getPages(): Promise<{ slug: string }[]> {
      const pages: SanityPageSlug[] = await client.fetch(`*[_type == "page"]{ slug }`)
      return pages.map((p) => ({ slug: p.slug.current }))
    },

    async getPage(slug: string): Promise<SanityPage | null> {
      return client.fetch(
        `*[_type == "page" && slug.current == $slug][0]{
          slug,
          blocks[]{
            ${BLOCK_PROJECTION}
          }
        }`,
        { slug }
      )
    },

    imageUrl(source: string) {
      return builder.image(source)
    },
  }
}
