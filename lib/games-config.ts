// Games Configuration for SEO-friendly URLs
// Location: lib/games-config.ts

export interface GameConfig {
  slug: string           // URL-friendly slug
  name: string           // Display name
  icon: string           // Emoji icon
  category: string       // Game genre
  description: string    // SEO description
  seoTitle?: string      // Optional custom SEO title (overrides default)
  keywords: string[]     // Additional keywords
  categories: string[]   // Available product categories for this game
}

export const gamesConfig: GameConfig[] = [
  // MAIN GAMES (8)
  {
    slug: 'fortnite',
    name: 'Fortnite',
    icon: '🎮',
    category: 'Battle Royale',
    seoTitle: 'Fortnite Accounts for Sale - OG Skins, Renegade Raider, Black Knight',
    description: 'Buy Fortnite accounts with Renegade Raider, Black Knight, and rare OG skins. Verified sellers, 5% fees, 48-hour buyer protection. Instant delivery guaranteed.',
    keywords: ['fortnite accounts', 'fortnite skins', 'v-bucks', 'fortnite rare skins', 'og fortnite account', 'renegade raider', 'black knight'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'valorant',
    name: 'Valorant',
    icon: '🎯',
    category: 'FPS',
    seoTitle: 'Valorant Accounts for Sale - Radiant, Immortal, Rare Skins | 48Hr Protection',
    description: 'Purchase Valorant accounts with high ranks (Radiant, Immortal), exclusive skins, and Valorant Points. Trusted marketplace with 48-hour protection and 5% commission.',
    keywords: ['valorant accounts', 'valorant skins', 'valorant points', 'radiant account', 'valorant ranked account', 'immortal account'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'gta-5',
    name: 'GTA 5',
    icon: '🚗',
    category: 'Action',
    seoTitle: 'GTA 5 Modded Accounts - High Level, Money, Unlock All | Safe Trading',
    description: 'Buy GTA 5 modded accounts with high in-game money, unlock all items, rare vehicles, and max stats. Safe transactions and instant delivery. PC, Xbox, PS5 available.',
    keywords: ['gta 5 accounts', 'gta online money', 'gta modded accounts', 'gta 5 pc account', 'gta online account', 'gta 5 modded'],
    categories: ['account', 'currency'],
  },
  {
    slug: 'roblox',
    name: 'Roblox',
    icon: '🎲',
    category: 'Sandbox',
    seoTitle: 'Roblox Accounts for Sale - Robux, Limiteds, Adopt Me Pets | Trusted',
    description: 'Get Roblox accounts with Robux, limited items, and rare Adopt Me pets. Trusted sellers with fast delivery. Blox Fruits, MM2, and more. Secure trading.',
    keywords: ['roblox accounts', 'robux', 'roblox limiteds', 'blox fruits account', 'roblox rare items', 'adopt me pets'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'league-of-legends',
    name: 'League of Legends',
    icon: '⚔️',
    category: 'MOBA',
    seoTitle: 'League of Legends Accounts - Smurf, Ranked, Skins | LoL Marketplace',
    description: 'Buy League of Legends smurf accounts, ranked accounts with rare skins, and Blue Essence. Instant delivery guaranteed. Level 30+, unranked to Challenger available.',
    keywords: ['lol accounts', 'league of legends skins', 'ranked account', 'lol smurf account', 'riot points', 'challenger account'],
    categories: ['account', 'currency', 'items'],
  },
  {
    slug: 'clash-of-clans',
    name: 'Clash of Clans',
    icon: '🏰',
    category: 'Strategy',
    seoTitle: 'Clash of Clans Accounts - TH15, TH16, Max Heroes | CoC Shop',
    description: 'Purchase Clash of Clans accounts with high Town Hall levels (TH15, TH16), maxed troops and heroes, and gems. Secure CoC trading with buyer protection.',
    keywords: ['clash of clans accounts', 'coc accounts', 'th15 account', 'th16 account', 'maxed coc account', 'clash of clans gems'],
    categories: ['account', 'currency'],
  },
  {
    slug: 'clash-royale',
    name: 'Clash Royale',
    icon: '👑',
    category: 'Strategy',
    seoTitle: 'Clash Royale Accounts for Sale - Max Cards, Legendary Decks | Safe',
    description: 'Buy Clash Royale accounts with max level cards, high trophies, and legendary champions. Verified sellers, buyer protection, instant delivery guaranteed.',
    keywords: ['clash royale accounts', 'cr accounts', 'maxed clash royale', 'legendary cards', 'clash royale gems', 'max level cards'],
    categories: ['account', 'currency'],
  },
  {
    slug: 'steam',
    name: 'Steam',
    icon: '🎮',
    category: 'Platform',
    seoTitle: 'Steam Accounts & Game Keys - CS2, Dota 2, Rust | Instant Delivery',
    description: 'Get Steam accounts with premium games and Steam game keys at discounted prices. CS2, Dota 2, Rust, and more. Secure marketplace with buyer protection.',
    keywords: ['steam accounts', 'steam keys', 'steam games', 'steam wallet', 'cheap steam games', 'cs2', 'dota 2', 'rust'],
    categories: ['account', 'key', 'currency'],
  },

  // ROBLOX GAMES (5)
  {
    slug: 'steal-a-brainrot',
    name: 'Steal a Brainrot',
    icon: '🧠',
    category: 'Roblox Game',
    seoTitle: 'Steal a Brainrot Items - Pets, Collectibles | Roblox Game',
    description: 'Buy Steal a Brainrot items, pets, and in-game assets. Rare collectibles available from verified Roblox sellers. Fast and secure delivery.',
    keywords: ['steal a brainrot', 'roblox steal a brainrot', 'brainrot items', 'brainrot pets'],
    categories: ['items'],
  },
  {
    slug: 'grow-a-garden',
    name: 'Grow a Garden',
    icon: '🌱',
    category: 'Roblox Game',
    seoTitle: 'Grow a Garden Items - Seeds, Rare Plants | Roblox Trading',
    description: 'Purchase Grow a Garden items, seeds, and rare plants. Fast delivery from trusted Roblox sellers. Build your perfect garden today.',
    keywords: ['grow a garden', 'roblox grow a garden', 'garden items', 'rare seeds'],
    categories: ['items'],
  },
  {
    slug: 'adopt-me',
    name: 'Adopt me',
    icon: '🐾',
    category: 'Roblox Game',
    seoTitle: 'Adopt Me Pets for Sale - Shadow Dragon, Neon Pets | Roblox Trading',
    description: 'Buy Adopt Me pets including Shadow Dragon, Bat Dragon, neon legendaries, and rare mega neon pets. Trusted Roblox marketplace for safe pet trading.',
    keywords: ['adopt me pets', 'adopt me neon', 'adopt me legendary', 'roblox adopt me', 'shadow dragon', 'bat dragon'],
    categories: ['items', 'account'],
  },
  {
    slug: 'blox-fruits',
    name: 'Blox Fruits',
    icon: '🍎',
    category: 'Roblox Game',
    seoTitle: 'Blox Fruits Accounts & Items - Rare Fruits, Game Passes | Roblox',
    description: 'Get Blox Fruits items, accounts with rare devil fruits, and permanent game passes. Dough, Leopard, Dragon fruits available. Instant delivery.',
    keywords: ['blox fruits', 'blox fruits account', 'roblox blox fruits', 'rare fruits', 'dough fruit', 'leopard fruit'],
    categories: ['items', 'account'],
  },
  {
    slug: 'plants-vs-brainrots',
    name: 'Plants vs Brainrots',
    icon: '🌻',
    category: 'Roblox Game',
    seoTitle: 'Plants vs Brainrots Items - Game Assets | Roblox Marketplace',
    description: 'Purchase Plants vs Brainrots items and in-game assets. Secure transactions with buyer protection. Rare items from verified sellers.',
    keywords: ['plants vs brainrots', 'roblox plants vs brainrots', 'pvb items', 'pvb collectibles'],
    categories: ['items'],
  },

  // GAME KEYS & PLATFORMS (2)
  {
    slug: 'playstation',
    name: 'Playstation',
    icon: '🎮',
    category: 'Platform',
    seoTitle: 'PlayStation Game Keys - PSN Codes, PS Plus | Discounted Prices',
    description: 'Buy PlayStation game keys, PSN gift cards, and PS Plus subscriptions at discounted prices. Instant digital delivery for PS4 and PS5 games.',
    keywords: ['playstation keys', 'psn codes', 'ps5 games', 'ps plus', 'playstation gift card', 'ps4 games'],
    categories: ['key'],
  },
  {
    slug: 'xbox',
    name: 'Xbox',
    icon: '🟢',
    category: 'Platform',
    seoTitle: 'Xbox Game Keys - Game Pass Ultimate, Gift Cards | Instant Codes',
    description: 'Purchase Xbox game keys, Game Pass Ultimate codes, and Xbox gift cards. Instant delivery for Xbox Series X/S and Xbox One. Discounted prices.',
    keywords: ['xbox keys', 'xbox game pass', 'xbox gift card', 'xbox series x games', 'game pass ultimate'],
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