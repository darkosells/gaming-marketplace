export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Gaming Marketplace
          </h1>
          <p className="text-xl mb-8">
            Buy & Sell Gaming Accounts, Top-Ups, and Game Keys
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Browse Listings
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          What Are You Looking For?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Gaming Accounts */}
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-xl font-bold mb-2">Gaming Accounts</h3>
            <p className="text-gray-600">High-level accounts with rare items and achievements</p>
          </div>

          {/* Top-Ups */}
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Top-Ups & Currency</h3>
            <p className="text-gray-600">In-game currency and credits for your favorite games</p>
          </div>

          {/* Game Keys */}
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-xl font-bold mb-2">Game Keys</h3>
            <p className="text-gray-600">CD keys and activation codes for PC and console</p>
          </div>
        </div>
      </div>
    </div>
  )
}