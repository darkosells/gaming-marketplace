// Blog post metadata (used for listings, no content)
export interface BlogPostMeta {
  slug: string
  title: string
  excerpt: string
  category: string
  game: string
  author: string
  date: string
  readTime: string
  image: string
  tags: string[]
  relevantCategories?: string[] // For internal linking to game pages
}

// Full blog post (includes content)
export interface BlogPost extends BlogPostMeta {
  content: string
}

// Game slug mapping for internal links
export const gameSlugMap: Record<string, string> = {
  'Fortnite': 'fortnite',
  'Valorant': 'valorant',
  'GTA 5': 'gta-5',
  'League of Legends': 'league-of-legends',
  'Roblox': 'roblox',
  'Clash of Clans': 'clash-of-clans',
  'Clash Royale': 'clash-royale',
  'Steam': 'steam',
  'General': '', // No specific game page
}

// Category info for browse links
export const categoryInfo: Record<string, { label: string; emoji: string }> = {
  'account': { label: 'Accounts', emoji: '🎮' },
  'items': { label: 'Items', emoji: '🎒' },
  'currency': { label: 'Currency', emoji: '💰' },
  'key': { label: 'Game Keys', emoji: '🔑' },
}