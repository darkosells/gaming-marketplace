import type { Profile } from '../../types'

interface WelcomeSectionProps {
  profile: Profile | null
}

export default function WelcomeSection({ profile }: WelcomeSectionProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 hover:border-purple-500/30 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-block mb-3 sm:mb-4">
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium">
              🏪 Vendor Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Vendor Dashboard</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Welcome back, <span className="text-white font-semibold">{profile?.username}</span>! Manage your listings and sales here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.verified && (
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 text-blue-400 rounded-full text-xs sm:text-sm font-semibold border border-blue-500/30 flex items-center gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified Seller
            </span>
          )}
        </div>
      </div>
    </div>
  )
}