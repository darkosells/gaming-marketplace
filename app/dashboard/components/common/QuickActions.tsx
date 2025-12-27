import Link from 'next/link'

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      <Link
        href="/sell"
        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
          <span className="text-xl sm:text-2xl lg:text-3xl">📝</span>
        </div>
        <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors text-center sm:text-left">Create Listing</h3>
        <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm hidden sm:block">List a new item for sale on the marketplace</p>
      </Link>
      
      <Link
        href="/messages"
        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
          <span className="text-xl sm:text-2xl lg:text-3xl">💬</span>
        </div>
        <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors text-center sm:text-left">Messages</h3>
        <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm hidden sm:block">Chat with your buyers and manage orders</p>
      </Link>
      
      {/* Boosting Quick Action - UPDATED PATH */}
      <Link
        href="/boosting/vendor/marketplace"
        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-cyan-500/50 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
      >
        {/* Subtle gradient background for emphasis */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative">
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
            <span className="text-xl sm:text-2xl lg:text-3xl">🚀</span>
          </div>
          <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-cyan-400 transition-colors text-center sm:text-left">Boosting</h3>
          <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm hidden sm:block">Offer rank boosting services to gamers</p>
        </div>
      </Link>
      
      <Link
        href="/browse"
        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
          <span className="text-xl sm:text-2xl lg:text-3xl">🎮</span>
        </div>
        <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors text-center sm:text-left">Browse</h3>
        <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm hidden sm:block">Explore the marketplace and see competition</p>
      </Link>
    </div>
  )
}