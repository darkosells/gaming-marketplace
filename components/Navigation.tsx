'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// Category to Games mapping for mega menu
const categoryGamesMap: { [key: string]: { icon: string; label: string; games: string[] } } = {
  account: {
    icon: '🎮',
    label: 'Accounts',
    games: ['GTA 5', 'Fortnite', 'Roblox', 'Valorant', 'League of Legends', 'Clash Royale', 'Clash of Clans', 'Steam']
  },
  items: {
    icon: '🎒',
    label: 'Items',
    games: ['Steal a Brainrot', 'Grow a Garden', 'Adopt me', 'Blox Fruits', 'Plants vs Brainrots']
  },
  currency: {
    icon: '💰',
    label: 'Currency',
    games: ['Roblox', 'Fortnite']
  },
  key: {
    icon: '🔑',
    label: 'Game Keys',
    games: ['Steam', 'Playstation', 'Xbox']
  }
}

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  
  const mountedRef = useRef(true)
  const authInitializedRef = useRef(false)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isHomepage = pathname === '/'

  useEffect(() => {
    mountedRef.current = true
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!mountedRef.current) return
      
      // Mark that we've received auth state
      authInitializedRef.current = true
      
      // Handle SIGNED_OUT event explicitly
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setAuthError(false) // Don't treat logout as an error
        setAuthLoading(false)
        return // Exit early, don't try to fetch anything
      }
      
      if (session?.user) {
        setUser(session.user)
        setAuthError(false)
        // Fetch profile when auth state changes
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setAuthLoading(false)
    })

    // Then check initial auth state with timeout
    const initAuth = async () => {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        )
        
        const authPromise = supabase.auth.getUser()
        
        // Race the auth check against timeout
        const { data: { user: authUser }, error } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any
        
        if (!mountedRef.current) return
        
        if (error) {
          // Check if this is an AuthSessionMissingError (happens after logout)
          if (error.name === 'AuthSessionMissingError' || error.message?.includes('session')) {
            // This is expected after logout, not a real error
            console.log('No active session (user logged out)')
            setUser(null)
            setProfile(null)
            setAuthError(false) // Don't treat as error
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
          // Fetch profile with its own timeout
          await fetchProfile(authUser.id)
        }
        
        setAuthLoading(false)
      } catch (error: any) {
        console.error('Error initializing auth:', error)
        if (!mountedRef.current) return
        
        // Check if this is a session missing error (expected after logout)
        if (error.name === 'AuthSessionMissingError' || error.message?.includes('session')) {
          console.log('No active session (user logged out)')
          setUser(null)
          setProfile(null)
          setAuthError(false) // Don't treat as error
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
    }
  }, [])

  // Separate effect for fetching unread count when user changes
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
  }, [user?.id]) // Only re-run when user ID changes

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
    // Clear local state FIRST to prevent any fetches after signout
    setUser(null)
    setProfile(null)
    setUserMenuOpen(false)
    setAuthError(false) // Clear any auth errors
    
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // Ignore errors during signout - session is already gone
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

  const handleCategoryClick = (category: string) => {
    router.push(`/browse?category=${category}`)
    setMegaMenuOpen(false)
    setActiveCategory(null)
  }

  const handleGameClick = (category: string, game: string) => {
    router.push(`/browse?category=${category}&game=${encodeURIComponent(game)}`)
    setMegaMenuOpen(false)
    setActiveCategory(null)
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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-purple-500/10 border-b border-white/10' 
        : 'bg-black/30 backdrop-blur-lg border-b border-white/10'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/30">
                <span className="text-xl lg:text-2xl">🎮</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl lg:text-2xl font-black text-white tracking-tight">
                Nash<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">flare</span>
              </span>
              <span className="hidden sm:block text-[10px] text-gray-400 font-medium tracking-widest uppercase -mt-1">Marketplace</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link href="/" className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive('/') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
              Home
            </Link>
            
            {/* Mega Menu Trigger - Only on Homepage */}
            {isHomepage ? (
              <div 
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => {
                  setMegaMenuOpen(false)
                  setActiveCategory(null)
                }}
              >
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 ${
                    megaMenuOpen ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Browse</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mega Menu Dropdown */}
                {megaMenuOpen && (
                  <>
                    <div className="absolute left-0 top-full h-3 w-full" />
                    <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[700px] bg-slate-800/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                      <div className="flex">
                        <div className="w-1/3 bg-slate-900/50 p-4 border-r border-white/10">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Categories</h3>
                          <div className="space-y-1">
                            {Object.entries(categoryGamesMap).map(([key, value]) => (
                              <button
                                key={key}
                                onMouseEnter={() => setActiveCategory(key)}
                                onClick={() => handleCategoryClick(key)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                                  activeCategory === key 
                                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white' 
                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">{value.icon}</span>
                                  <span className="font-medium">{value.label}</span>
                                </div>
                                <svg className={`w-4 h-4 transition-transform ${activeCategory === key ? 'translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            ))}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <Link 
                              href="/browse" 
                              onClick={() => setMegaMenuOpen(false)}
                              className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
                            >
                              <span>View All Listings</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </Link>
                          </div>
                        </div>

                        <div className="w-2/3 p-4">
                          {activeCategory ? (
                            <>
                              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                                {categoryGamesMap[activeCategory].icon} {categoryGamesMap[activeCategory].label} - Games
                              </h3>
                              <div className="grid grid-cols-2 gap-2">
                                {categoryGamesMap[activeCategory].games.map((game) => (
                                  <button
                                    key={game}
                                    onClick={() => handleGameClick(activeCategory, game)}
                                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group text-left"
                                  >
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                                      <span className="text-sm">🎯</span>
                                    </div>
                                    <span className="font-medium">{game}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-8">
                              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-4">
                                <span className="text-3xl">👈</span>
                              </div>
                              <h3 className="text-white font-semibold mb-2">Select a Category</h3>
                              <p className="text-gray-400 text-sm max-w-xs">
                                Hover over a category on the left to see available games
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/browse" className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive('/browse') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                Browse
              </Link>
            )}
            
            {profile?.role === 'vendor' && (
              <Link href="/sell" className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive('/sell') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                Sell
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Show user controls immediately if we have user data, even if still loading profile */}
            {!authLoading && user && (
              <>
                {/* Messages */}
                <Link href="/messages" className="relative p-2.5 lg:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all duration-200 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link href="/cart" className="relative p-2.5 lg:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all duration-200 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div 
                  className="relative"
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
                    <span className="text-white font-medium hidden md:block text-sm lg:text-base">
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
              <div className="flex items-center space-x-2">
                <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                  Get Started
                </Link>
              </div>
            )}

            {/* Loading state for auth - with retry option */}
            {authLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
                <div className="hidden md:block w-20 h-4 bg-white/10 rounded animate-pulse"></div>
              </div>
            )}

            {/* Error state - show retry button */}
            {!authLoading && authError && !user && (
              <button
                onClick={retryAuth}
                className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors border border-orange-500/30"
              >
                Retry Login
              </button>
            )}

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-gray-300 hover:text-white">
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
          <div className="lg:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-lg font-medium ${isActive('/') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>Home</Link>
              <Link href="/browse" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-lg font-medium ${isActive('/browse') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>Browse</Link>
              {profile?.role === 'vendor' && (
                <Link href="/sell" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-lg font-medium ${isActive('/sell') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>Sell</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}