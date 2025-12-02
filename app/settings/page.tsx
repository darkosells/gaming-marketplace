'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { sendPasswordChangedEmail, sendUsernameChangedEmail } from '@/lib/email'

// Custom Modal Component
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
}

function CustomModal({ isOpen, onClose, onConfirm, title, message, type, confirmText = 'OK', cancelText = 'Cancel' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={type === 'alert' ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-purple-500/20 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {type === 'confirm' ? (
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">{title}</h3>
        
        {/* Message */}
        <p className="text-gray-300 text-center mb-6">{message}</p>
        
        {/* Buttons */}
        <div className={`flex gap-3 ${type === 'alert' ? 'justify-center' : 'justify-center'}`}>
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-xl font-semibold transition-all duration-300 border border-white/10 hover:border-white/20"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (type === 'confirm' && onConfirm) {
                onConfirm()
              }
              onClose()
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              type === 'confirm'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'account'>('profile')
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: 'alert' | 'confirm'
    title: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  })

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
    compactMode: false
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

  // Account ID reveal state
  const [showAccountId, setShowAccountId] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Helper functions for modal
  const showAlert = (title: string, message: string) => {
    setModal({
      isOpen: true,
      type: 'alert',
      title,
      message
    })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm
    })
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

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
      
      showAlert('Success', 'Avatar updated successfully!')
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
    
    showConfirm(
      'Remove Avatar',
      'Are you sure you want to remove your avatar?',
      async () => {
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
          
          showAlert('Success', 'Avatar removed successfully!')
        } catch (error: any) {
          console.error('Remove avatar error:', error)
          setAvatarError('Failed to remove avatar: ' + error.message)
        } finally {
          setUploadingAvatar(false)
        }
      }
    )
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
      
      showAlert('Success', 'Profile updated successfully!')
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
      showAlert('Confirmation Required', 'Please type DELETE to confirm')
      return
    }

    showConfirm(
      'Delete Account',
      'THIS ACTION CANNOT BE UNDONE! Your account and all associated data will be permanently deleted. Are you absolutely sure?',
      async () => {
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
          
          showAlert('Account Deleted', 'Your account has been deleted.')
          setTimeout(() => {
            router.push('/')
          }, 1500)
        } catch (error: any) {
          console.error('Delete account error:', error)
          showAlert('Error', 'Failed to delete account: ' + error.message)
        } finally {
          setSaving(false)
        }
      }
    )
  }

  const getRoleBadge = () => {
    if (profile?.is_admin) {
      return <span className="px-2 sm:px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs sm:text-sm font-semibold border border-red-500/30">👑 Admin</span>
    }
    if (profile?.role === 'vendor') {
      return <span className="px-2 sm:px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs sm:text-sm font-semibold border border-purple-500/30">🏪 Vendor</span>
    }
    return <span className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs sm:text-sm font-semibold border border-blue-500/30">🛒 Customer</span>
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
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.type === 'confirm' ? 'Yes, Continue' : 'OK'}
        cancelText="Cancel"
      />

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
        
        {/* Planets - Hidden on smallest mobile screens */}
        <div className="hidden sm:block absolute top-[15%] right-[10%] group">
          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 sm:w-32 h-4 sm:h-6 border-2 sm:border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
        <div className="hidden sm:block absolute bottom-[20%] left-[8%]">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Header - Mobile Optimized */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <div className="inline-block mb-3 sm:mb-4">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium">
                      ⚙️ Account Settings
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Settings</span>
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">Manage your account settings and preferences</p>
                </div>
                <div className="w-full sm:w-auto sm:text-right">
                  <div className="mb-2 flex sm:justify-end">{getRoleBadge()}</div>
                  <p className="text-xs sm:text-sm text-gray-400">Member since {new Date(profile?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Tabs - Mobile Scroll */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-300">
              {/* Mobile: Horizontal Scroll Tabs */}
              <div className="flex overflow-x-auto gap-2 mb-6 sm:mb-8 border-b border-white/10 pb-3 sm:pb-4 -mx-1 px-1 scrollbar-hide">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="hidden xs:inline">👤 </span>Profile
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${
                    activeTab === 'preferences'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="hidden xs:inline">🔔 </span>Preferences
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${
                    activeTab === 'security'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="hidden xs:inline">🔒 </span>Security
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${
                    activeTab === 'account'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="hidden xs:inline">⚠️ </span>Account
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="text-purple-400">📝</span>
                    <span className="text-base sm:text-2xl">Profile Information</span>
                  </h2>

                  {/* Avatar Upload Section - Mobile Optimized */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>📷</span> Profile Picture
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      {/* Avatar Preview */}
                      <div className="relative group flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-purple-500/30">
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-2xl sm:text-3xl">
                              {profile?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="w-6 sm:w-8 h-6 sm:h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 sm:py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm sm:text-base"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
                          </button>
                          
                          {avatarUrl && (
                            <button
                              onClick={handleRemoveAvatar}
                              disabled={uploadingAvatar}
                              className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2.5 sm:py-2 rounded-lg font-semibold transition-all duration-300 border border-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        
                        <p className="text-gray-400 text-xs sm:text-sm">
                          JPG, PNG, GIF or WebP. Max size 2MB.
                        </p>
                        
                        {avatarError && (
                          <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center gap-1">
                            <span>❌</span> {avatarError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-gray-400 cursor-not-allowed text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">Username</label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your username"
                        className="relative w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 text-sm sm:text-base"
                      />
                    </div>
                    {usernameError && (
                      <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                        <span>❌</span> {usernameError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, and underscores only. You'll receive an email confirmation when changed.</p>
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">Account Type</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-white capitalize text-sm sm:text-base">{profile?.role || 'customer'}</span>
                        {profile?.role === 'customer' && !profile?.is_admin && (
                          <Link
                            href="/customer-dashboard"
                            className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm transition flex items-center gap-1"
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
                      <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">Verification Status</label>
                      <div className="bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                        {profile?.verified ? (
                          <span className="text-green-400 flex items-center gap-2 text-sm sm:text-base">
                            <span>✅</span> Verified Seller
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center gap-2 text-sm sm:text-base">
                            <span>⏳</span> Pending Verification
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Seller Stats (Vendors) */}
                  {profile?.role === 'vendor' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">Total Sales</label>
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white">
                          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            {profile?.total_sales || 0}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">Average Rating</label>
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white">
                          {profile?.average_rating ? (
                            <span className="text-xl sm:text-2xl font-bold text-yellow-400">
                              {profile.average_rating.toFixed(1)} ★
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm sm:text-base">No ratings yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-sm sm:text-base"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="text-purple-400">🔔</span>
                    <span className="text-base sm:text-2xl">Preferences</span>
                  </h2>

                  {/* Notification Preferences */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <span>📧</span> Email Notifications
                    </h3>
                    
                    {/* Coming Soon Notice */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                      <p className="text-yellow-400 text-xs sm:text-sm flex items-center gap-2">
                        <span>🚧</span> Email notification preferences coming soon. These options are currently disabled.
                      </p>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      {/* Order Updates - Disabled */}
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/30 rounded-xl opacity-50 cursor-not-allowed gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 font-medium text-sm sm:text-base">Order Updates</p>
                          <p className="text-gray-500 text-xs sm:text-sm">Get notified about your order status changes</p>
                        </div>
                        <div className="relative flex-shrink-0">
                          <div className="w-12 sm:w-14 h-7 sm:h-8 rounded-full bg-slate-700">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-gray-500 rounded-full shadow-md transform mt-1 translate-x-1"></div>
                          </div>
                        </div>
                      </div>

                      {/* New Messages - Disabled */}
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/30 rounded-xl opacity-50 cursor-not-allowed gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 font-medium text-sm sm:text-base">New Messages</p>
                          <p className="text-gray-500 text-xs sm:text-sm">Get notified when you receive new messages</p>
                        </div>
                        <div className="relative flex-shrink-0">
                          <div className="w-12 sm:w-14 h-7 sm:h-8 rounded-full bg-slate-700">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-gray-500 rounded-full shadow-md transform mt-1 translate-x-1"></div>
                          </div>
                        </div>
                      </div>

                      {/* Marketing - Disabled */}
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/30 rounded-xl opacity-50 cursor-not-allowed gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 font-medium text-sm sm:text-base">Marketing & Promotions</p>
                          <p className="text-gray-500 text-xs sm:text-sm">Receive special offers and platform updates</p>
                        </div>
                        <div className="relative flex-shrink-0">
                          <div className="w-12 sm:w-14 h-7 sm:h-8 rounded-full bg-slate-700">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-gray-500 rounded-full shadow-md transform mt-1 translate-x-1"></div>
                          </div>
                        </div>
                      </div>

                      {/* Security Alerts - Disabled */}
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/30 rounded-xl opacity-50 cursor-not-allowed gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 font-medium text-sm sm:text-base">Security Alerts</p>
                          <p className="text-gray-500 text-xs sm:text-sm">Important security notifications about your account</p>
                        </div>
                        <div className="relative flex-shrink-0">
                          <div className="w-12 sm:w-14 h-7 sm:h-8 rounded-full bg-slate-700">
                            <div className="w-5 sm:w-6 h-5 sm:h-6 bg-gray-500 rounded-full shadow-md transform mt-1 translate-x-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theme Preferences - Active */}
                  <div className="space-y-3 sm:space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <span>🎨</span> Display Settings
                    </h3>

                    <div>
                      <p className="text-white font-medium mb-3 text-sm sm:text-base">Theme</p>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                          className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
                            preferences.theme === 'dark'
                              ? 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30'
                              : 'bg-slate-900/50 border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🌙</div>
                          <p className="text-white font-medium text-sm sm:text-base">Dark</p>
                          <p className="text-gray-400 text-xs">Default theme</p>
                        </button>
                        <button
                          onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                          className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
                            preferences.theme === 'light'
                              ? 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30'
                              : 'bg-slate-900/50 border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="text-xl sm:text-2xl mb-1 sm:mb-2">☀️</div>
                          <p className="text-white font-medium text-sm sm:text-base">Light</p>
                          <p className="text-gray-400 text-xs">Coming soon</p>
                        </button>
                      </div>
                    </div>

                    {/* Compact Mode - Disabled */}
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/30 rounded-xl opacity-50 cursor-not-allowed gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-400 font-medium text-sm sm:text-base">Compact Mode</p>
                        <p className="text-gray-500 text-xs sm:text-sm">Reduce spacing for more content on screen</p>
                      </div>
                      <div className="relative flex-shrink-0">
                        <div className="w-12 sm:w-14 h-7 sm:h-8 rounded-full bg-slate-700">
                          <div className="w-5 sm:w-6 h-5 sm:h-6 bg-gray-500 rounded-full shadow-md transform mt-1 translate-x-1"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {preferencesSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                      <p className="text-green-400 text-xs sm:text-sm flex items-center gap-2">
                        <span>✅</span> {preferencesSuccess}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-sm sm:text-base"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="text-purple-400">🔐</span>
                    <span className="text-base sm:text-2xl">Security Settings</span>
                  </h2>

                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>🔑</span> Change Password
                    </h3>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          minLength={8}
                          maxLength={72}
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base"
                        />
                        <p className="text-xs text-gray-500 mt-1">At least 8 characters with a number or special character</p>
                      </div>

                      <div>
                        <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          minLength={8}
                          maxLength={72}
                          className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base"
                        />
                      </div>

                      {passwordError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                          <p className="text-red-400 text-xs sm:text-sm flex items-center gap-2">
                            <span>❌</span> {passwordError}
                          </p>
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                          <p className="text-green-400 text-xs sm:text-sm flex items-center gap-2">
                            <span>✅</span> {passwordSuccess}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-sm sm:text-base"
                      >
                        {saving ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Changing...
                          </span>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>🖥️</span> Login Sessions
                    </h3>
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">You are currently logged in on this device.</p>
                    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-white font-semibold text-sm sm:text-base">Current Session</p>
                          <p className="text-xs sm:text-sm text-gray-400">Last active: Just now</p>
                        </div>
                        <span className="px-2 sm:px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                          ✓ Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="text-purple-400">📊</span>
                    <span className="text-base sm:text-2xl">Account Management</span>
                  </h2>

                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>ℹ️</span> Account Information
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {/* Account ID with Reveal */}
                      <div className="flex flex-col sm:flex-row justify-between py-2 border-b border-white/10 gap-2">
                        <span className="text-gray-400 text-sm sm:text-base">Account ID</span>
                        <div className="flex items-center gap-2">
                          {showAccountId ? (
                            <span className="text-white font-mono text-xs sm:text-sm bg-slate-900/50 px-2 py-1 rounded break-all">
                              {user?.id}
                            </span>
                          ) : (
                            <span className="text-white font-mono text-xs sm:text-sm bg-slate-900/50 px-2 py-1 rounded">
                              ••••••••-••••-••••-••••-••••••••••••
                            </span>
                          )}
                          <button
                            onClick={() => setShowAccountId(!showAccountId)}
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all duration-300 border border-purple-500/30"
                            title={showAccountId ? 'Hide Account ID' : 'Show Account ID'}
                          >
                            {showAccountId ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between py-2 border-b border-white/10 gap-1">
                        <span className="text-gray-400 text-sm sm:text-base">Email</span>
                        <span className="text-white text-sm sm:text-base break-all">{user?.email}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between py-2 border-b border-white/10 gap-1">
                        <span className="text-gray-400 text-sm sm:text-base">Account Type</span>
                        <span className="text-white capitalize text-sm sm:text-base">{profile?.role}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between py-2 gap-1">
                        <span className="text-gray-400 text-sm sm:text-base">Created</span>
                        <span className="text-white text-sm sm:text-base">{new Date(profile?.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-blue-500/30 transition-all duration-300">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>📦</span> Export Your Data
                    </h3>
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">
                      Download a copy of your account data including your profile, orders, and messages.
                    </p>
                    <button
                      onClick={() => showAlert('Coming Soon', 'Data export feature coming soon!')}
                      className="w-full sm:w-auto bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 border border-blue-500/30 hover:scale-105 text-sm sm:text-base"
                    >
                      📥 Request Data Export
                    </button>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <span>⚠️</span> Danger Zone
                    </h3>
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">
                      Once you delete your account, there is no going back. This action is permanent and will remove all your data.
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 border border-red-500/30 text-sm sm:text-base"
                      >
                        🗑️ Delete Account
                      </button>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-red-400 font-semibold mb-2 text-sm sm:text-base">
                            Type DELETE to confirm
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-red-500 focus:outline-none placeholder-red-400/50 text-sm sm:text-base"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={saving || deleteConfirmText !== 'DELETE'}
                            className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                          >
                            {saving ? 'Deleting...' : '⚠️ Permanently Delete Account'}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmText('')
                            }}
                            className="w-full sm:w-auto bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base"
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
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-6 sm:py-8 mt-8 sm:mt-12">
          <div className="container mx-auto px-3 sm:px-4 text-center text-gray-500 text-xs sm:text-sm">
            <p>&copy; 2024 Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        /* Hide scrollbar for horizontal tabs on mobile */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes shooting {
          0%, 100% { opacity: 0; transform: translateX(0) rotate(-45deg); }
          50% { opacity: 0.3; transform: translateX(100px) rotate(-45deg); }
        }
      `}</style>
    </div>
  )
}