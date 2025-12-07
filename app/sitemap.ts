// Sitemap Generator with Game Pages, Blog Posts, and Dynamic Content
// Location: app/sitemap.ts

import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo-config'
import { gamesConfig } from '@/lib/games-config'

// Hardcoded blog posts for sitemap
// TODO: Consider moving to database or CMS for easier management
const blogPosts = [
  {
    slug: 'fortnite-account-safety-guide-2024',
    lastModified: '2024-11-15',
  },
  {
    slug: 'valorant-ranked-guide-climb-to-radiant',
    lastModified: '2024-11-12',
  },
  {
    slug: 'gta-5-modded-accounts-ultimate-buyers-guide',
    lastModified: '2024-11-10',
  },
  {
    slug: 'league-of-legends-smurf-accounts-explained',
    lastModified: '2024-11-08',
  },
  {
    slug: 'roblox-limited-items-investment-guide-2024',
    lastModified: '2024-11-05',
  },
  {
    slug: 'clash-of-clans-base-building-ultimate-guide',
    lastModified: '2024-11-03',
  },
  {
    slug: 'gaming-marketplace-safety-avoiding-scams',
    lastModified: '2024-11-01',
  },
  {
    slug: 'best-gaming-accounts-to-buy-2024',
    lastModified: '2024-10-28',
  },
  // New blog posts added December 2024
  {
    slug: 'how-to-sell-gaming-account-complete-guide',
    lastModified: '2024-12-01',
  },
  {
    slug: 'is-buying-gaming-accounts-legal',
    lastModified: '2024-12-03',
  },
  {
    slug: 'how-much-is-my-fortnite-account-worth',
    lastModified: '2024-12-05',
  },
  {
    slug: 'gta-5-modded-cars-outfits-guide',
    lastModified: '2024-12-06',
  },
]

// Product categories with their slugs
const categories = [
  { slug: 'account', name: 'Gaming Accounts' },
  { slug: 'items', name: 'In-Game Items' },
  { slug: 'currency', name: 'Game Currency' },
  { slug: 'key', name: 'Game Keys' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url
  const now = new Date()

  // ============================================
  // STATIC PAGES (Highest Priority)
  // ============================================
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Legal pages (low priority but important to include)
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // ============================================
  // GAME PAGES (High Priority - Core SEO Pages)
  // ============================================
  const gamePages: MetadataRoute.Sitemap = gamesConfig.map((game) => ({
    url: `${baseUrl}/games/${game.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  // ============================================
  // CATEGORY PAGES (High Priority)
  // ============================================
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/browse?category=${category.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }))

  // NOTE: Category + Game combination pages removed
  // URLs with multiple query parameters (& symbol) can cause XML parsing issues
  // Instead, use dedicated game pages at /games/[slug] which are cleaner for SEO

  // ============================================
  // BLOG PAGES (High Priority for SEO)
  // ============================================
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.lastModified),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // ============================================
  // DYNAMIC DATABASE PAGES
  // ============================================
  let listingPages: MetadataRoute.Sitemap = []
  let profilePages: MetadataRoute.Sitemap = []

  try {
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = createClient()

    // Fetch all active listings (limit to most recent 10,000 for performance)
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, updated_at, game')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (!listingsError && listings) {
      listingPages = listings.map((listing) => ({
        url: `${baseUrl}/listing/${listing.id}`,
        lastModified: new Date(listing.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }

    // Fetch verified vendor profiles (public profiles)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, updated_at, username')
      .eq('role', 'vendor')
      .eq('verified', true)
      .not('username', 'is', null)
      .limit(1000)

    if (!profilesError && profiles) {
      profilePages = profiles.map((profile) => ({
        url: `${baseUrl}/seller/${profile.id}`,
        lastModified: new Date(profile.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))
    }
  } catch (error) {
    // Log error but don't fail sitemap generation
    console.error('Sitemap database query error:', error)
  }

  // ============================================
  // COMBINE ALL PAGES
  // ============================================
  // Order matters for some crawlers - most important pages first
  return [
    ...staticPages,         // Core static pages
    ...gamePages,           // Dedicated game pages (high priority)
    ...categoryPages,       // Category browse pages
    ...blogPages,           // Blog posts (high priority for SEO)
    ...listingPages,        // Individual product listings
    ...profilePages,        // Verified vendor profiles
  ]
}

// ============================================
// SITEMAP INDEX (Optional - for very large sites)
// ============================================
// If your sitemap grows beyond 50,000 URLs or 50MB, you'll need to split it
// into multiple sitemaps with an index. Uncomment and modify if needed:
//
// export async function generateSitemaps() {
//   // Return an array of sitemap IDs
//   return [{ id: 0 }, { id: 1 }, { id: 2 }]
// }
//
// Then modify the main function to accept an id parameter:
// export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap>