'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function CustomerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [verificationStatus, setVerificationStatus] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    checkCart()
    const handleStorageChange = () => checkCart()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cart-updated', handleStorageChange)
    return () => { window.removeEventListener('storage', handleStorageChange); window.removeEventListener('cart-updated', handleStorageChange) }
  }, [])

  const checkCart = () => { const cart = localStorage.getItem('cart'); setCartItemCount(cart ? 1 : 0) }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    if (profileData?.role === 'vendor') { router.push('/dashboard'); return }
    await fetchMyOrders(user.id)
    await fetchVerificationStatus(user.id)
    setLoading(false)
  }

  const fetchMyOrders = async (userId: string) => {
    const { data } = await supabase.from('orders').select('*, listing:listings(title, game, image_url, category)').eq('buyer_id', userId).order('created_at', { ascending: false })
    setMyOrders(data || [])
  }

  const fetchVerificationStatus = async (userId: string) => {
    const { data } = await supabase.from('vendor_verifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
    setVerificationStatus(data)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-white text-xl">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10 relative z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2"><div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center"><span className="text-2xl">🎮</span></div><span className="text-xl font-bold text-white">GameVault</span></Link>
            <div className="flex items-center space-x-4">
              <Link href="/browse" className="text-gray-300 hover:text-white transition">Browse</Link>
              <Link href="/cart" className="relative text-gray-300 hover:text-white transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>{cartItemCount > 0 && (<span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{cartItemCount}</span>)}</Link>
              <div className="relative group z-[9999]"><button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"><div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"><span className="text-white font-semibold text-sm">{profile?.username?.charAt(0).toUpperCase() || 'U'}</span></div><span className="text-white">{profile?.username || 'Account'}</span></button><div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[9999]"><Link href="/customer-dashboard" className="block px-4 py-3 text-white hover:bg-white/10 rounded-t-lg">My Account</Link><button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 rounded-b-lg">Logout</button></div></div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome, {profile?.username}! 👋</h1>
            <p className="text-gray-400 mb-4">Email: {user?.email}</p>
            <div className="flex items-center gap-2"><span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-semibold">Customer Account</span></div>
          </div>

          {/* Verification Status Section */}
          {verificationStatus && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Vendor Application Status</h2>
              {verificationStatus.status === 'pending' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4"><div className="text-4xl">⏳</div><div><h3 className="text-xl font-bold text-yellow-400">Application Under Review</h3><p className="text-gray-300">Submitted on {new Date(verificationStatus.created_at).toLocaleDateString()}</p></div></div>
                  <p className="text-gray-400">Your vendor application is being reviewed. This typically takes 1-3 business days.</p>
                </div>
              )}
              {verificationStatus.status === 'approved' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4"><div className="text-4xl">✅</div><div><h3 className="text-xl font-bold text-green-400">Application Approved!</h3><p className="text-gray-300">Approved on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p></div></div>
                  <p className="text-gray-400 mb-4">Congratulations! You are now a verified vendor.</p>
                  <Link href="/dashboard" className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">Go to Vendor Dashboard →</Link>
                </div>
              )}
              {verificationStatus.status === 'rejected' && verificationStatus.can_resubmit && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4"><div className="text-4xl">🔄</div><div><h3 className="text-xl font-bold text-yellow-400">Resubmission Required</h3><p className="text-gray-300">Reviewed on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p></div></div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                    <h4 className="text-white font-semibold mb-2">What needs to be fixed:</h4>
                    <div className="flex flex-wrap gap-2 mb-3">{verificationStatus.resubmission_fields?.map((field: string) => (<span key={field} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">{field.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>))}</div>
                    <div className="bg-black/20 rounded-lg p-3"><p className="text-white text-sm whitespace-pre-wrap">{verificationStatus.resubmission_instructions}</p></div>
                  </div>
                  <p className="text-gray-400 mb-4">Please review the instructions and submit a new application.</p>
                  <Link href="/become-vendor" className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">🔄 Submit New Application</Link>
                </div>
              )}
              {verificationStatus.status === 'rejected' && !verificationStatus.can_resubmit && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4"><div className="text-4xl">🚫</div><div><h3 className="text-xl font-bold text-red-400">Application Rejected</h3><p className="text-gray-300">Reviewed on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p></div></div>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-4"><h4 className="text-red-400 font-semibold mb-2">Reason:</h4><p className="text-white">{verificationStatus.rejection_reason}</p></div>
                  <p className="text-gray-400">Your application has been permanently rejected. Contact support if you believe this was an error.</p>
                  <a href="mailto:support@gamevault.com" className="inline-block mt-4 text-purple-400 hover:text-purple-300 underline">Contact Support</a>
                </div>
              )}
            </div>
          )}

          {/* Become Vendor CTA - Show only if no pending/approved verification */}
          {(!verificationStatus || (verificationStatus.status === 'rejected' && verificationStatus.can_resubmit)) && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div><h3 className="text-xl font-bold text-white mb-2">Want to Sell on GameVault?</h3><p className="text-gray-300">{verificationStatus?.can_resubmit ? 'Fix the issues and resubmit your application.' : 'Become a verified vendor and start earning money.'}</p></div>
                <Link href="/become-vendor" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition whitespace-nowrap">{verificationStatus?.can_resubmit ? '🔄 Resubmit' : '🚀 Become a Vendor'}</Link>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"><div className="text-3xl mb-2">🛒</div><h3 className="text-white font-semibold mb-1">Total Orders</h3><p className="text-3xl font-bold text-white">{myOrders.length}</p></div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"><div className="text-3xl mb-2">⏳</div><h3 className="text-white font-semibold mb-1">Pending</h3><p className="text-3xl font-bold text-white">{myOrders.filter(o => o.status === 'pending').length}</p></div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"><div className="text-3xl mb-2">✅</div><h3 className="text-white font-semibold mb-1">Completed</h3><p className="text-3xl font-bold text-white">{myOrders.filter(o => o.status === 'completed').length}</p></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link href="/browse" className="group"><div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition"><div className="text-4xl mb-3 group-hover:scale-110 transition">🔍</div><h3 className="text-lg font-bold text-white mb-1">Browse Marketplace</h3><p className="text-sm text-gray-400">Find gaming accounts and items</p></div></Link>
            <Link href="/messages" className="group"><div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition"><div className="text-4xl mb-3 group-hover:scale-110 transition">💬</div><h3 className="text-lg font-bold text-white mb-1">Messages</h3><p className="text-sm text-gray-400">Contact sellers</p></div></Link>
            <Link href="/customer-dashboard" className="group"><div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition"><div className="text-4xl mb-3 group-hover:scale-110 transition">⚙️</div><h3 className="text-lg font-bold text-white mb-1">Account Settings</h3><p className="text-sm text-gray-400">Manage your account</p></div></Link>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">My Orders</h2>
            {myOrders.length === 0 ? (
              <div className="text-center py-12"><div className="text-6xl mb-4">📭</div><p className="text-gray-400 mb-2">No orders yet</p><Link href="/browse" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">Browse Listings</Link></div>
            ) : (
              <div className="space-y-4">{myOrders.map((order) => (
                <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">{order.listing?.image_url ? (<img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center"><span className="text-3xl">{order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'topup' ? '💰' : '🔑'}</span></div>)}</div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{order.listing?.title || 'Unknown Item'}</h3>
                      <p className="text-gray-400">{order.listing?.game}</p>
                      <div className="flex items-center gap-4 mt-2"><span className="text-white font-bold">${parseFloat(order.amount).toFixed(2)}</span><span className="text-gray-500">Qty: {order.quantity}</span><span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' : order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{order.status?.toUpperCase()}</span></div>
                    </div>
                    <div className="text-right"><p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</p><Link href={`/messages`} className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">View Chat →</Link></div>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}