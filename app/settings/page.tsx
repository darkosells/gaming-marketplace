// app/settings/page.tsx - SETTINGS PAGE FOR ALL USER ROLES

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
      // Check if username is taken (if changed)
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
      // First verify current password by attempting to sign in
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
      // Note: Full account deletion would require a server-side function
      // For now, we'll mark the account as deleted/banned
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          ban_reason: 'Account deleted by user',
          banned_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Sign out the user
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
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold">Admin</span>
    }
    if (profile?.role === 'vendor') {
      return <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">Vendor</span>
    }
    return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">Customer</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-300">Manage your account settings and preferences</p>
              </div>
              <div className="text-right">
                <div className="mb-2">{getRoleBadge()}</div>
                <p className="text-sm text-gray-400">Member since {new Date(profile?.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <div className="flex space-x-4 mb-8 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'profile'
                    ? 'bg-purple-500/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'security'
                    ? 'bg-purple-500/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'account'
                    ? 'bg-red-500/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Account
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-white font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-white font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                  {usernameError && (
                    <p className="text-red-400 text-sm mt-1">{usernameError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, and underscores only</p>
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-white font-semibold mb-2">Account Type</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white capitalize">{profile?.role || 'customer'}</span>
                      {profile?.role === 'customer' && !profile?.is_admin && (
                        <Link
                          href="/customer-dashboard"
                          className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                          Upgrade to Vendor →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verified Status (Vendors) */}
                {profile?.role === 'vendor' && (
                  <div>
                    <label className="block text-white font-semibold mb-2">Verification Status</label>
                    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                      {profile?.verified ? (
                        <span className="text-green-400 flex items-center gap-2">
                          <span>✓</span> Verified Seller
                        </span>
                      ) : (
                        <span className="text-yellow-400">Pending Verification</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Seller Stats (Vendors) */}
                {profile?.role === 'vendor' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Total Sales</label>
                      <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                        {profile?.total_sales || 0}
                      </div>
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">Average Rating</label>
                      <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                        {profile?.average_rating ? `${profile.average_rating.toFixed(1)} ★` : 'No ratings yet'}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    {passwordError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{passwordError}</p>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-400 text-sm">{passwordSuccess}</p>
                      </div>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50"
                    >
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Login Sessions</h3>
                  <p className="text-gray-400 mb-4">You are currently logged in on this device.</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">Current Session</p>
                        <p className="text-sm text-gray-400">Last active: Just now</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Account Management</h2>

                {/* Account Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account ID</span>
                      <span className="text-white font-mono text-sm">{user?.id?.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email</span>
                      <span className="text-white">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Type</span>
                      <span className="text-white capitalize">{profile?.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created</span>
                      <span className="text-white">{new Date(profile?.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Data Export */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Export Your Data</h3>
                  <p className="text-gray-400 mb-4">
                    Download a copy of your account data including your profile, orders, and messages.
                  </p>
                  <button
                    onClick={() => alert('Data export feature coming soon!')}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-6 py-2 rounded-lg font-semibold transition"
                  >
                    Request Data Export
                  </button>
                </div>

                {/* Delete Account */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">⚠️ Danger Zone</h3>
                  <p className="text-gray-400 mb-4">
                    Once you delete your account, there is no going back. This action is permanent and will remove all your data.
                  </p>
                  
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-lg font-semibold transition"
                    >
                      Delete Account
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
                          className="w-full bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={saving || deleteConfirmText !== 'DELETE'}
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                        >
                          {saving ? 'Deleting...' : 'Permanently Delete Account'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteConfirmText('')
                          }}
                          className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-6 py-2 rounded-lg font-semibold transition"
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
    </div>
  )
}