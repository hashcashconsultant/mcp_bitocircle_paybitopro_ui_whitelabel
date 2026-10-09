import { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  noIndex?: boolean
  siteName?: string
  siteUrl?: string
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  noIndex = false,
  siteName = 'My Next.js App',
  siteUrl = 'https://your-domain.com'
}: SEOProps): Metadata {
  const metaTitle = title ? `${title} | ${siteName}` : siteName
  const metaDescription = description || 'A modern Next.js application with TypeScript and Material-UI'
  const metaImage = image || '/og-image.jpg'
  const metaUrl = url ? `${siteUrl}${url}` : siteUrl

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords.join(', '),
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: metaUrl,
      siteName,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
    },
    alternates: {
      canonical: metaUrl,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  }
}

// JSON-LD Schema generators
export const generateOrganizationSchema = (
  name: string,
  url: string,
  logo: string
) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name,
  url,
  logo: {
    '@type': 'ImageObject',
    url: logo,
  },
})

export const generateWebsiteSchema = (name: string, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name,
  url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${url}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
})