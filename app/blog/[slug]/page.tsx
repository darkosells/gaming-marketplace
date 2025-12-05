import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import SocialShareButtons from '@/components/SocialShareButtons'

// Import directly from individual files
import { blogPostsMeta } from '@/lib/blog/posts'
import { BlogPostMeta, gameSlugMap, categoryInfo } from '@/lib/blog/types'

// Site config for SEO
const SITE_URL = 'https://nashflare.com'
const SITE_NAME = 'Nashflare'

// Generate static params for all blog posts
export async function generateStaticParams() {
  return blogPostsMeta.map((post) => ({ slug: post.slug }))
}

// Generate metadata for SEO - Next.js 15 compatible
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = blogPostsMeta.find(p => p.slug === slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | Nashflare Blog',
    }
  }

  const canonicalUrl = `${SITE_URL}/blog/${slug}`

  return {
    title: `${post.title} | Nashflare Blog`,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author }],
    creator: post.author,
    publisher: SITE_NAME,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ],
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
      creator: '@nashflare',
    },
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
  }
}

// Dynamic content loader - ALL 12 POSTS
async function getPostContent(slug: string): Promise<string | null> {
  try {
    switch (slug) {
      // Original 8 posts
      case 'fortnite-account-safety-guide-2024':
        return (await import('@/lib/blog/content/fortnite-account-safety-guide-2024')).content
      case 'valorant-ranked-guide-climb-to-radiant':
        return (await import('@/lib/blog/content/valorant-ranked-guide-climb-to-radiant')).content
      case 'gta-5-modded-accounts-ultimate-buyers-guide':
        return (await import('@/lib/blog/content/gta-5-modded-accounts-ultimate-buyers-guide')).content
      case 'league-of-legends-smurf-accounts-explained':
        return (await import('@/lib/blog/content/league-of-legends-smurf-accounts-explained')).content
      case 'roblox-limited-items-investment-guide-2024':
        return (await import('@/lib/blog/content/roblox-limited-items-investment-guide-2024')).content
      case 'clash-of-clans-base-building-ultimate-guide':
        return (await import('@/lib/blog/content/clash-of-clans-base-building-ultimate-guide')).content
      case 'gaming-marketplace-safety-avoiding-scams':
        return (await import('@/lib/blog/content/gaming-marketplace-safety-avoiding-scams')).content
      case 'best-gaming-accounts-to-buy-2024':
        return (await import('@/lib/blog/content/best-gaming-accounts-to-buy-2024')).content
      // NEW 4 posts
      case 'how-to-sell-gaming-account-complete-guide':
        return (await import('@/lib/blog/content/how-to-sell-gaming-account-complete-guide')).content
      case 'is-buying-gaming-accounts-legal':
        return (await import('@/lib/blog/content/is-buying-gaming-accounts-legal')).content
      case 'how-much-is-my-fortnite-account-worth':
        return (await import('@/lib/blog/content/how-much-is-my-fortnite-account-worth')).content
      case 'gta-5-modded-cars-outfits-guide':
        return (await import('@/lib/blog/content/gta-5-modded-cars-outfits-guide')).content
      default:
        return null
    }
  } catch (error) {
    console.error(`Failed to load content for ${slug}:`, error)
    return null
  }
}

// Get related posts
function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPostMeta[] {
  const currentPost = blogPostsMeta.find(p => p.slug === currentSlug)
  if (!currentPost) return blogPostsMeta.slice(0, limit)
  
  return blogPostsMeta
    .filter(post => post.slug !== currentSlug)
    .filter(post => post.game === currentPost.game || post.category === currentPost.category)
    .slice(0, limit)
}

// Extract headings for Table of Contents
function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = []
  const lines = content.split('\n')
  
  lines.forEach(line => {
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      const text = line.replace('## ', '')
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      headings.push({ id, text, level: 2 })
    }
  })
  
  return headings
}

// Generate JSON-LD Structured Data
function generateStructuredData(post: BlogPostMeta, slug: string, content: string) {
  const articleUrl = `${SITE_URL}/blog/${slug}`
  const wordCount = content.split(/\s+/).length
  
  // Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    url: articleUrl,
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount: wordCount,
    inLanguage: 'en-US',
  }

  // BreadcrumbList Schema
  const gameSlug = gameSlugMap[post.game]
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: `${SITE_URL}/blog`,
    },
  ]

  if (gameSlug && post.game !== 'General') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: post.game,
      item: `${SITE_URL}/games/${gameSlug}`,
    })
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 4,
      name: post.title,
      item: articleUrl,
    })
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: post.title,
      item: articleUrl,
    })
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return { articleSchema, breadcrumbSchema }
}

