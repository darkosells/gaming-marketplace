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
            <p className="text-gray-400">Last updated December 4, 2025</p>
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
                  Our Website uses a combination of <strong className="text-white">local storage</strong> (localStorage) for our own functionality and <strong className="text-white">third-party cookies</strong> from integrated services like Trustpilot, Google Analytics, and payment processors.
                </p>
              </section>

              {/* What We Store */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">What We Store and Why</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use local storage and server-side storage for the following purposes:
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
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 mb-6">
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

                {/* Security & Fraud Prevention Data */}
                <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30 mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3">4. 🛡️ Security &amp; Fraud Prevention Data</h3>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Purpose:</strong> To protect our platform and users from fraud, unauthorized access, and abuse, we collect and store certain security-related information on our servers.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Data Collected:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 ml-4">
                      <li><strong className="text-white">IP Address:</strong> Your public IP address at signup and each login</li>
                      <li><strong className="text-white">Device Fingerprint:</strong> A non-personally-identifiable hash generated from your browser characteristics (screen size, timezone, language, etc.)</li>
                      <li><strong className="text-white">Approximate Location:</strong> Country and city derived from your IP address</li>
                      <li><strong className="text-white">Login Timestamps:</strong> When you sign in to your account</li>
                      <li><strong className="text-white">Browser/Device Info:</strong> Browser name, operating system, device type</li>
                      <li><strong className="text-white">Network Indicators:</strong> VPN, proxy, or Tor detection</li>
                    </ul>
                    <p className="text-gray-300 mt-3">
                      <strong className="text-purple-400">Storage Location:</strong> This data is stored on our servers (Supabase), <strong>not</strong> in your browser&apos;s local storage or cookies.
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Duration:</strong> 12 months from collection date (see our <Link href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link> for full retention periods).
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Type:</strong> <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm">Strictly Necessary</span> - Required for platform security and fraud prevention.
                    </p>
                    <p className="text-gray-300 mt-3">
                      <strong className="text-purple-400">What is a Device Fingerprint?</strong> A device fingerprint is a unique identifier created by combining non-personal browser characteristics (like screen resolution, timezone, and language settings) into a hash. It does not contain your name, email, or other personal information. It helps us detect when the same device is used to create multiple accounts or when an unauthorized person tries to access your account from a new device.
                    </p>
                  </div>
                </div>
              </section>

              {/* Third-Party Cookies Section - NEW/UPDATED */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">Third-Party Cookies &amp; Services</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use third-party services that set their own cookies when you visit our website. Some of these cookies are set automatically when embedded widgets or scripts load.
                </p>

                {/* Trustpilot - NEW */}
                <div className="bg-green-900/20 rounded-xl p-6 border border-green-500/30 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">⭐ Trustpilot (Review Widget)</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    We display a Trustpilot widget in our footer to show our customer reviews. When this widget loads, Trustpilot and its partner services may set the following cookies:
                  </p>
                  
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50">
                          <th className="border border-white/10 p-2 text-left text-white">Cookie</th>
                          <th className="border border-white/10 p-2 text-left text-white">Provider</th>
                          <th className="border border-white/10 p-2 text-left text-white">Purpose</th>
                          <th className="border border-white/10 p-2 text-left text-white">Type</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">tp-b2b-refresh-token</code></td>
                          <td className="border border-white/10 p-2">Trustpilot</td>
                          <td className="border border-white/10 p-2">Session/token refresh for widget</td>
                          <td className="border border-white/10 p-2"><span className="bg-blue-500/20 text-blue-400 px-1 rounded text-xs">Functional</span></td>
                        </tr>
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">_iidt</code></td>
                          <td className="border border-white/10 p-2">Trustpilot</td>
                          <td className="border border-white/10 p-2">User identification for widget</td>
                          <td className="border border-white/10 p-2"><span className="bg-yellow-500/20 text-yellow-400 px-1 rounded text-xs">Analytics</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <a href="https://legal.trustpilot.com/for-everyone/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                    View Trustpilot Cookie Policy →
                  </a>
                </div>

                {/* Hotjar - NEW */}
                <div className="bg-orange-900/20 rounded-xl p-6 border border-orange-500/30 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">🔥 Hotjar (via Trustpilot)</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    The Trustpilot widget loads Hotjar for analytics and session recording. Hotjar helps understand how users interact with the widget. The following cookies may be set:
                  </p>
                  
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50">
                          <th className="border border-white/10 p-2 text-left text-white">Cookie</th>
                          <th className="border border-white/10 p-2 text-left text-white">Purpose</th>
                          <th className="border border-white/10 p-2 text-left text-white">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">_hjSessionUser_*</code></td>
                          <td className="border border-white/10 p-2">Identifies unique visitors across sessions</td>
                          <td className="border border-white/10 p-2">365 days</td>
                        </tr>
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">_hjHasCachedUserAttributes</code></td>
                          <td className="border border-white/10 p-2">Caches user attributes for performance</td>
                          <td className="border border-white/10 p-2">Session</td>
                        </tr>
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">_hjDonePolls</code></td>
                          <td className="border border-white/10 p-2">Tracks completed feedback polls</td>
                          <td className="border border-white/10 p-2">365 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">
                    <strong>Note:</strong> These cookies are set by Trustpilot&apos;s widget, not directly by Nashflare.
                  </p>
                  <a href="https://www.hotjar.com/legal/policies/cookie-information/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                    View Hotjar Cookie Policy →
                  </a>
                </div>

                {/* Google Ads - NEW */}
                <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">📢 Google Advertising (via Trustpilot)</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    The Trustpilot widget may load Google advertising cookies. These are used by Google for ad personalization and measurement. <strong className="text-white">Nashflare does not run ads or use this data</strong> - these cookies are set by Trustpilot&apos;s integration.
                  </p>
                  
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50">
                          <th className="border border-white/10 p-2 text-left text-white">Cookie</th>
                          <th className="border border-white/10 p-2 text-left text-white">Purpose</th>
                          <th className="border border-white/10 p-2 text-left text-white">Type</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">__gads</code></td>
                          <td className="border border-white/10 p-2">Google ad serving and frequency capping</td>
                          <td className="border border-white/10 p-2"><span className="bg-red-500/20 text-red-400 px-1 rounded text-xs">Advertising</span></td>
                        </tr>
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">__gpi</code></td>
                          <td className="border border-white/10 p-2">Google Publisher ID for ad targeting</td>
                          <td className="border border-white/10 p-2"><span className="bg-red-500/20 text-red-400 px-1 rounded text-xs">Advertising</span></td>
                        </tr>
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">__eoi</code></td>
                          <td className="border border-white/10 p-2">Google ad optimization identifier</td>
                          <td className="border border-white/10 p-2"><span className="bg-red-500/20 text-red-400 px-1 rounded text-xs">Advertising</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                    View Google Cookie Policy →
                  </a>
                </div>

                {/* OneTrust/Optanon - NEW */}
                <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">🔒 OneTrust (Consent Management via Trustpilot)</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Trustpilot uses OneTrust for cookie consent management. These cookies remember your consent preferences:
                  </p>
                  
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50">
                          <th className="border border-white/10 p-2 text-left text-white">Cookie</th>
                          <th className="border border-white/10 p-2 text-left text-white">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">OptanonConsent</code></td>
                          <td className="border border-white/10 p-2">Stores your cookie consent preferences</td>
                        </tr>
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">OptanonAlertBoxClosed</code></td>
                          <td className="border border-white/10 p-2">Tracks if consent banner was closed</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Google Analytics */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">📊 Google Analytics</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    We use Google Analytics to understand how visitors use our website. This helps us improve the user experience.
                  </p>
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50">
                          <th className="border border-white/10 p-2 text-left text-white">Cookie</th>
                          <th className="border border-white/10 p-2 text-left text-white">Purpose</th>
                          <th className="border border-white/10 p-2 text-left text-white">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">_ga</code></td>
                          <td className="border border-white/10 p-2">Distinguishes unique users</td>
                          <td className="border border-white/10 p-2">2 years</td>
                        </tr>
                        <tr>
                          <td className="border border-white/10 p-2"><code className="text-xs">_ga_*</code></td>
                          <td className="border border-white/10 p-2">Maintains session state</td>
                          <td className="border border-white/10 p-2">2 years</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                    View Google Privacy Policy →
                  </a>
                </div>

                {/* Supabase */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Supabase (Authentication &amp; Database)</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Supabase stores authentication tokens in your browser&apos;s local storage to maintain your session. This is essential for keeping you logged in.
                  </p>
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                    View Supabase Privacy Policy →
                  </a>
                </div>

                {/* Stripe */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Stripe (Payment Processing)</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    When you make a purchase, Stripe may use cookies for fraud prevention and to process your payment securely. We do not store any payment card information on our servers.
                  </p>
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                    View Stripe Privacy Policy →
                  </a>
                </div>

                {/* IP Geolocation */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-2">IP Geolocation Services</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    We use IP geolocation APIs to determine your approximate location from your IP address. This is used for fraud detection (e.g., detecting logins from unusual locations). No cookies are stored by these services.
                  </p>
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
                    <h3 className="text-xl font-semibold text-white mb-3">Opting Out of Third-Party Cookies</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      You can opt out of specific third-party tracking:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                      <li><strong className="text-white">Google Analytics:</strong> Install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Google Analytics Opt-out Browser Add-on</a></li>
                      <li><strong className="text-white">Google Ads:</strong> Visit <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Google Ads Settings</a> to manage preferences</li>
                      <li><strong className="text-white">Hotjar:</strong> Visit <a href="https://www.hotjar.com/legal/compliance/opt-out" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Hotjar Opt-out</a></li>
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
                    <h3 className="text-xl font-semibold text-white mb-3">Security Data</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      Security and fraud prevention data (IP addresses, device fingerprints, login history) is stored on our servers, not in your browser. This data cannot be cleared through browser settings. To request deletion of this data, please contact us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      <strong className="text-white">Note:</strong> Some security data may be retained for legal compliance even after your request, as outlined in our <Link href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Impact of Disabling Cookies</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Please note that if you disable cookies or clear local storage, you may experience the following:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 mt-4">
                      <li>You will be logged out and need to sign in again</li>
                      <li>Your shopping cart will be emptied</li>
                      <li>Your theme and notification preferences will be reset to defaults</li>
                      <li>The Trustpilot review widget may not display properly</li>
                      <li>Some features of the website may not function properly</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Categories */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">Categories of Cookies We Use</h2>
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
                          <strong className="text-white">Security</strong>
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          Fraud prevention, risk assessment, abuse detection
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
                          Google Analytics, Hotjar (via Trustpilot) - understanding site usage
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-sm">Optional</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-white/10 p-4 text-gray-300">
                          <strong className="text-white">Advertising</strong>
                        </td>
                        <td className="border border-white/10 p-4 text-gray-300">
                          Google Ads cookies (via Trustpilot widget) - ad personalization
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
            © 2025 Nashflare. All rights reserved.
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