// Games Configuration for SEO-friendly URLs
// Location: lib/games-config.ts

export interface GameConfig {
  slug: string           // URL-friendly slug
  name: string           // Display name
  icon: string           // Emoji icon
  category: string       // Game genre
  description: string    // SEO description
  keywords: string[]     // Additional keywords
  categories: string[]   // Available product categories for this game
}

export const gamesConfig: GameConfig[] = [
  {
    slug: 'fortnite',
    name: 'Fortnite',
    icon: '🎮',
    category: 'Battle Royale',
    description: 'Buy Fortnite accounts with rare skins, high levels, V-Bucks, and exclusive items. Verified sellers with instant delivery.',
    keywords: ['fortnite accounts', 'fortnite skins', 'v-bucks', 'fortnite rare skins', 'og fortnite account'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'valorant',
    name: 'Valorant',
    icon: '🎯',
    category: 'FPS',
    description: 'Purchase Valorant accounts with rare skins, high ranks, and Valorant Points. Secure transactions with buyer protection.',
    keywords: ['valorant accounts', 'valorant skins', 'valorant points', 'radiant account', 'valorant ranked account'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'gta-5',
    name: 'GTA 5',
    icon: '🚗',
    category: 'Action',
    description: 'Buy GTA 5 modded accounts with high levels, money, and rare vehicles. Safe and instant delivery.',
    keywords: ['gta 5 accounts', 'gta online money', 'gta modded accounts', 'gta 5 pc account', 'gta online account'],
    categories: ['account', 'currency'],
  },
  {
    slug: 'roblox',
    name: 'Roblox',
    icon: '🎲',
    category: 'Sandbox',
    description: 'Get Roblox accounts with Robux, limited items, and rare collectibles. Trusted sellers with fast delivery.',
    keywords: ['roblox accounts', 'robux', 'roblox limiteds', 'blox fruits account', 'roblox rare items'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'league-of-legends',
    name: 'League of Legends',
    icon: '⚔️',
    category: 'MOBA',
    description: 'Buy League of Legends accounts with rare skins, high ranks, and Blue Essence. Instant delivery guaranteed.',
    keywords: ['lol accounts', 'league of legends skins', 'ranked account', 'lol smurf account', 'riot points'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'clash-of-clans',
    name: 'Clash of Clans',
    icon: '🏰',
    category: 'Strategy',
    description: 'Purchase Clash of Clans accounts with high Town Hall levels, maxed troops, and gems. Secure trading.',
    keywords: ['clash of clans accounts', 'coc accounts', 'th15 account', 'maxed coc account', 'clash of clans gems'],
    categories: ['account', 'currency'],
  },
  {
    slug: 'clash-royale',
    name: 'Clash Royale',
    icon: '👑',
    category: 'Strategy',
    description: 'Buy Clash Royale accounts with maxed cards, high trophies, and legendary cards. Fast and secure.',
    keywords: ['clash royale accounts', 'cr accounts', 'maxed clash royale', 'legendary cards', 'clash royale gems'],
    categories: ['account', 'currency'],
  },
  {
    slug: 'minecraft',
    name: 'Minecraft',
    icon: '⛏️',
    category: 'Sandbox',
    description: 'Get Minecraft accounts with capes, rare usernames, and Java/Bedrock access. Verified sellers only.',
    keywords: ['minecraft accounts', 'minecraft java', 'minecraft bedrock', 'minecraft cape', 'minecraft username'],
    categories: ['account', 'key'],
  },
  {
    slug: 'csgo',
    name: 'CS:GO',
    icon: '🔫',
    category: 'FPS',
    description: 'Buy CS:GO accounts with rare skins, high ranks, and Prime status. Secure marketplace with buyer protection.',
    keywords: ['csgo accounts', 'cs2 accounts', 'csgo skins', 'prime account', 'csgo ranked account'],
    categories: ['account', 'items', 'key'],
  },
  {
    slug: 'apex-legends',
    name: 'Apex Legends',
    icon: '🏆',
    category: 'Battle Royale',
    description: 'Purchase Apex Legends accounts with heirloom shards, rare skins, and high ranks. Instant delivery.',
    keywords: ['apex legends accounts', 'apex heirloom', 'apex coins', 'apex ranked account', 'apex skins'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'genshin-impact',
    name: 'Genshin Impact',
    icon: '🗡️',
    category: 'RPG',
    description: 'Buy Genshin Impact accounts with 5-star characters, primogems, and high AR levels. Safe transactions.',
    keywords: ['genshin accounts', 'genshin impact account', 'primogems', '5 star characters', 'genshin ar55'],
    categories: ['account', 'currency'],
  },
  {
    slug: 'steam',
    name: 'Steam',
    icon: '🎮',
    category: 'Platform',
    description: 'Get Steam accounts and game keys at discounted prices. Verified sellers with instant key delivery.',
    keywords: ['steam accounts', 'steam keys', 'steam games', 'steam wallet', 'cheap steam games'],
    categories: ['account', 'key', 'currency'],
  },
  {
  slug: 'steal-a-brainrot',
  name: 'Steal a Brainrot',
  icon: '🧠',
  category: 'Roblox Game',
  description: 'Buy Steal a Brainrot items, pets, and in-game assets. Rare collectibles available from verified sellers.',
  keywords: ['steal a brainrot', 'roblox steal a brainrot', 'brainrot items'],
  categories: ['items'],
},
{
  slug: 'grow-a-garden',
  name: 'Grow a Garden',
  icon: '🌱',
  category: 'Roblox Game',
  description: 'Purchase Grow a Garden items, seeds, and rare plants. Fast delivery from trusted sellers.',
  keywords: ['grow a garden', 'roblox grow a garden', 'garden items'],
  categories: ['items'],
},
{
  slug: 'adopt-me',
  name: 'Adopt me',
  icon: '🐾',
  category: 'Roblox Game',
  description: 'Buy Adopt Me pets, neon legendaries, and rare items. Trusted marketplace for pet trading.',
  keywords: ['adopt me pets', 'adopt me neon', 'adopt me legendary', 'roblox adopt me'],
  categories: ['items', 'account'],
},
{
  slug: 'blox-fruits',
  name: 'Blox Fruits',
  icon: '🍎',
  category: 'Roblox Game',
  description: 'Get Blox Fruits items, accounts with rare fruits, and game passes. Instant delivery available.',
  keywords: ['blox fruits', 'blox fruits account', 'roblox blox fruits', 'rare fruits'],
  categories: ['items', 'account'],
},
{
  slug: 'plants-vs-brainrots',
  name: 'Plants vs Brainrots',
  icon: '🌻',
  category: 'Roblox Game',
  description: 'Purchase Plants vs Brainrots items and in-game assets. Secure transactions with buyer protection.',
  keywords: ['plants vs brainrots', 'roblox plants vs brainrots', 'pvb items'],
  categories: ['items'],
},

// Game Keys Category
{
  slug: 'playstation',
  name: 'Playstation',
  icon: '🎮',
  category: 'Platform',
  description: 'Buy PlayStation game keys, PSN gift cards, and PS Plus subscriptions at discounted prices.',
  keywords: ['playstation keys', 'psn codes', 'ps5 games', 'ps plus', 'playstation gift card'],
  categories: ['key'],
},
{
  slug: 'xbox',
  name: 'Xbox',
  icon: '🟢',
  category: 'Platform',
  description: 'Purchase Xbox game keys, Game Pass Ultimate codes, and Xbox gift cards. Instant delivery.',
  keywords: ['xbox keys', 'xbox game pass', 'xbox gift card', 'xbox series x games'],
  categories: ['key'],
},
]

// Helper functions
export function getGameBySlug(slug: string): GameConfig | undefined {
  return gamesConfig.find((game) => game.slug === slug)
}

export function getGameByName(name: string): GameConfig | undefined {
  return gamesConfig.find((game) => game.name === name)
}

export function getAllGameSlugs(): string[] {
  return gamesConfig.map((game) => game.slug)
}

export function slugToGameName(slug: string): string {
  const game = getGameBySlug(slug)
  return game ? game.name : slug
}

export function gameNameToSlug(name: string): string {
  const game = getGameByName(name)
  return game ? game.slug : name.toLowerCase().replace(/\s+/g, '-')
}