// SEO Internal Linking Component - Browse Game Section
function BrowseGameSection({ game, relevantCategories }: { game: string; relevantCategories?: string[] }) {
  const gameSlug = gameSlugMap[game]
  if (!gameSlug) return null
  
  const categoriesToShow = relevantCategories || ['account', 'items', 'currency']
  
  return (
    <div className="my-8 p-6 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-3">
        🎮 Browse {game} on Nashflare
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Ready to buy or sell? Check out our {game} marketplace for the best deals.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link 
          href={`/games/${gameSlug}`}
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all min-h-[44px] flex items-center"
        >
          View All {game}
        </Link>
        {categoriesToShow.map(cat => {
          const info = categoryInfo[cat]
          if (!info) return null
          return (
            <Link
              key={cat}
              href={`/games/${gameSlug}?category=${cat}`}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm transition-all min-h-[44px] flex items-center"
            >
              {info.emoji} {game} {info.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// SEO Internal Linking Component - Popular Games Sidebar
function PopularGamesSidebar() {
  const games = [
    { name: 'Fortnite', slug: 'fortnite', emoji: '🎯' },
    { name: 'Valorant', slug: 'valorant', emoji: '🔫' },
    { name: 'GTA 5', slug: 'gta-5', emoji: '🚗' },
    { name: 'League of Legends', slug: 'league-of-legends', emoji: '⚔️' },
    { name: 'Roblox', slug: 'roblox', emoji: '🧱' },
    { name: 'Clash of Clans', slug: 'clash-of-clans', emoji: '🏰' },
  ]
  
  return (
    <div className="my-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4">
        🔥 Popular Games on Nashflare
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {games.map(game => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="px-3 py-2 bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/30 rounded-lg text-gray-300 hover:text-white text-sm transition-all min-h-[44px] flex items-center"
          >
            <span className="mr-2">{game.emoji}</span>
            {game.name}
          </Link>
        ))}
      </div>
      <Link
        href="/games"
        className="mt-4 block text-center px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all min-h-[44px] flex items-center justify-center"
      >
        Browse All Games →
      </Link>
    </div>
  )
}

// Table of Contents Component
function TableOfContents({ headings }: { headings: { id: string; text: string; level: number }[] }) {
  if (headings.length < 3) return null
  
  return (
    <nav className="my-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        Table of Contents
      </h3>
      <ul className="space-y-2">
        {headings.map((heading, index) => (
          <li key={index}>
            <a 
              href={`#${heading.id}`}
              className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2"
            >
              <span className="text-purple-500/50">→</span>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Author Section Component
function AuthorSection({ author }: { author: string }) {
  return (
    <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {author.charAt(0)}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Written by {author}</h3>
          <p className="text-gray-400 text-sm mb-3">
            The Nashflare Team is dedicated to providing expert guides and insights for the gaming marketplace community. 
            With years of experience in digital asset trading, we help buyers and sellers navigate the market safely.
          </p>
          <div className="flex items-center gap-3">
            <Link 
              href="/blog" 
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              View all articles →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component - Next.js 15 compatible with awaited params
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params first (Next.js 15 requirement)
  const { slug } = await params
  
  // Find post metadata
  const post = blogPostsMeta.find(p => p.slug === slug)
  
  if (!post) {
    notFound()
  }

  // Load content
  const content = await getPostContent(slug)
  
  if (!content) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(slug, 3)
  const gameSlug = gameSlugMap[post.game]
  const isGeneralPost = post.game === 'General'
  const headings = extractHeadings(content)
  const { articleSchema, breadcrumbSchema } = generateStructuredData(post, slug, content)
  const articleUrl = `${SITE_URL}/blog/${slug}`
  const wordCount = content.split(/\s+/).length

  // Simple markdown renderer with heading IDs for TOC
  const renderMarkdown = (markdownContent: string) => {
    return markdownContent
      .split('\n')
      .map((line, index) => {
        // Headers with IDs for TOC linking
        if (line.startsWith('### ')) {
          const text = line.replace('### ', '')
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          return <h3 key={index} id={id} className="text-xl font-semibold text-white mt-8 mb-4 scroll-mt-24">{text}</h3>
        }
        if (line.startsWith('## ')) {
          const text = line.replace('## ', '')
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          return <h2 key={index} id={id} className="text-2xl font-bold text-white mt-10 mb-4 scroll-mt-24">{text}</h2>
        }
        if (line.startsWith('# ')) {
          const text = line.replace('# ', '')
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          return <h1 key={index} id={id} className="text-3xl font-bold text-white mt-10 mb-6 scroll-mt-24">{text}</h1>
        }
        
        // Bold text
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={index} className="text-gray-300 mb-4 leading-relaxed">
              {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part)}
            </p>
          )
        }
        
        // List items
        if (line.startsWith('- ')) {
          return <li key={index} className="text-gray-300 ml-6 mb-2 list-disc">{line.replace('- ', '')}</li>
        }
        if (line.match(/^\d+\. /)) {
          return <li key={index} className="text-gray-300 ml-6 mb-2 list-decimal">{line.replace(/^\d+\. /, '')}</li>
        }
        
        // Checkmarks
        if (line.startsWith('- ✅') || line.startsWith('- ❌')) {
          return <li key={index} className="text-gray-300 ml-6 mb-2 list-none">{line.replace('- ', '')}</li>
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <div key={index} className="h-2"></div>
        }
        
        // Regular paragraphs
        return <p key={index} className="text-gray-300 mb-4 leading-relaxed">{line}</p>
      })
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Optimized Background - Subtle gradient, no blur orbs, no animations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        {/* Subtle purple tint at top only */}
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-purple-950/30 to-transparent"></div>
      </div>

      <Navigation />

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto" itemScope itemType="https://schema.org/Article">
          {/* Breadcrumb with Game Link for SEO */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-purple-400 transition-colors">Blog</Link>
            {!isGeneralPost && gameSlug && (
              <>
                <span>/</span>
                <Link href={`/games/${gameSlug}`} className="hover:text-purple-400 transition-colors">{post.game}</Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-400 truncate max-w-[150px] sm:max-w-none">{post.title}</span>
          </nav>

          {/* Hero Image */}
          <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-8">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
              itemProp="image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full mb-3">
                {post.category}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white leading-tight" itemProp="headline">{post.title}</h1>
            </div>
          </div>

          {/* Meta Info with Game Link */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                  {post.author.charAt(0)}
                </div>
                <span itemProp="author">{post.author}</span>
              </div>
              <span>•</span>
              <time dateTime={post.date} itemProp="datePublished">
                {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </time>
              <span>•</span>
              <span>{post.readTime}</span>
              <span>•</span>
              <span>{wordCount.toLocaleString()} words</span>
              {!isGeneralPost && gameSlug && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <Link 
                    href={`/games/${gameSlug}`}
                    className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-purple-300 transition-all"
                  >
                    🎮 {post.game}
                  </Link>
                </>
              )}
            </div>
            <SocialShareButtons url={articleUrl} title={post.title} />
          </div>

          {/* Table of Contents */}
          <TableOfContents headings={headings} />

          {/* SEO Internal Links - Game Browse Section (for game-specific posts) */}
          {!isGeneralPost && (
            <BrowseGameSection game={post.game} relevantCategories={post.relevantCategories} />
          )}

          {/* SEO Internal Links - Popular Games (for general posts) */}
          {isGeneralPost && <PopularGamesSidebar />}

          {/* Content */}
          <div className="prose prose-invert max-w-none" itemProp="articleBody">
            {renderMarkdown(content)}
          </div>

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-400" itemProp="keywords">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Author Section */}
          <AuthorSection author={post.author} />

          {/* CTA Section with Game Link */}
          <div className="mt-12 p-6 sm:p-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to Start Trading?</h2>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">
              {isGeneralPost 
                ? 'Browse our marketplace for the best deals on gaming accounts, items, and currency.'
                : `Browse ${post.game} accounts, items, and currency on Nashflare.`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!isGeneralPost && gameSlug ? (
                <Link
                  href={`/games/${gameSlug}`}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all min-h-[44px] flex items-center justify-center"
                >
                  Browse {post.game}
                </Link>
              ) : (
                <Link
                  href="/browse"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all min-h-[44px] flex items-center justify-center"
                >
                  Browse Marketplace
                </Link>
              )}
              <Link
                href="/sell"
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all min-h-[44px] flex items-center justify-center"
              >
                Start Selling
              </Link>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                  >
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-2">{relatedPost.readTime}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}