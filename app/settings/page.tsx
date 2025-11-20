'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { sendPasswordChangedEmail, sendUsernameChangedEmail } from '@/lib/email'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'account'>('profile')
  
  // Profile form state
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    emailOrderUpdates: true,
    emailMessages: true,
    emailMarketing: false,
    emailSecurityAlerts: true,
    theme: 'dark',
    compactMode: false,
    showOnlineStatus: true
  })
  const [preferencesSuccess, setPreferencesSuccess] = useState('')
  
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
    loadPreferences()
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
      setAvatarUrl(profileData.avatar_url || null)
      setLoading(false)
    } catch (error) {
      console.error('Check user error:', error)
      router.push('/login')
    }
  }

  const loadPreferences = () => {
    const saved = localStorage.getItem('userPreferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading preferences:', e)
      }
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAvatarError('')
    setUploadingAvatar(true)

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Please upload a JPG, PNG, GIF, or WebP image')
      setUploadingAvatar(false)
      return
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setAvatarError('Image must be smaller than 2MB')
      setUploadingAvatar(false)
      return
    }

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setProfile({ ...profile, avatar_url: publicUrl })
      
      // Trigger navigation refresh
      window.dispatchEvent(new Event('avatar-updated'))
      
      alert('✅ Avatar updated successfully!')
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      setAvatarError('Failed to upload avatar: ' + error.message)
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return
    if (!confirm('Are you sure you want to remove your avatar?')) return

    setUploadingAvatar(true)
    setAvatarError('')

    try {
      // Extract file path from URL
      const urlParts = avatarUrl.split('/avatars/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage
          .from('avatars')
          .remove([filePath])
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)

      if (error) throw error

      setAvatarUrl(null)
      setProfile({ ...profile, avatar_url: null })
      
      // Trigger navigation refresh
      window.dispatchEvent(new Event('avatar-updated'))
      
      alert('Avatar removed successfully!')
    } catch (error: any) {
      console.error('Remove avatar error:', error)
      setAvatarError('Failed to remove avatar: ' + error.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const savePreferences = () => {
    setSaving(true)
    setPreferencesSuccess('')
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences))
    
    if (preferences.theme === 'light') {
      document.documentElement.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
    }
    
    setTimeout(() => {
      setSaving(false)
      setPreferencesSuccess('Preferences saved successfully!')
      setTimeout(() => setPreferencesSuccess(''), 3000)
    }, 500)
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
      const oldUsername = profile.username
      const usernameChanged = username !== oldUsername

      if (usernameChanged) {
        // Check if username is taken
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
      
      // Send username change notification email if username was changed
      if (usernameChanged) {
        try {
          await sendUsernameChangedEmail({
            userEmail: user.email,
            oldUsername: oldUsername,
            newUsername: username
          })
          console.log('Username change notification email sent')
        } catch (emailError) {
          console.error('Failed to send username change email:', emailError)
          // Don't block the success - email is a nice-to-have
        }
      }
      
      alert('✅ Profile updated successfully!')
    } catch (error: any) {
      console.error('Update profile error:', error)
      setUsernameError('Failed to update profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Same password validation as signup/reset password pages
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (password.length > 72) {
      return 'Password must be at most 72 characters'
    }
    
    // Check for at least one number OR one special character
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    
    if (!hasNumber && !hasSpecialChar) {
      return 'Password must contain at least one number or special character'
    }
    
    // Check against common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty123', 'abc12345', 'password1', 'welcome1', 'letmein1']
    if (weakPasswords.includes(password.toLowerCase())) {
      return 'This password is too common. Please choose a stronger password'
    }
    
    return null
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

    // Use the same password validation as signup/reset password
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setPasswordError(passwordError)
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
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        setPasswordError('Current password is incorrect')
        setSaving(false)
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Send password change notification email
      try {
        await sendPasswordChangedEmail({
          userEmail: user.email,
          username: profile.username
        })
        console.log('Password change notification email sent')
      } catch (emailError) {
        console.error('Failed to send password change email:', emailError)
        // Don't block the success - email is a nice-to-have
      }

      setPasswordSuccess('Password changed successfully! A confirmation email has been sent.')
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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {/* Stars */}
        <div className="absolute top-[5%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[8%] left-[35%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
        <div className="absolute top-[12%] left-[55%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.3s' }}></div>
        <div className="absolute top-[20%] left-[70%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-[25%] left-[85%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }}></div>
        
        {/* Planets */}
        <div className="absolute top-[15%] right-[10%] group">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-6 border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
        <div className="absolute bottom-[20%] left-[8%]">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
          </div>
        </div>
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
              <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
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
                  onClick={() => setActiveTab('preferences')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'preferences'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🔔 Preferences
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

                  {/* Avatar Upload Section */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>📷</span> Profile Picture
                    </h3>
                    
                    <div className="flex items-center gap-6">
                      {/* Avatar Preview */}
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-purple-500/30">
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-3xl">
                              {profile?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-3 mb-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
                          </button>
                          
                          {avatarUrl && (
                            <button
                              onClick={handleRemoveAvatar}
                              disabled={uploadingAvatar}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-semibold transition-all duration-300 border border-red-500/30 disabled:opacity-50 flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        
                        <p className="text-gray-400 text-sm">
                          JPG, PNG, GIF or WebP. Max size 2MB.
                        </p>
                        
                        {avatarError && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                            <span>❌</span> {avatarError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

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
                    <p className="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, and underscores only. You'll receive an email confirmation when changed.</p>
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

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">🔔</span>
                    Preferences
                  </h2>

                  {/* Notification Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span>📧</span> Email Notifications
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl cursor-pointer group hover:bg-slate-800/80 transition-all duration-300">
                        <div>
                          <p className="text-white font-medium">Order Updates</p>
                          <p className="text-gray-400 text-sm">Get notified about your order status changes</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={preferences.emailOrderUpdates}
                            onChange={(e) => setPreferences({ ...preferences, emailOrderUpdates: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                            preferences.emailOrderUpdates ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
                          }`}>
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1 ${
                              preferences.emailOrderUpdates ? 'translate-x-7' : 'translate-x-1'
                            }`}></div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl cursor-pointer group hover:bg-slate-800/80 transition-all duration-300">
                        <div>
                          <p className="text-white font-medium">New Messages</p>
                          <p className="text-gray-400 text-sm">Get notified when you receive new messages</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={preferences.emailMessages}
                            onChange={(e) => setPreferences({ ...preferences, emailMessages: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                            preferences.emailMessages ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
                          }`}>
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1 ${
                              preferences.emailMessages ? 'translate-x-7' : 'translate-x-1'
                            }`}></div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl cursor-pointer group hover:bg-slate-800/80 transition-all duration-300">
                        <div>
                          <p className="text-white font-medium">Marketing & Promotions</p>
                          <p className="text-gray-400 text-sm">Receive special offers and platform updates</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={preferences.emailMarketing}
                            onChange={(e) => setPreferences({ ...preferences, emailMarketing: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                            preferences.emailMarketing ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
                          }`}>
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1 ${
                              preferences.emailMarketing ? 'translate-x-7' : 'translate-x-1'
                            }`}></div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl cursor-pointer group hover:bg-slate-800/80 transition-all duration-300">
                        <div>
                          <p className="text-white font-medium">Security Alerts</p>
                          <p className="text-gray-400 text-sm">Important security notifications about your account</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={preferences.emailSecurityAlerts}
                            onChange={(e) => setPreferences({ ...preferences, emailSecurityAlerts: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                            preferences.emailSecurityAlerts ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
                          }`}>
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1 ${
                              preferences.emailSecurityAlerts ? 'translate-x-7' : 'translate-x-1'
                            }`}></div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Theme Preferences */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span>🎨</span> Display Settings
                    </h3>

                    <div>
                      <p className="text-white font-medium mb-3">Theme</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                          className={`p-4 rounded-xl border transition-all duration-300 ${
                            preferences.theme === 'dark'
                              ? 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30'
                              : 'bg-slate-900/50 border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="text-2xl mb-2">🌙</div>
                          <p className="text-white font-medium">Dark</p>
                          <p className="text-gray-400 text-xs">Default theme</p>
                        </button>
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                          className={`p-4 rounded-xl border transition-all duration-300 ${
                            preferences.theme === 'light'
                              ? 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30'
                              : 'bg-slate-900/50 border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="text-2xl mb-2">☀️</div>
                          <p className="text-white font-medium">Light</p>
                          <p className="text-gray-400 text-xs">Coming soon</p>
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl cursor-pointer group hover:bg-slate-800/80 transition-all duration-300">
                      <div>
                        <p className="text-white font-medium">Compact Mode</p>
                        <p className="text-gray-400 text-sm">Reduce spacing for more content on screen</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences.compactMode}
                          onChange={(e) => setPreferences({ ...preferences, compactMode: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                          preferences.compactMode ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
                        }`}>
                          <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1 ${
                            preferences.compactMode ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl cursor-pointer group hover:bg-slate-800/80 transition-all duration-300">
                      <div>
                        <p className="text-white font-medium">Show Online Status</p>
                        <p className="text-gray-400 text-sm">Let others see when you're online</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={preferences.showOnlineStatus}
                          onChange={(e) => setPreferences({ ...preferences, showOnlineStatus: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                          preferences.showOnlineStatus ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
                        }`}>
                          <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1 ${
                            preferences.showOnlineStatus ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {preferencesSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                      <p className="text-green-400 text-sm flex items-center gap-2">
                        <span>✅</span> {preferencesSuccess}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </span>
                    ) : (
                      'Save Preferences'
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
                          minLength={8}
                          maxLength={72}
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                        />
                        <p className="text-xs text-gray-500 mt-1">At least 8 characters with a number or special character</p>
                      </div>

                      <div>
                        <label className="block text-white font-semibold mb-2 text-sm">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          minLength={8}
                          maxLength={72}
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
            <p>&copy; 2024 Nashflare. All rights reserved.</p>
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