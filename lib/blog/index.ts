// Main blog exports
export * from './types'
export * from './posts'

import { BlogPost, BlogPostMeta } from './types'
import { blogPostsMeta, getPostBySlug as getMetaBySlug } from './posts'

// Dynamic content loader - imports content only when needed
const contentLoaders: Record<string, () => Promise<{ content: string }>> = {
  'fortnite-account-safety-guide-2024': () => import('./content/fortnite-account-safety-guide-2024'),
  'valorant-ranked-guide-climb-to-radiant': () => import('./content/valorant-ranked-guide-climb-to-radiant'),
  'gta-5-modded-accounts-ultimate-buyers-guide': () => import('./content/gta-5-modded-accounts-ultimate-buyers-guide'),
  'league-of-legends-smurf-accounts-explained': () => import('./content/league-of-legends-smurf-accounts-explained'),
  'roblox-limited-items-investment-guide-2024': () => import('./content/roblox-limited-items-investment-guide-2024'),
  'clash-of-clans-base-building-ultimate-guide': () => import('./content/clash-of-clans-base-building-ultimate-guide'),
  'gaming-marketplace-safety-avoiding-scams': () => import('./content/gaming-marketplace-safety-avoiding-scams'),
  'best-gaming-accounts-to-buy-2024': () => import('./content/best-gaming-accounts-to-buy-2024'),
}

/**
 * Get full blog post with content (async - use in pages)
 * This only loads the content for the specific post, not all content
 */
export async function getFullPost(slug: string): Promise<BlogPost | null> {
  const meta = getMetaBySlug(slug)
  if (!meta) return null

  const loader = contentLoaders[slug]
  if (!loader) return null

  try {
    const { content } = await loader()
    return {
      ...meta,
      content,
    }
  } catch (error) {
    console.error(`Failed to load content for ${slug}:`, error)
    return null
  }
}

/**
 * Get all post slugs (for static generation)
 */
export function getAllPostSlugs(): string[] {
  return Object.keys(contentLoaders)
}

/**
 * Get all metadata (for listings - no content loaded)
 */
export function getAllPostsMeta(): BlogPostMeta[] {
  return blogPostsMeta
}