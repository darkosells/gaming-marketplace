// app/listing/[id]/page.tsx
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ListingDetailClient from './ListingDetailClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch listing without filters for metadata
  const { data: listing } = await supabase
    .from('listings')
    .select('title, description, game, price, image_url')
    .eq('id', id)
    .single()

  if (!listing) {
    return {
      title: 'Listing Not Found | Nashflare',
      description: 'This listing could not be found on Nashflare gaming marketplace.'
    }
  }

  return {
    title: `${listing.title} - ${listing.game} | Nashflare`,
    description: listing.description?.substring(0, 160) || `Buy ${listing.title} for ${listing.game} on Nashflare. Price: $${listing.price}`,
    openGraph: {
      title: `${listing.title} - ${listing.game}`,
      description: listing.description?.substring(0, 160) || `Buy ${listing.title} for ${listing.game}`,
      images: listing.image_url ? [listing.image_url] : [],
    },
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

  // If listing doesn't exist at all, show not found
  if (error || !listing) {
    // Pass null listing with 'not_found' reason
    return (
      <ListingDetailClient 
        initialListing={null} 
        listingId={id}
        unavailableReason="not_found"
      />
    )
  }

  // Check if listing was soft-deleted (if you have this field)
  if (listing.deleted_at) {
    return (
      <ListingDetailClient 
        initialListing={listing} 
        listingId={id}
        unavailableReason="deleted"
      />
    )
  }

  // Check if listing is inactive/paused
  if (listing.status !== 'active') {
    return (
      <ListingDetailClient 
        initialListing={listing} 
        listingId={id}
        unavailableReason="inactive"
      />
    )
  }

  // Check if listing is out of stock
  if (listing.stock <= 0) {
    return (
      <ListingDetailClient 
        initialListing={listing} 
        listingId={id}
        unavailableReason="out_of_stock"
      />
    )
  }

  // Listing is available!
  return (
    <ListingDetailClient 
      initialListing={listing} 
      listingId={id}
      unavailableReason={null}
    />
  )
}