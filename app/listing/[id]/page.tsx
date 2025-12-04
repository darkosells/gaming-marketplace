// app/listing/[id]/page.tsx
// Enhanced with Product JSON-LD Schema for Google Rich Snippets

import { createClient } from '@/lib/supabase-server'
import ListingDetailClient from './ListingDetailClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

// Site configuration
const siteConfig = {
  name: 'Nashflare',
  url: 'https://nashflare.com',
  ogImage: 'https://nashflare.com/og-image.png',
  twitterHandle: '@nashflare',
  locale: 'en_US',
}

// Category labels for SEO
const categoryLabels: { [key: string]: string } = {
  'account': 'Gaming Account',
  'items': 'In-Game Items',
  'currency': 'Game Currency',
  'key': 'Game Key',
}

// Generate dynamic metadata for each listing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch listing data for metadata (including additional fields for SEO)
  const { data: listing } = await supabase
    .from('listings')
    .select('title, description, game, category, price, image_url, image_urls, stock, status')
    .eq('id', id)
    .single()

  // Fallback metadata for not found listings
  if (!listing) {
    return {
      title: 'Listing Not Found | Nashflare',
      description: 'This listing could not be found on Nashflare gaming marketplace.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  // Get the best available image (prioritize image_urls array, then image_url, then fallback)
  const listingImage = listing.image_urls?.[0] || listing.image_url || siteConfig.ogImage
  
  // Generate SEO-optimized description
  const metaDescription = listing.description?.substring(0, 155) 
    || `Buy ${listing.title} for ${listing.game} on Nashflare. Price: $${listing.price}. Secure payment with buyer protection.`

  // Category label for keywords
  const categoryLabel = categoryLabels[listing.category] || 'Gaming Product'

  // Determine if listing should be indexed
  const shouldIndex = listing.status === 'active' && listing.stock > 0

  return {
    title: `${listing.title} - ${listing.game} | Nashflare`,
    description: metaDescription,
    keywords: [
      listing.game,
      listing.title,
      categoryLabel,
      `buy ${listing.game} ${listing.category}`,
      `${listing.game} for sale`,
      'gaming marketplace',
      'buy game accounts',
      'nashflare',
    ],
    openGraph: {
      type: 'website',
      title: `${listing.title} - ${listing.game}`,
      description: metaDescription,
      url: `${siteConfig.url}/listing/${id}`,
      siteName: siteConfig.name,
      images: [
        {
          url: listingImage,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
      locale: siteConfig.locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title} - ${listing.game}`,
      description: metaDescription,
      images: [listingImage],
      creator: siteConfig.twitterHandle,
    },
    alternates: {
      canonical: `${siteConfig.url}/listing/${id}`,
    },
    // Don't index out of stock or inactive listings
    robots: {
      index: shouldIndex,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}

// Helper function to generate Product JSON-LD schema
function generateProductSchema(listing: any, listingId: string) {
  const listingImage = listing.image_urls?.[0] || listing.image_url || siteConfig.ogImage
  
  // Determine availability based on stock and status
  let availability = 'https://schema.org/InStock'
  if (listing.status !== 'active') {
    availability = 'https://schema.org/Discontinued'
  } else if (listing.stock <= 0) {
    availability = 'https://schema.org/OutOfStock'
  }

  // Build the base product schema
  const productSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': listing.title,
    'description': listing.description || `${listing.title} for ${listing.game}`,
    'image': listingImage,
    'url': `${siteConfig.url}/listing/${listingId}`,
    'brand': {
      '@type': 'Brand',
      'name': listing.game,
    },
    'category': categoryLabels[listing.category] || 'Gaming Product',
    'offers': {
      '@type': 'Offer',
      'url': `${siteConfig.url}/listing/${listingId}`,
      'priceCurrency': 'USD',
      'price': listing.price,
      'availability': availability,
      'itemCondition': 'https://schema.org/NewCondition',
      'seller': {
        '@type': 'Organization',
        'name': listing.profiles?.username || 'Nashflare Seller',
      },
      // Price valid for 30 days
      'priceValidUntil': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  }

  // Add aggregate rating if seller has reviews
  if (listing.profiles?.average_rating > 0 && listing.profiles?.total_reviews > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': listing.profiles.average_rating.toFixed(1),
      'reviewCount': listing.profiles.total_reviews,
      'bestRating': '5',
      'worstRating': '1',
    }
  }

  return productSchema
}

// Helper function to generate Breadcrumb JSON-LD schema
function generateBreadcrumbSchema(listing: any, listingId: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': siteConfig.url,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Browse',
        'item': `${siteConfig.url}/browse`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': listing.game,
        'item': `${siteConfig.url}/browse?game=${encodeURIComponent(listing.game)}`,
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': listing.title,
        'item': `${siteConfig.url}/listing/${listingId}`,
      },
    ],
  }
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch listing WITHOUT status/stock filters to determine unavailability reason
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
        created_at,
        vendor_rank
      )
    `)
    .eq('id', id)
    .single()

  // If listing doesn't exist at all, show not found (no schema needed)
  if (error || !listing) {
    return (
      <ListingDetailClient 
        initialListing={null} 
        listingId={id}
        unavailableReason="not_found"
      />
    )
  }

  // Generate JSON-LD schemas for all existing listings (even unavailable ones)
  // This helps Google understand the page structure
  const productSchema = generateProductSchema(listing, id)
  const breadcrumbSchema = generateBreadcrumbSchema(listing, id)

  // Check if listing was soft-deleted
  if (listing.deleted_at) {
    return (
      <>
        {/* Include schemas even for deleted listings so Google can update its index */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <ListingDetailClient 
          initialListing={listing} 
          listingId={id}
          unavailableReason="deleted"
        />
      </>
    )
  }

  // Check if listing is inactive/paused
  if (listing.status !== 'active') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <ListingDetailClient 
          initialListing={listing} 
          listingId={id}
          unavailableReason="inactive"
        />
      </>
    )
  }

  // Check if listing is out of stock
  if (listing.stock <= 0) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <ListingDetailClient 
          initialListing={listing} 
          listingId={id}
          unavailableReason="out_of_stock"
        />
      </>
    )
  }

  // Listing is available!
  return (
    <>
      {/* Product Schema - enables rich snippets in Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {/* Breadcrumb Schema - shows navigation path in search results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ListingDetailClient 
        initialListing={listing} 
        listingId={id}
        unavailableReason={null}
      />
    </>
  )
}