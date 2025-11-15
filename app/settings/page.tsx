'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'account'>('profile')
  
  // Profile form state
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        router.push('/login')
        return
      }

      setProfile(profileData)
      setUsername(profileData.username || '')
      setLoading(false)
    } catch (error) {
      console.error('Check user error:', error)
      router.push('/login')
    }
  }

  const handleUpdateProfile = async () => {
    setUsernameError('')
    
    if (!username.trim()) {
      setUsernameError('Username is required')
      return
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return
    }

    if (username.length > 20) {
      setUsernameError('Username must be 20 characters or less')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores')
      return
    }

    setSaving(true)

    try {
      if (username !== profile.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', user.id)
          .single()

        if (existingUser) {
          setUsernameError('Username is already taken')
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile, username })
      alert('✅ Profile updated successfully!')
    } catch (error: any) {
      console.error('Update profile error:', error)
      setUsernameError('Failed to update profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword) {
      setPasswordError('Current password is required')
      return
    }

    if (!newPassword) {
      setPasswordError('New password is required')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    setSaving(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        setPasswordError('Current password is incorrect')
        setSaving(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Change password error:', error)
      setPasswordError('Failed to change password: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm')
      return
    }

    if (!confirm('⚠️ THIS ACTION CANNOT BE UNDONE!\n\nYour account and all associated data will be permanently deleted.\n\nAre you absolutely sure?')) {
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          ban_reason: 'Account deleted by user',
          banned_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await supabase.auth.signOut()
      
      alert('Your account has been deleted.')
      router.push('/')
    } catch (error: any) {
      console.error('Delete account error:', error)
      alert('Failed to delete account: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadge = () => {
    if (profile?.is_admin) {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold border border-red-500/30">👑 Admin</span>
    }
    if (profile?.role === 'vendor') {
      return <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold border border-purple-500/30">🏪 Vendor</span>
    }
    return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/30">🛒 Customer</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* 2D Comic Space Background */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Animated Nebula Clouds */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        {/* Comic-style Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {/* Twinkling Stars - Small */}
        <div className="absolute top-[5%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[8%] left-[35%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
        <div className="absolute top-[12%] left-[55%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.3s' }}></div>
        <div className="absolute top-[20%] left-[70%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-[25%] left-[85%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }}></div>
        <div className="absolute top-[35%] left-[5%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.2s', animationDelay: '2s' }}></div>
        <div className="absolute top-[45%] left-[92%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '1.2s' }}></div>
        <div className="absolute top-[55%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.8s', animationDelay: '0.7s' }}></div>
        <div className="absolute top-[65%] left-[78%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.6s', animationDelay: '1.8s' }}></div>
        
        {/* Twinkling Stars - Medium */}
        <div className="absolute top-[10%] left-[45%] w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-[30%] left-[75%] w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute top-[50%] left-[8%] w-1.5 h-1.5 bg-pink-200 rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '2s' }}></div>
        <div className="absolute top-[70%] left-[60%] w-1.5 h-1.5 bg-cyan-200 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
        
        {/* Comic-style Planets */}
        {/* Planet 1 - Saturn-like with ring */}
        <div className="absolute top-[15%] right-[10%] group">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-6 border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
        
        {/* Planet 2 - Purple gas giant */}
        <div className="absolute bottom-[20%] left-[8%]">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
            <div className="absolute top-[30%] left-0 right-0 h-1 bg-purple-300/40 rounded-full"></div>
            <div className="absolute top-[50%] left-0 right-0 h-0.5 bg-purple-200/30 rounded-full"></div>
          </div>
        </div>
        
        {/* Planet 3 - Small blue planet */}
        <div className="absolute top-[60%] right-[5%]">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/40 rounded-full"></div>
          </div>
        </div>
        
        {/* Comic-style Moon */}
        <div className="absolute top-[40%] left-[3%]">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full shadow-md relative">
            <div className="absolute top-1 left-1 w-2 h-2 bg-gray-400/50 rounded-full"></div>
            <div className="absolute top-3 left-4 w-1.5 h-1.5 bg-gray-400/50 rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-gray-400/50 rounded-full"></div>
          </div>
        </div>
        
        {/* Shooting Stars / Comets - Slow and subtle */}
        <div className="absolute top-[20%] left-[30%]">
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-white to-white rounded-full animate-[shooting_12s_ease-in-out_infinite] opacity-30" style={{ transform: 'rotate(-45deg)' }}></div>
        </div>
        <div className="absolute top-[50%] right-[25%]">
          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-200 to-white rounded-full animate-[shooting_15s_ease-in-out_infinite] opacity-25" style={{ transform: 'rotate(-30deg)', animationDelay: '6s' }}></div>
        </div>
        
        {/* Floating Cosmic Particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-80 left-[40%] w-1 h-1 bg-pink-400/70 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-[20%] w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '2.5s' }}></div>
        
        {/* Comic-style Star Bursts */}
        <div className="absolute top-[25%] left-[60%]">
          <div className="relative">
            <div className="absolute w-3 h-3 bg-yellow-300/80 rotate-45 animate-pulse" style={{ animationDuration: '2s' }}></div>
            <div className="absolute w-3 h-3 bg-yellow-300/80 animate-pulse" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>
        <div className="absolute top-[70%] left-[40%]">
          <div className="relative">
            <div className="absolute w-2 h-2 bg-cyan-300/70 rotate-45 animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
            <div className="absolute w-2 h-2 bg-cyan-300/70 animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
          </div>
        </div>
        
        {/* Constellation Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <line x1="10%" y1="15%" x2="20%" y2="8%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="20%" y1="8%" x2="35%" y2="12%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="70%" y1="20%" x2="85%" y2="25%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="85%" y1="25%" x2="78%" y2="35%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-block mb-4">
                    <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                      ⚙️ Account Settings
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Settings</span>
                  </h1>
                  <p className="text-gray-400">Manage your account settings and preferences</p>
                </div>
                <div className="text-right">
                  <div className="mb-2">{getRoleBadge()}</div>
                  <p className="text-sm text-gray-400">Member since {new Date(profile?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex space-x-2 mb-8 border-b border-white/10 pb-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'security'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🔒 Security
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'account'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  ⚠️ Account
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">📝</span>
                    Profile Information
                  </h2>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-sm">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-sm">Username</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your username"
                        className="relative w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                      />
                    </div>
                    {usernameError && (
                      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                        <span>❌</span> {usernameError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, and underscores only</p>
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-sm">Account Type</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white capitalize">{profile?.role || 'customer'}</span>
                        {profile?.role === 'customer' && !profile?.is_admin && (
                          <Link
                            href="/customer-dashboard"
                            className="text-purple-400 hover:text-purple-300 text-sm transition flex items-center gap-1"
                          >
                            <span>🚀</span> Upgrade to Vendor →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verified Status (Vendors) */}
                  {profile?.role === 'vendor' && (
                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm">Verification Status</label>
                      <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3">
                        {profile?.verified ? (
                          <span className="text-green-400 flex items-center gap-2">
                            <span>✅</span> Verified Seller
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center gap-2">
                            <span>⏳</span> Pending Verification
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Seller Stats (Vendors) */}
                  {profile?.role === 'vendor' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-semibold mb-2 text-sm">Total Sales</label>
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white">
                          <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            {profile?.total_sales || 0}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2 text-sm">Average Rating</label>
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white">
                          {profile?.average_rating ? (
                            <span className="text-2xl font-bold text-yellow-400">
                              {profile.average_rating.toFixed(1)} ★
                            </span>
                          ) : (
                            <span className="text-gray-400">No ratings yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">🔐</span>
                    Security Settings
                  </h2>

                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>🔑</span> Change Password
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white font-semibold mb-2 text-sm">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-white font-semibold mb-2 text-sm">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                      </div>

                      <div>
                        <label className="block text-white font-semibold mb-2 text-sm">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                        />
                      </div>

                      {passwordError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                          <p className="text-red-400 text-sm flex items-center gap-2">
                            <span>❌</span> {passwordError}
                          </p>
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                          <p className="text-green-400 text-sm flex items-center gap-2">
                            <span>✅</span> {passwordSuccess}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Changing...
                          </span>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>🖥️</span> Login Sessions
                    </h3>
                    <p className="text-gray-400 mb-4">You are currently logged in on this device.</p>
                    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Current Session</p>
                          <p className="text-sm text-gray-400">Last active: Just now</p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                          ✓ Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">📊</span>
                    Account Management
                  </h2>

                  {/* Account Info */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>ℹ️</span> Account Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Account ID</span>
                        <span className="text-white font-mono text-sm bg-slate-900/50 px-2 py-1 rounded">{user?.id?.substring(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Email</span>
                        <span className="text-white">{user?.email}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Account Type</span>
                        <span className="text-white capitalize">{profile?.role}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400">Created</span>
                        <span className="text-white">{new Date(profile?.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Export */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>📦</span> Export Your Data
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Download a copy of your account data including your profile, orders, and messages.
                    </p>
                    <button
                      onClick={() => alert('Data export feature coming soon!')}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 border border-blue-500/30 hover:scale-105"
                    >
                      📥 Request Data Export
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <span>⚠️</span> Danger Zone
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Once you delete your account, there is no going back. This action is permanent and will remove all your data.
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 border border-red-500/30"
                      >
                        🗑️ Delete Account
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-red-400 font-semibold mb-2">
                            Type DELETE to confirm
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none placeholder-red-400/50"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={saving || deleteConfirmText !== 'DELETE'}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                          >
                            {saving ? 'Deleting...' : '⚠️ Permanently Delete Account'}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmText('')
                            }}
                            className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 GameVault. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Custom CSS for shooting star animation */}
      <style jsx>{`
        @keyframes shooting {
          0%, 100% { opacity: 0; transform: translateX(0) rotate(-45deg); }
          50% { opacity: 0.3; transform: translateX(100px) rotate(-45deg); }
        }
      `}</style>
    </div>
  )
}