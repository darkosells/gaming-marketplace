'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// Category to Games mapping for mega menu
const categoryGamesMap: { [key: string]: { icon: string; label: string; description: string; gradient: string; games: string[] } } = {
  account: {
    icon: '🎮',
    label: 'Accounts',
    description: 'Ready-to-play gaming accounts',
    gradient: 'from-purple-500 to-violet-600',
    games: ['GTA 5', 'Fortnite', 'Roblox', 'Valorant', 'League of Legends', 'Clash Royale', 'Clash of Clans', 'Steam']
  },
  items: {
    icon: '🎒',
    label: 'Items',
    description: 'Rare in-game items & collectibles',
    gradient: 'from-pink-500 to-rose-600',
    games: ['Steal a Brainrot', 'Grow a Garden', 'Adopt me', 'Blox Fruits', 'Plants vs Brainrots']
  },
  currency: {
    icon: '💰',
    label: 'Currency',
    description: 'In-game money & credits',
    gradient: 'from-amber-500 to-orange-600',
    games: ['Roblox', 'Fortnite']
  },
  key: {
    icon: '🔑',
    label: 'Game Keys',
    description: 'Activation codes & licenses',
    gradient: 'from-blue-500 to-cyan-600',
    games: ['Steam', 'Playstation', 'Xbox']
  }
}

