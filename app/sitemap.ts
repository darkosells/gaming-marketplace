// Sitemap Generator with Game Pages and Blog Posts
// Location: app/sitemap.ts

import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo-config'
import { gamesConfig } from '@/lib/games-config'

// Hardcoded blog posts for sitemap
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
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dedicated game pages (HIGH PRIORITY for SEO)
  const gamePages: MetadataRoute.Sitemap = gamesConfig.map((game) => ({
    url: `${baseUrl}/games/${game.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.85,
  }))

  // Blog post pages (HIGH PRIORITY for SEO)
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.lastModified),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Category pages (legacy - can keep for backwards compatibility)
  const categories = ['account', 'items', 'currency', 'key']
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/browse?category=${category}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  // Dynamic pages from database
  let listingPages: MetadataRoute.Sitemap = []
  let profilePages: MetadataRoute.Sitemap = []

  try {
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = createClient()

    // Fetch all active listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, updated_at')
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

    // Fetch verified vendor profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'vendor')
      .eq('verified', true)
      .limit(1000)

    if (!profilesError && profiles) {
      profilePages = profiles.map((profile) => ({
        url: `${baseUrl}/profile/${profile.id}`,
        lastModified: new Date(profile.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))
    }
  } catch (error) {
    console.error('Sitemap database query error:', error)
  }

  return [
    ...staticPages,
    ...gamePages,      // Dedicated game pages (high priority)
    ...blogPages,      // Blog posts (high priority for SEO)
    ...categoryPages,  // Category filter pages
    ...listingPages,   // Individual product listings
    ...profilePages,   // Vendor profiles
  ]
}