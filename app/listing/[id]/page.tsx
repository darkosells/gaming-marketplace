// app/listing/[id]/page.tsx
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import { siteConfig, generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo-config'
import ListingDetailClient from './ListingDetailClient'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

// Generate dynamic metadata for each listing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
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
        avatar_url,
        average_rating,
        total_reviews
      )
    `)
    .eq('id', id)
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
    ? `${listing.description.slice(0, 150)}${listing.description.length > 150 ? '...' : ''} | Buy for $${listing.price} on Nashflare.`
    : `Buy ${listing.game} ${categoryName.toLowerCase()} for $${listing.price}. Secure transaction with 48-hour buyer protection.`

  const ogImage = listing.image_url || siteConfig.ogImage

  return {
    title,
    description,
    keywords: [
      `buy ${listing.game.toLowerCase()}`,
      `${listing.game.toLowerCase()} ${categoryName.toLowerCase()}`,
      listing.platform ? `${listing.platform.toLowerCase()} ${listing.game.toLowerCase()}` : '',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/listing/${listing.id}`,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: listing.title }],
      locale: siteConfig.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: siteConfig.twitterHandle,
    },
    alternates: {
      canonical: `${siteConfig.url}/listing/${listing.id}`,
    },
  }
}

// Server component that fetches data
export default async function ListingPage({ params }: Props) {
  const { id } = await params
  const supabase = createClient()
  
  // First, try to get the listing with profiles joined
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles (
        id,
        username,
        avatar_url,
        rating,
        average_rating,
        total_sales,
        total_reviews,
        verified,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error || !listing) {
    notFound()
  }

  // If profiles is null (RLS issue or join failed), fetch it separately
  if (!listing.profiles && listing.seller_id) {
    console.log('Profiles was null, fetching separately for seller:', listing.seller_id)
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, rating, average_rating, total_sales, total_reviews, verified, created_at')
      .eq('id', listing.seller_id)
      .single()
    
    if (profileData && !profileError) {
      listing.profiles = profileData
      console.log('Successfully fetched profile separately:', profileData)
    } else {
      console.error('Failed to fetch profile separately:', profileError)
    }
  }

  // Generate structured data schemas
  const productSchema = generateProductSchema({
    id: listing.id,
    title: listing.title,
    description: listing.description || '',
    price: listing.price,
    image_url: listing.image_url || siteConfig.ogImage,
    game: listing.game,
    category: listing.category,
    stock: listing.stock,
    seller: {
      username: listing.profiles?.username || 'Unknown',
      average_rating: listing.profiles?.average_rating || listing.profiles?.rating || 0,
      total_reviews: listing.profiles?.total_reviews || 0,
    }
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Browse', url: `${siteConfig.url}/browse` },
    { name: listing.game, url: `${siteConfig.url}/browse?game=${listing.game}` },
    { name: listing.title, url: `${siteConfig.url}/listing/${listing.id}` },
  ])

  return (
    <>
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
      
      <ListingDetailClient initialListing={listing} listingId={id} />
    </>
  )
}