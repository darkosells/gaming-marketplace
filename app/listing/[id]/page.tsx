// Listing Detail Page with Dynamic SEO Metadata
// Location: app/listing/[id]/page.tsx

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import { siteConfig, generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo-config'
import ListingDetailClient from './ListingDetailClient'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>  // Changed to Promise
}

// Generate dynamic metadata for each listing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params  // Await the params
  const supabase = createClient()
  
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      price,
      game,
      category,
      platform,
      image_url,
      profiles (
        username,
        average_rating,
        total_reviews
      )
    `)
    .eq('id', id)  // Use id directly
    .single()

  if (!listing) {
    return {
      title: 'Listing Not Found',
      description: 'The requested listing could not be found.',
    }
  }

  const categoryNames: { [key: string]: string } = {
    account: 'Gaming Account',
    items: 'In-Game Items',
    currency: 'Game Currency',
    key: 'Game Key',
  }

  const categoryName = categoryNames[listing.category] || listing.category
  const title = `${listing.title} - ${listing.game} ${categoryName}`
  const description = listing.description 
    ? `${listing.description.slice(0, 150)}${listing.description.length > 150 ? '...' : ''} | Buy ${listing.game} ${categoryName.toLowerCase()} for $${listing.price} from verified seller on Nashflare.`
    : `Buy ${listing.game} ${categoryName.toLowerCase()} for $${listing.price}. Secure transaction with 48-hour buyer protection on Nashflare gaming marketplace.`

  const ogImage = listing.image_url || siteConfig.ogImage

  return {
    title,
    description,
    keywords: [
      `buy ${listing.game.toLowerCase()}`,
      `${listing.game.toLowerCase()} ${categoryName.toLowerCase()}`,
      `${listing.game.toLowerCase()} for sale`,
      listing.platform ? `${listing.platform.toLowerCase()} ${listing.game.toLowerCase()}` : '',
      'gaming marketplace',
      'verified seller',
      'buyer protection',
    ].filter(Boolean),
    openGraph: {
      title: `${title} | Nashflare`,
      description,
      url: `${siteConfig.url}/listing/${id}`,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: siteConfig.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Nashflare`,
      description,
      images: [ogImage],
      creator: siteConfig.twitterHandle,
    },
    alternates: {
      canonical: `${siteConfig.url}/listing/${id}`,
    },
    other: {
      'product:price:amount': listing.price.toString(),
      'product:price:currency': 'USD',
    },
  }
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params  // Await the params
  const supabase = createClient()
  
  // Fetch listing data for structured data
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      price,
      game,
      category,
      image_url,
      stock,
      profiles (
        username,
        average_rating,
        total_reviews
      )
    `)
    .eq('id', id)  // Use id directly
    .single()

  if (!listing) {
    notFound()
  }

  // Generate structured data
  const productSchema = generateProductSchema({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    image_url: listing.image_url,
    game: listing.game,
    category: listing.category,
    stock: listing.stock,
    seller: {
      username: (listing.profiles as any).username,
      average_rating: (listing.profiles as any).average_rating || 0,
      total_reviews: (listing.profiles as any).total_reviews || 0,
    },
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Browse', url: '/browse' },
    { name: listing.game, url: `/browse?game=${encodeURIComponent(listing.game)}` },
    { name: listing.title, url: `/listing/${listing.id}` },
  ])

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      
      <ListingDetailClient />
    </>
  )
}