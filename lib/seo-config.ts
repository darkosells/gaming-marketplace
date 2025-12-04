// SEO Configuration for Nashflare Gaming Marketplace
// Location: lib/seo-config.ts

export const siteConfig = {
  name: 'Nashflare',
  description: 'The #1 trusted gaming marketplace for buying and selling gaming accounts, in-game currency, items, and game keys. Secure transactions with buyer protection.',
  url: 'https://nashflare.com',
  ogImage: 'https://nashflare.com/og-image.png',
  twitterHandle: '@NashflareGaming',
  keywords: [
    'gaming marketplace',
    'buy gaming accounts',
    'sell gaming accounts',
    'game keys',
    'in-game currency',
    'Fortnite accounts',
    'Valorant accounts',
    'GTA 5 accounts',
    'Roblox accounts',
    'game top-up',
    'secure gaming trades',
    'buyer protection',
    'verified sellers'
  ],
  author: 'Nashflare',
  locale: 'en_US',
  type: 'website',
}

export const gamesList = [
  'Fortnite',
  'League of Legends',
  'Valorant',
  'Genshin Impact',
  'GTA 5',
  'Clash of Clans',
  'Roblox',
  'Minecraft',
  'CS:GO',
  'Apex Legends',
  'Clash Royale',
  'Steam',
  'Blox Fruits',
  'Adopt Me',
]

export const categoryMap = {
  account: {
    title: 'Gaming Accounts',
    description: 'Buy verified gaming accounts with rare skins, high levels, and achievements',
    emoji: '🎮',
  },
  items: {
    title: 'In-Game Items',
    description: 'Purchase rare in-game items, skins, and collectibles',
    emoji: '🎒',
  },
  currency: {
    title: 'Game Currency',
    description: 'Get instant delivery of in-game currency and credits',
    emoji: '💰',
  },
  key: {
    title: 'Game Keys',
    description: 'Buy activation codes for PC, Xbox, PlayStation, and Nintendo',
    emoji: '🔑',
  },
}

// Helper function to generate page-specific metadata
export function generateMetadata({
  title,
  description,
  path = '',
  image = siteConfig.ogImage,
  noIndex = false,
}: {
  title: string
  description: string
  path?: string
  image?: string
  noIndex?: boolean
}) {
  const url = `${siteConfig.url}${path}`
  
  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: siteConfig.locale,
      type: siteConfig.type,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [image],
      creator: siteConfig.twitterHandle,
    },
  }
}

// JSON-LD Structured Data Generators
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [
      'https://x.com/NashflareGaming',
      'https://discord.gg/caz5gyqUQh',
      'https://www.instagram.com/nashflaregaming/',
      'https://www.tiktok.com/@nashflare',
      'https://www.facebook.com/people/Nashflare/61584340365529/',
      'https://www.reddit.com/r/Nashflare/',
      'https://www.trustpilot.com/review/nashflare.com',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
  }
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/browse?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateProductSchema(listing: {
  id: string
  title: string
  description: string
  price: number
  image_url?: string
  game: string
  category: string
  stock: number
  seller: {
    username: string
    average_rating: number
    total_reviews: number
  }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.image_url || `${siteConfig.url}/placeholder-product.png`,
    url: `${siteConfig.url}/listing/${listing.id}`,
    sku: listing.id,
    category: listing.category,
    brand: {
      '@type': 'Brand',
      name: listing.game,
    },
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: listing.stock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Person',
        name: listing.seller.username,
      },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    aggregateRating: listing.seller.total_reviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: listing.seller.average_rating,
      reviewCount: listing.seller.total_reviews,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`,
    })),
  }
}