// Helper function to convert game name to URL slug
const gameToSlug = (gameName: string): string => {
  return gameName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Testing Banner Component
function TestingBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const dismissed = localStorage.getItem('testing-banner-dismissed')
    if (dismissed) {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('testing-banner-dismissed', 'true')
  }

  if (!isMounted || !isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 backdrop-blur-lg border-b border-white/20 shadow-xl">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3 sm:gap-4 py-2 sm:py-2.5">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
              <span className="text-base sm:text-xl">⚠️</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
              <span className="text-white font-semibold text-xs sm:text-sm lg:text-base whitespace-nowrap">
                🚧 Testing Phase
              </span>
              <span className="text-white/90 text-[10px] sm:text-xs lg:text-sm truncate sm:whitespace-normal">
                This marketplace is currently in beta testing. Some features may be limited.
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm group min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
            aria-label="Dismiss banner"
          >
            <svg 
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:rotate-90 transition-transform duration-200" 
              fill="none" 
              strokeWidth="2" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
    </div>
  )
}

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileActiveCategory, setMobileActiveCategory] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  
  const mountedRef = useRef(true)
  const authInitializedRef = useRef(false)
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Check banner visibility on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('testing-banner-dismissed')
    setBannerVisible(!dismissed)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!mountedRef.current) return
      
      authInitializedRef.current = true
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setAuthError(false)
        setAuthLoading(false)
        return
      }
      
      if (session?.user) {
        setUser(session.user)
        setAuthError(false)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setAuthLoading(false)
    })

    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        )
        
        const authPromise = supabase.auth.getUser()
        
        const { data: { user: authUser }, error } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any
        
        if (!mountedRef.current) return
        
        if (error) {
          if (error.name === 'AuthSessionMissingError' || error.message?.includes('session')) {
            setUser(null)
            setProfile(null)
            setAuthError(false)
            setAuthLoading(false)
            return
          }
          console.error('Auth error:', error)
          setAuthError(true)
          setAuthLoading(false)
          return
        }
        
        if (authUser) {
          setUser(authUser)
          setAuthError(false)
          await fetchProfile(authUser.id)
        }
        
        setAuthLoading(false)
      } catch (error: any) {
        console.error('Error initializing auth:', error)
        if (!mountedRef.current) return
        
        if (error.name === 'AuthSessionMissingError' || error.message?.includes('session')) {
          setUser(null)
          setProfile(null)
          setAuthError(false)
          setAuthLoading(false)
          return
        }
        
        if (error.message === 'Auth timeout') {
          console.warn('Auth check timed out, will retry on state change')
          setAuthError(true)
        }
        setAuthLoading(false)
      }
    }

    initAuth()
    checkCart()
    
    const handleStorageChange = () => checkCart()
    const handleMessagesRead = () => fetchUnreadCount()
    const handleScroll = () => setScrolled(window.scrollY > 10)
    const handleAvatarUpdate = () => {
      if (user) fetchProfile(user.id)
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cart-updated', handleStorageChange)
    window.addEventListener('messages-read', handleMessagesRead)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('avatar-updated', handleAvatarUpdate)
    
    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cart-updated', handleStorageChange)
      window.removeEventListener('messages-read', handleMessagesRead)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('avatar-updated', handleAvatarUpdate)
      if (megaMenuTimeoutRef.current) {
        clearTimeout(megaMenuTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      
      const channel = supabase
        .channel('unread-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchUnreadCount())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => fetchUnreadCount())
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [user?.id])

  const fetchProfile = async (userId: string) => {
    if (!mountedRef.current) return
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile timeout')), 5000)
      )
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      const { data: profileData, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any
      
      if (!mountedRef.current) return
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const checkCart = () => {
    const cart = localStorage.getItem('cart')
    setCartItemCount(cart ? 1 : 0)
  }

  const fetchUnreadCount = async () => {
    if (!user || !mountedRef.current) return
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false)
      
      if (!mountedRef.current) return
      if (!error) {
        setUnreadMessageCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleLogout = async () => {
    setUser(null)
    setProfile(null)
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    setAuthError(false)
    
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.log('Signout complete')
    }
    
    router.push('/')
  }

  const getDashboardUrl = () => {
    if (profile?.is_admin) return '/admin'
    if (profile?.role === 'vendor') return '/dashboard'
    return '/customer-dashboard'
  }

  const isActive = (path: string) => pathname === path
  const isCategoryActive = (category: string) => {
    return pathname === '/browse' && typeof window !== 'undefined' && window.location.search.includes(`category=${category}`)
  }

  const handleCategoryClick = (category: string) => {
    router.push(`/browse?category=${category}`)
    setActiveMegaMenu(null)
    setMobileMenuOpen(false)
    setMobileActiveCategory(null)
  }

  const handleGameClick = (category: string, game: string) => {
    const gameSlug = gameToSlug(game)
    router.push(`/games/${gameSlug}?category=${category}`)
    setActiveMegaMenu(null)
    setMobileMenuOpen(false)
    setMobileActiveCategory(null)
  }

  const handleMegaMenuEnter = (category: string) => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current)
    }
    setActiveMegaMenu(category)
  }

  const handleMegaMenuLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null)
    }, 150)
  }

  const retryAuth = async () => {
    setAuthLoading(true)
    setAuthError(false)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        await fetchProfile(authUser.id)
      }
      setAuthLoading(false)
    } catch (error) {
      console.error('Retry auth failed:', error)
      setAuthError(true)
      setAuthLoading(false)
    }
  }

  const navTopClass = bannerVisible ? 'top-11 sm:top-12' : 'top-0'

  return (
    <>
      <TestingBanner />
      
      <nav className={`fixed ${navTopClass} left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-purple-500/10 border-b border-white/10' 
          : 'bg-black/30 backdrop-blur-lg border-b border-white/10'
      }`}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/30 p-0.5">
                  <img 
                    src="/logo6.svg" 
                    alt="Nashflare Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-300"></div>
              </div>
              <div className="hidden sm:flex flex-col flex-shrink-0">
                <span className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight whitespace-nowrap">
                  Nash<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">flare</span>
                </span>
                <span className="text-[9px] lg:text-[10px] text-gray-400 font-medium tracking-widest uppercase -mt-1 whitespace-nowrap">Marketplace</span>
              </div>
            </Link>

            {/* Desktop Navigation - Category-based */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Category Mega Menus */}
              {Object.entries(categoryGamesMap).map(([key, category]) => (
                <div 
                  key={key}
                  className="relative"
                  onMouseEnter={() => handleMegaMenuEnter(key)}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  <button 
                    onClick={() => handleCategoryClick(key)}
                    className={`px-3 xl:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1.5 text-sm xl:text-base ${
                      activeMegaMenu === key || isCategoryActive(key)
                        ? 'text-white bg-white/10' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base xl:text-lg">{category.icon}</span>
                    <span>{category.label}</span>
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMegaMenu === key ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Mega Menu Dropdown */}
                  {activeMegaMenu === key && (
                    <>
                      {/* Bridge element to prevent menu closing */}
                      <div className="absolute left-0 top-full h-3 w-full" />
                      
                      <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[400px] bg-slate-800/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                        {/* Header */}
                        <div className={`p-4 bg-gradient-to-r ${category.gradient} bg-opacity-10`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${category.gradient} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                              {category.icon}
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-lg">{category.label}</h3>
                              <p className="text-gray-300 text-sm">{category.description}</p>
                            </div>
                          </div>
                        </div>

                        {/* Games Grid */}
                        <div className="p-4">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Available Games
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {category.games.map((game) => (
                              <button
                                key={game}
                                onClick={() => handleGameClick(key, game)}
                                className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group text-left"
                              >
                                <div className={`w-8 h-8 bg-gradient-to-br ${category.gradient} bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-colors`}>
                                  <span className="text-sm">🎯</span>
                                </div>
                                <span className="font-medium text-sm">{game}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-900/50 border-t border-white/10">
                          <button
                            onClick={() => handleCategoryClick(key)}
                            className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r ${category.gradient} text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200`}
                          >
                            <span>View All {category.label}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {/* Sell Link (for vendors) */}
              {profile?.role === 'vendor' && (
                <Link 
                  href="/sell" 
                  className={`px-3 xl:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm xl:text-base ${
                    isActive('/sell') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sell
                </Link>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              {!authLoading && user && (
                <>
                  {/* Messages */}
                  <Link href="/messages" className="relative p-2 sm:p-2.5 lg:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all duration-200 group min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadMessageCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </Link>

                  {/* Cart */}
                  <Link href="/cart" className="relative p-2 sm:p-2.5 lg:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all duration-200 group min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>

                  {/* User Menu - Desktop */}
                  <div 
                    className="hidden lg:block relative"
                    onMouseEnter={() => setUserMenuOpen(true)}
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <button 
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-2 pr-3 lg:pr-4 py-1.5 lg:py-2 transition-all duration-200"
                    >
                      <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center ring-2 ring-purple-500/30 overflow-hidden">
                        {profile?.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.username} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-xs lg:text-sm">
                            {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <span className="text-white font-medium hidden xl:block text-sm lg:text-base max-w-[100px] truncate">
                        {profile?.username || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="absolute right-0 top-full h-3 w-64" />
                        <div className="absolute right-0 mt-3 w-64 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
                          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-white/10">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                  <img 
                                    src={profile.avatar_url} 
                                    alt={profile.username} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-bold text-lg">
                                    {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-white font-semibold">{profile?.username || user?.email?.split('@')[0] || 'User'}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[150px]">{user?.email}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                                  profile?.is_admin ? 'bg-red-500/20 text-red-400' : profile?.role === 'vendor' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {profile?.is_admin ? '👑 Admin' : profile?.role === 'vendor' ? '🏪 Vendor' : '👤 Customer'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-2">
                            {!profile?.is_admin && (
                              <Link href={getDashboardUrl()} onClick={() => setUserMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Dashboard</span>
                              </Link>
                            )}
                            
                            <Link href="/messages" onClick={() => setUserMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              <span>Messages</span>
                              {unreadMessageCount > 0 && (
                                <span className="ml-auto bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadMessageCount}</span>
                              )}
                            </Link>

                            {profile?.role === 'vendor' && (
                              <Link href="/sell" onClick={() => setUserMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Create Listing</span>
                              </Link>
                            )}

                            <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Settings</span>
                            </Link>

                            {profile?.is_admin && (
                              <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Admin Panel</span>
                              </Link>
                            )}
                          </div>

                          <div className="p-2 border-t border-white/10">
                            <button onClick={handleLogout} className="flex items-center space-x-3 w-full px-3 py-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {!authLoading && !user && (
                <>
                  {/* Desktop Auth Buttons */}
                  <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                    <Link 
                      href="/login" 
                      className="px-4 lg:px-5 py-2 lg:py-2.5 text-sm lg:text-base text-gray-300 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/5"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup" 
                      className="px-4 lg:px-6 py-2 lg:py-2.5 text-sm lg:text-base bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                    >
                      Get Started
                    </Link>
                  </div>

                  {/* Mobile Auth Buttons */}
                  <div className="flex md:hidden items-center space-x-2">
                    <Link 
                      href="/login" 
                      className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Sign In"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </Link>
                    <Link 
                      href="/signup" 
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-purple-500/30 transition-all duration-300 min-h-[44px] flex items-center whitespace-nowrap"
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}

              {authLoading && (
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/10 rounded-full animate-pulse"></div>
                  <div className="hidden md:block w-16 sm:w-20 h-3 sm:h-4 bg-white/10 rounded animate-pulse"></div>
                </div>
              )}

              {!authLoading && authError && !user && (
                <button
                  onClick={retryAuth}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-500/20 text-orange-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-500/30 transition-colors border border-orange-500/30"
                >
                  Retry
                </button>
              )}

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="lg:hidden p-2 text-gray-300 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white/10 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="flex flex-col space-y-1">
                {/* Category Accordions */}
                {Object.entries(categoryGamesMap).map(([key, category]) => (
                  <div key={key}>
                    <button
                      onClick={() => setMobileActiveCategory(mobileActiveCategory === key ? null : key)}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-all min-h-[48px] flex items-center justify-between ${
                        mobileActiveCategory === key
                          ? 'text-white bg-white/10' 
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{category.icon}</span>
                        <span>{category.label}</span>
                      </div>
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${mobileActiveCategory === key ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Games */}
                    {mobileActiveCategory === key && (
                      <div className="mt-1 ml-4 space-y-1 border-l-2 border-purple-500/30 pl-4">
                        <p className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                          {category.description}
                        </p>
                        {category.games.map((game) => (
                          <button
                            key={game}
                            onClick={() => handleGameClick(key, game)}
                            className="w-full px-3 py-2.5 rounded-lg text-sm text-left text-gray-400 hover:text-white hover:bg-white/5 transition-all min-h-[44px] flex items-center"
                          >
                            <span>🎯 {game}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => handleCategoryClick(key)}
                          className={`w-full flex items-center justify-center space-x-2 px-3 py-2.5 mt-2 bg-gradient-to-r ${category.gradient} text-white rounded-lg font-medium min-h-[44px]`}
                        >
                          <span>View All {category.label}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Sell (for vendors) */}
                {profile?.role === 'vendor' && (
                  <Link 
                    href="/sell" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={`px-4 py-3 rounded-lg font-medium transition-all min-h-[48px] flex items-center ${
                      isActive('/sell') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>Sell</span>
                  </Link>
                )}

                {/* User Section for Mobile */}
                {user && profile && (
                  <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
                    {/* User Info */}
                    <div className="px-4 py-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt={profile.username} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{profile?.username || user?.email?.split('@')[0] || 'User'}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Menu Links */}
                    {!profile?.is_admin && (
                      <Link 
                        href={getDashboardUrl()} 
                        onClick={() => setMobileMenuOpen(false)} 
                        className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[48px]"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Dashboard</span>
                      </Link>
                    )}

                    <Link 
                      href="/settings" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[48px]"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </Link>

                    {profile?.is_admin && (
                      <Link 
                        href="/admin" 
                        onClick={() => setMobileMenuOpen(false)} 
                        className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors min-h-[48px]"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <button 
                      onClick={handleLogout} 
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[48px]"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}

                {/* Mobile Auth Buttons */}
                {!user && (
                  <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
                    <Link 
                      href="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center text-gray-300 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-colors min-h-[48px] flex items-center justify-center"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg transition-all min-h-[48px] flex items-center justify-center"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}