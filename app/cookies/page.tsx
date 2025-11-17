'use client'

import Link from 'next/link'

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900">
      {/* Cosmic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <span className="text-xl font-bold text-white">Nashflare</span>
            </Link>
            <Link 
              href="/"
              className="text-gray-400 hover:text-white transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Cookie Policy</h1>
            <p className="text-gray-400">Last updated November 26, 2024</p>
          </div>

          {/* Main Content Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="prose prose-invert prose-purple max-w-none">
              
              {/* Introduction */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  This Cookie Policy explains how Nashflare LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and similar technologies when you visit our website at https://www.nashflare.com (the &quot;Website&quot;). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  By using our Website, you consent to the use of cookies and similar technologies in accordance with this Cookie Policy. If you do not agree to our use of cookies, you can set your browser to refuse cookies or indicate when a cookie is being sent. However, please note that some features of our Website may not function properly without them.
                </p>
              </section>

              {/* What Are Cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies and Similar Technologies?</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">Cookies</strong> are small text files that are placed on your computer or mobile device by websites you visit. They are widely used to make websites work more efficiently and provide information to website owners.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">Local Storage</strong> is similar to cookies but allows websites to store larger amounts of data locally within your browser. Unlike cookies, local storage data is not sent to the server with every request, making it more efficient for storing user preferences and session data.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Our Website primarily uses <strong className="text-white">local storage</strong> (localStorage) rather than traditional browser cookies to store information. This is a more modern approach that offers better performance and security for our users.
                </p>
              </section>

              {/* What We Store */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">What We Store and Why</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use local storage for the following essential purposes:
                </p>

                {/* Auth Storage */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3">1. Authentication Session Data</h3>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Key:</strong> <code className="bg-slate-800 px-2 py-1 rounded text-sm">sb-[project-ref]-auth-token</code>
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Purpose:</strong> Stores your authentication session information provided by Supabase, our authentication provider. This keeps you logged in as you navigate between pages and return to our site.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Duration:</strong> Session-based. Cleared when you log out or when the session expires.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Type:</strong> Strictly Necessary - Required for the website to function properly.
                    </p>
                  </div>
                </div>

                {/* Cart Storage */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3">2. Shopping Cart Data</h3>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Key:</strong> <code className="bg-slate-800 px-2 py-1 rounded text-sm">cart</code>
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Purpose:</strong> Stores information about items you&apos;ve added to your shopping cart. This allows your cart to persist even if you close your browser or navigate away from the site.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Data Stored:</strong> Listing ID, quantity, price, seller information, and product details.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Duration:</strong> Persistent until you complete your purchase or manually clear your cart.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Type:</strong> Functional - Enhances user experience but not strictly necessary.
                    </p>
                  </div>
                </div>

                {/* Preferences Storage */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                  <h3 className="text-xl font-semibold text-white mb-3">3. User Preferences</h3>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Keys:</strong> Theme preferences, notification settings
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Purpose:</strong> Stores your display preferences such as theme settings (dark/light mode) and notification preferences to provide a personalized experience.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Duration:</strong> Persistent until you change your preferences or clear browser data.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Type:</strong> Functional - Enhances user experience.
                    </p>
                  </div>
                </div>
              </section>

              {/* Third-Party Services */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use the following third-party services that may store their own cookies or local storage data:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                    <h3 className="text-lg font-semibold text-white mb-2">Supabase (Authentication &amp; Database)</h3>
                    <p className="text-gray-300 text-sm mb-2">
                      Supabase stores authentication tokens in your browser&apos;s local storage to maintain your session. This is essential for keeping you logged in.
                    </p>
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Supabase Privacy Policy →
                    </a>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                    <h3 className="text-lg font-semibold text-white mb-2">Stripe (Payment Processing)</h3>
                    <p className="text-gray-300 text-sm mb-2">
                      When you make a purchase, Stripe may use cookies for fraud prevention and to process your payment securely. We do not store any payment card information on our servers.
                    </p>
                    <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Stripe Privacy Policy →
                    </a>
                  </div>
                </div>
              </section>

              {/* Your Choices */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">Your Choices and Control</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You have several options for controlling how we use cookies and similar technologies:
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Browser Settings</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      You can set your browser to refuse all cookies or to indicate when a cookie is being sent. You can also clear your browser&apos;s local storage at any time. Here&apos;s how to do it in popular browsers:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                      <li><strong className="text-white">Chrome:</strong> Settings → Privacy and Security → Clear browsing data</li>
                      <li><strong className="text-white">Firefox:</strong> Options → Privacy &amp; Security → Clear Data</li>
                      <li><strong className="text-white">Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                      <li><strong className="text-white">Edge:</strong> Settings → Privacy, search, and services → Clear browsing data</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Clearing Specific Data</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      To clear specific local storage data for Nashflare:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-300">
                      <li>Open your browser&apos;s Developer Tools (F12 or Right-click → Inspect)</li>
                      <li>Go to the &quot;Application&quot; or &quot;Storage&quot; tab</li>
                      <li>Find &quot;Local Storage&quot; in the sidebar</li>
                      <li>Click on our domain (nashflare.com)</li>
                      <li>Select and delete specific items or clear all</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Impact of Disabling Storage</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Please note that if you disable cookies or clear local storage, you may experience the following:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 mt-4">
                      <li>You will be logged out and need to sign in again</li>
                      <li>Your shopping cart will be emptied</li>
                      <li>Your theme and notification preferences will be reset to defaults</li>
                      <li>Some features of the website may not function properly</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Categories */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">Categories of Storage We Use</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-900/50">
                        <th className="border border-white/10 p-4 text-left text-white">Category</th>
                        <th className="border border-white/10 p-4 text-left text-white">Purpose</th>
                        <th className="border border-white/10 p-4 text-left text-white">Required?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-white/10 p-4 text-gray-300">
                          <strong className="text-white">Strictly Necessary</strong>
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          Authentication, security, and core site functionality
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">Yes</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-white/10 p-4 text-gray-300">
                          <strong className="text-white">Functional</strong>
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          Shopping cart, user preferences, personalization
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-sm">Recommended</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-white/10 p-4 text-gray-300">
                          <strong className="text-white">Analytics</strong>
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          Understanding how users interact with our site (if implemented)
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-sm">Optional</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Updates */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">Updates to This Policy</h2>
                <p className="text-gray-300 leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. The updated version will be indicated by an updated &quot;Last updated&quot; date at the top of this page. We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies and similar technologies.
                </p>
              </section>

              {/* Contact */}
              <section className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
                </p>
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                  <p className="text-white font-semibold mb-2">Nashflare LLC</p>
                  <p className="text-gray-300">7901 4th St N STE 300</p>
                  <p className="text-gray-300">St. Petersburg, FL 33702</p>
                  <p className="text-gray-300">United States</p>
                  <p className="text-gray-300 mt-2">Email: <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a></p>
                  <p className="text-gray-300">Phone: <a href="tel:1-813-434-7657" className="text-purple-400 hover:text-purple-300">1-813-434-7657</a></p>
                </div>
              </section>

            </div>
          </div>

          {/* Back to Top */}
          <div className="text-center mt-8">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-purple-400 hover:text-purple-300 transition"
            >
              ↑ Back to Top
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950/80 border-t border-white/5 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            &copy; 2024 Nashflare. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition">Terms of Service</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition">Privacy Policy</Link>
            <Link href="/cookies" className="text-purple-400 hover:text-purple-300 text-sm transition">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}