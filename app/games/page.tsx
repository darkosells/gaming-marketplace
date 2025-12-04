// Games Index Page - Lists All Games
// Location: app/games/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/seo-config'
import { gamesConfig } from '@/lib/games-config'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'All Games - Browse Gaming Marketplace by Game | Nashflare',
  description: 'Browse our complete list of supported games. Buy and sell accounts, items, currency, and keys for Fortnite, Valorant, GTA 5, Roblox, League of Legends, and more.',
  keywords: [
    'gaming marketplace',
    'all games',
    'fortnite',
    'valorant',
    'gta 5',
    'roblox',
    'league of legends',
    'clash of clans',
    'clash royale',
    'buy game accounts',
    'sell game accounts',
    'game trading platform',
    'gaming accounts for sale',
    'buy fortnite account',
    'buy valorant account',
    'buy roblox account',
  ],
  openGraph: {
    title: 'All Games - Gaming Marketplace | Nashflare',
    description: 'Browse accounts, items, and currency for all your favorite games. Verified sellers with buyer protection.',
    url: `${siteConfig.url}/games`,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'All Games - Nashflare Gaming Marketplace',
      },
    ],
    locale: siteConfig.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Games - Gaming Marketplace | Nashflare',
    description: 'Browse accounts, items, and currency for all your favorite games.',
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  alternates: {
    canonical: `${siteConfig.url}/games`,
  },
}

export default function GamesIndexPage() {
  // Group games by category
  const gamesByCategory = gamesConfig.reduce((acc, game) => {
    if (!acc[game.category]) {
      acc[game.category] = []
    }
    acc[game.category].push(game)
    return acc
  }, {} as Record<string, typeof gamesConfig>)

  const categoryOrder = ['Battle Royale', 'FPS', 'MOBA', 'RPG', 'Strategy', 'Sandbox', 'Platform']

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Optimized Background - iOS Safari Compatible */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        {/* Reduced blur for iOS performance */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] opacity-50"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <main className="container mx-auto px-4 pt-24 pb-12">
          {/* Breadcrumb - Good for SEO */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-purple-400 transition">
                  Home
                </Link>
              </li>
              <li className="text-gray-600">/</li>
              <li className="text-purple-400">Games</li>
            </ol>
          </nav>

          {/* Page Header - iOS Safari Fix: Solid color instead of gradient text */}
          <header className="mb-12 text-center">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                🎮 Game Directory
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Browse by{' '}
              <span className="text-purple-400">Game</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose your favorite game and discover accounts, items, currency, and keys from verified sellers
            </p>
          </header>

          {/* All Games Grid */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8">All Games</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {gamesConfig.map((game) => (
                <Link
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  className="group relative bg-slate-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
                >
                  <div className="relative text-center">
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                      {game.icon}
                    </div>
                    <h3 className="text-white font-bold text-base sm:text-lg mb-1 group-hover:text-purple-400 transition">
                      {game.name}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3">{game.category}</p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {game.categories.map((cat) => (
                        <span
                          key={cat}
                          className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-full"
                        >
                          {cat === 'account' ? 'Accounts' : cat === 'items' ? 'Items' : cat === 'currency' ? 'Currency' : 'Keys'}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Games by Category */}
          {categoryOrder.map((category) => {
            const games = gamesByCategory[category]
            if (!games || games.length === 0) return null

            return (
              <section key={category} className="mb-12">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3 flex-wrap">
                  <span className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 rounded-lg">
                    {category}
                  </span>
                  <span className="text-gray-500 text-sm sm:text-base font-normal">
                    ({games.length} {games.length === 1 ? 'game' : 'games'})
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {games.map((game) => (
                    <Link
                      key={game.slug}
                      href={`/games/${game.slug}`}
                      className="group bg-slate-900/50 border border-white/5 rounded-xl p-3 sm:p-4 hover:bg-slate-800/50 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="text-center">
                        <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                          {game.icon}
                        </div>
                        <h3 className="text-white font-semibold text-xs sm:text-sm group-hover:text-purple-400 transition">
                          {game.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </main>

        {/* Use the reusable Footer component with SEO game links */}
        <Footer />
      </div>
    </div>
  )
}