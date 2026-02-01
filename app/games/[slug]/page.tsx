// Dynamic Game Page with SEO Metadata
// Location: app/games/[slug]/page.tsx

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { siteConfig } from '@/lib/seo-config'
import { getGameBySlug, getAllGameSlugs } from '@/lib/games-config'
import { getSEOContentBySlug } from '@/lib/seo-content-config'
import GamePageClient from './GamePageClient'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Generate static paths for all games (optional but good for performance)
export async function generateStaticParams() {
  const slugs = getAllGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Category-specific SEO title templates
function getCategoryTitle(gameName: string, category: string, customSeoTitle?: string): string {
  // If there's a custom SEO title and no category filter, use it
  if (!category && customSeoTitle) {
    return customSeoTitle
  }

  // Category-specific titles
  switch (category) {
    case 'account':
      return customSeoTitle || `${gameName} Accounts for Sale - Buy Verified ${gameName} Accounts`
    case 'items':
      return `${gameName} Items for Sale - Buy In-Game Items & Collectibles`
    case 'currency':
      return `${gameName} Currency - Buy In-Game Money & Credits | Instant Delivery`
    case 'key':
      return `${gameName} Game Keys - Steam Keys & Activation Codes for Sale`
    default:
      // No category filter - show general marketplace
      return `${gameName} Marketplace - Accounts, Items, Currency & Keys | Nashflare`
  }
}

// Category-specific SEO descriptions
function getCategoryDescription(gameName: string, category: string, defaultDescription: string): string {
  switch (category) {
    case 'account':
      return `Buy verified ${gameName} accounts with 48-hour buyer protection. Browse accounts from trusted sellers with secure payments and instant delivery.`
    case 'items':
      return `Shop ${gameName} in-game items and collectibles. Find rare items, skins, and exclusive content from verified sellers with buyer protection.`
    case 'currency':
      return `Buy ${gameName} in-game currency with instant delivery. Safe and secure transactions with 48-hour buyer protection on all orders.`
    case 'key':
      return `Purchase ${gameName} game keys and activation codes. Instant delivery of Steam keys and CD keys from verified sellers.`
    default:
      return defaultDescription
  }
}

// Generate dynamic metadata for each game with category support
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const game = getGameBySlug(slug)

  if (!game) {
    return {
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
    }
  }

  // Get category from query params
  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : ''
  
  // Generate category-specific title and description
  const title = getCategoryTitle(game.name, category, game.seoTitle)
  const description = getCategoryDescription(game.name, category, game.description)

  // Build canonical URL (include category in canonical if present)
  const canonicalUrl = category 
    ? `${siteConfig.url}/games/${slug}?category=${category}`
    : `${siteConfig.url}/games/${slug}`

  return {
    title,
    description,
    keywords: [
      ...game.keywords,
      `buy ${game.name.toLowerCase()}`,
      `${game.name.toLowerCase()} marketplace`,
      `${game.name.toLowerCase()} trading`,
      ...(category === 'account' ? [`${game.name.toLowerCase()} accounts for sale`, `buy ${game.name.toLowerCase()} account`] : []),
      ...(category === 'items' ? [`${game.name.toLowerCase()} items for sale`, `buy ${game.name.toLowerCase()} items`] : []),
      ...(category === 'currency' ? [`${game.name.toLowerCase()} currency`, `buy ${game.name.toLowerCase()} money`] : []),
      ...(category === 'key' ? [`${game.name.toLowerCase()} keys`, `${game.name.toLowerCase()} steam key`] : []),
      'gaming marketplace',
      'verified sellers',
      'buyer protection',
    ],
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: canonicalUrl,
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
      canonical: canonicalUrl,
    },
  }
}

// Loading component for Suspense fallback
function GamePageLoading() {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading...</p>
        </div>
      </div>
    </div>
  )
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params
  const game = getGameBySlug(slug)

  if (!game) {
    notFound()
  }

  // Get SEO content for FAQ schema
  const seoContent = getSEOContentBySlug(slug)

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

  // Generate FAQ schema if FAQs exist for this game
  const faqSchema = seoContent && seoContent.faqs && seoContent.faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: seoContent.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null

  return (
    <>
      {/* Breadcrumb Schema - shows navigation path in search results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {/* Collection Page Schema - tells Google this is a category/collection page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      {/* FAQ Schema - enables FAQ rich snippets in Google Search */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}
      
      <Suspense fallback={<GamePageLoading />}>
        <GamePageClient slug={slug} />
      </Suspense>
    </>
  )
}