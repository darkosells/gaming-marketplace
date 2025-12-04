import { Metadata } from 'next'
import HomePageClient from './HomePageClient'

// SEO Metadata for Homepage - Optimized lengths for search display
export const metadata: Metadata = {
  // Title: 59 characters (under 60 for full display)
  title: 'Nashflare - Buy & Sell Gaming Accounts, V-Bucks & Game Keys',
  // Description: 158 characters (under 160 for full display)
  description: 'Buy and sell gaming accounts, V-Bucks, Robux, and game keys. Secure marketplace with buyer protection and instant delivery. Fortnite, GTA 5, Valorant & more.',
  keywords: [
    'gaming marketplace',
    'buy gaming accounts',
    'sell gaming accounts',
    'fortnite accounts',
    'gta 5 accounts',
    'valorant accounts',
    'roblox accounts',
    'v-bucks',
    'robux',
    'game keys',
    'steam keys',
    'playstation keys',
    'xbox keys',
    'in-game currency',
    'gaming items',
    'secure gaming marketplace',
    'buy game accounts',
    'sell game accounts',
    'fortnite account shop',
    'valorant account shop',
    'gta modded accounts',
    'roblox limiteds',
    'clash of clans accounts',
    'league of legends accounts'
  ],
  authors: [{ name: 'Nashflare' }],
  creator: 'Nashflare',
  publisher: 'Nashflare',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nashflare.com',
    siteName: 'Nashflare',
    title: 'Nashflare - Buy & Sell Gaming Accounts, V-Bucks & Game Keys',
    description: 'Buy and sell gaming accounts, V-Bucks, Robux, and game keys. Secure marketplace with buyer protection and instant delivery.',
    images: [
      {
        url: 'https://nashflare.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nashflare - Gaming Marketplace for Accounts, Currency & Game Keys',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nashflare - Buy & Sell Gaming Accounts, V-Bucks & Game Keys',
    description: 'Buy and sell gaming accounts, V-Bucks, Robux, and game keys. Secure marketplace with buyer protection and instant delivery.',
    images: ['https://nashflare.com/og-image.png'],
    // Add your Twitter handle when you have one
    // creator: '@nashflare',
    // site: '@nashflare',
  },
  alternates: {
    canonical: 'https://nashflare.com',
  },
  category: 'Gaming',
  classification: 'Gaming Marketplace',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Nashflare',
    'application-name': 'Nashflare',
    'msapplication-TileColor': '#0f172a',
    'theme-color': '#0f172a',
  },
}

export default function HomePage() {
  return <HomePageClient />
}