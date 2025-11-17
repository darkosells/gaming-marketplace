// Dynamic Game Page with SEO Metadata
// Location: app/games/[slug]/page.tsx

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { siteConfig } from '@/lib/seo-config'
import { getGameBySlug, getAllGameSlugs } from '@/lib/games-config'
import GamePageClient from './GamePageClient'

interface Props {
  params: Promise<{ slug: string }>
}

// Generate static paths for all games (optional but good for performance)
export async function generateStaticParams() {
  const slugs = getAllGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Generate dynamic metadata for each game
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const game = getGameBySlug(slug)

  if (!game) {
    return {
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
    }
  }

  const title = `Buy ${game.name} Accounts, Items & Currency`
  const description = game.description

  return {
    title,
    description,
    keywords: [
      ...game.keywords,
      `buy ${game.name.toLowerCase()}`,
      `${game.name.toLowerCase()} marketplace`,
      `${game.name.toLowerCase()} trading`,
      'gaming marketplace',
      'verified sellers',
      'buyer protection',
    ],
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `${siteConfig.url}/games/${slug}`,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${game.name} Marketplace - ${siteConfig.name}`,
        },
      ],
      locale: siteConfig.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [siteConfig.ogImage],
      creator: siteConfig.twitterHandle,
    },
    alternates: {
      canonical: `${siteConfig.url}/games/${slug}`,
    },
  }
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params
  const game = getGameBySlug(slug)

  if (!game) {
    notFound()
  }

  // Generate breadcrumb structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Games',
        item: `${siteConfig.url}/games`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: game.name,
        item: `${siteConfig.url}/games/${slug}`,
      },
    ],
  }

  // Generate collection page schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${game.name} Marketplace`,
    description: game.description,
    url: `${siteConfig.url}/games/${slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      
      <GamePageClient slug={slug} />
    </>
  )
}