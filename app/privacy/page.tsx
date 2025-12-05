'use client'

import Link from 'next/link'

export default function PrivacyPolicy() {
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
            <Link href="/" className="text-gray-400 hover:text-white transition">
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-gray-400">Last updated December 4, 2025</p>
          </div>

          {/* Main Content Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="prose prose-invert prose-purple max-w-none">
              
              {/* Introduction */}
              <section className="mb-10">
                <p className="text-gray-300 leading-relaxed mb-4">
                  This Privacy Notice for Nashflare LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), describes how and why we might access, collect, store, use, and/or share (&quot;process&quot;) your personal information when you use our services (&quot;Services&quot;), including when you:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Visit our website at https://www.nashflare.com, or any website of ours that links to this Privacy Notice</li>
                  <li>Engage with us in other related ways, including any sales, marketing, or events</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white">Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>.
                </p>
              </section>

              {/* Summary Box */}
              <section className="mb-10">
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">SUMMARY OF KEY POINTS</h2>
                  <ul className="space-y-4 text-gray-300">
                    <li>
                      <strong className="text-white">What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.
                    </li>
                    <li>
                      <strong className="text-white">Do we process any sensitive personal information?</strong> We do not process sensitive personal information, except for vendor verification documents which are handled with extra security measures.
                    </li>
                    <li>
                      <strong className="text-white">Do we collect any information from third parties?</strong> We do not collect any information from third parties.
                    </li>
                    <li>
                      <strong className="text-white">How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.
                    </li>
                    <li>
                      <strong className="text-white">How do we keep your information safe?</strong> We use Supabase for secure data storage with row-level security policies and encrypted authentication tokens.
                    </li>
                    <li>
                      <strong className="text-white">What are your rights?</strong> Depending on where you are located geographically, you may have certain rights regarding your personal information.
                    </li>
                    <li>
                      <strong className="text-white">How do you exercise your rights?</strong> The easiest way to exercise your rights is by emailing us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Table of Contents */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">TABLE OF CONTENTS</h2>
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li><a href="#collect" className="text-purple-400 hover:text-purple-300 transition">WHAT INFORMATION DO WE COLLECT?</a></li>
                    <li><a href="#process" className="text-purple-400 hover:text-purple-300 transition">HOW DO WE PROCESS YOUR INFORMATION?</a></li>
                    <li><a href="#share" className="text-purple-400 hover:text-purple-300 transition">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
                    <li><a href="#third-party" className="text-purple-400 hover:text-purple-300 transition">THIRD-PARTY SERVICES WE USE</a></li>
                    <li><a href="#cookies" className="text-purple-400 hover:text-purple-300 transition">DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a></li>
                    <li><a href="#retain" className="text-purple-400 hover:text-purple-300 transition">HOW LONG DO WE KEEP YOUR INFORMATION?</a></li>
                    <li><a href="#safe" className="text-purple-400 hover:text-purple-300 transition">HOW DO WE KEEP YOUR INFORMATION SAFE?</a></li>
                    <li><a href="#minors" className="text-purple-400 hover:text-purple-300 transition">DO WE COLLECT INFORMATION FROM MINORS?</a></li>
                    <li><a href="#rights" className="text-purple-400 hover:text-purple-300 transition">WHAT ARE YOUR PRIVACY RIGHTS?</a></li>
                    <li><a href="#dnt" className="text-purple-400 hover:text-purple-300 transition">CONTROLS FOR DO-NOT-TRACK FEATURES</a></li>
                    <li><a href="#us" className="text-purple-400 hover:text-purple-300 transition">DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</a></li>
                    <li><a href="#updates" className="text-purple-400 hover:text-purple-300 transition">DO WE MAKE UPDATES TO THIS NOTICE?</a></li>
                    <li><a href="#contact" className="text-purple-400 hover:text-purple-300 transition">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></li>
                    <li><a href="#review" className="text-purple-400 hover:text-purple-300 transition">HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></li>
                  </ol>
                </div>
              </section>

              {/* Section 1 - WHAT INFORMATION DO WE COLLECT */}
              <section id="collect" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">1. WHAT INFORMATION DO WE COLLECT?</h2>
                <h3 className="text-xl font-semibold text-white mb-3">Personal information you disclose to us</h3>
                <p className="text-gray-400 italic mb-4">In Short: We collect personal information that you provide to us.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Names</li>
                  <li>Phone numbers</li>
                  <li>Email addresses</li>
                  <li>Mailing addresses</li>
                  <li>Usernames</li>
                  <li>Passwords (encrypted)</li>
                  <li>Billing addresses</li>
                  <li>Debit/credit card numbers (processed by Stripe, not stored by us)</li>
                </ul>

                <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-6 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Marketplace-Specific Data</h4>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    As a marketplace platform, we also collect:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong className="text-white">Listing Information:</strong> Product descriptions, images, prices, and categories you create</li>
                    <li><strong className="text-white">Transaction History:</strong> Orders placed, purchases made, payment amounts, and order status</li>
                    <li><strong className="text-white">Messages:</strong> Communications between buyers and sellers through our platform messaging system</li>
                    <li><strong className="text-white">Reviews and Ratings:</strong> Feedback you provide about transactions</li>
                    <li><strong className="text-white">Dispute Information:</strong> Details related to any disputes you file or respond to</li>
                    <li><strong className="text-white">Withdrawal Requests:</strong> Payment method preferences (Bitcoin addresses, Skrill accounts) for vendor payouts</li>
                  </ul>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-6 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Vendor Verification Data</h4>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    If you apply to become a verified vendor, we collect additional information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Government-issued ID (passport, driver&apos;s license, or national ID)</li>
                    <li>Selfie/photo for identity verification</li>
                    <li>Business information (if applicable)</li>
                    <li>Tax identification numbers (if required by law)</li>
                  </ul>
                  <p className="text-gray-300 leading-relaxed mt-3">
                    <strong className="text-white">Important:</strong> Vendor verification documents are stored securely in Supabase Storage with restricted access policies. Only authorized administrators can view these documents for verification purposes.
                  </p>
                </div>

                {/* Security & Fraud Prevention Data */}
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">🛡️ Security &amp; Fraud Prevention Data</h4>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    To protect our users and prevent fraudulent activity on our platform, we automatically collect the following information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong className="text-white">IP Address:</strong> Collected at signup and each login to detect suspicious activity and approximate geographic location</li>
                    <li><strong className="text-white">Approximate Location:</strong> Country, region, and city derived from your IP address (we do not use GPS or precise location)</li>
                    <li><strong className="text-white">Device Information:</strong> Browser type and version, operating system, screen resolution, language preferences, and timezone</li>
                    <li><strong className="text-white">Device Fingerprint:</strong> A non-personally-identifiable hash generated from your browser and device characteristics, used to detect multiple accounts or unauthorized access</li>
                    <li><strong className="text-white">Session Data:</strong> Login timestamps, session duration, and pages visited</li>
                    <li><strong className="text-white">Referral Source:</strong> The website or link that directed you to our platform</li>
                    <li><strong className="text-white">Network Indicators:</strong> Detection of VPN, proxy, or Tor usage for security purposes</li>
                  </ul>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    <strong className="text-white">Purpose:</strong> This data is used solely for fraud prevention, detecting unauthorized account access, identifying suspicious patterns, protecting our marketplace from abuse, and ensuring compliance with our Terms of Service. We do not sell this information or use it for advertising purposes.
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-2">
                    <strong className="text-white">Legal Basis:</strong> We collect this data under our legitimate interest in preventing fraud and protecting our users (GDPR Article 6(1)(f)).
                  </p>
                </div>

                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">Sensitive Information.</strong> We do not process sensitive personal information such as racial or ethnic origins, sexual orientation, or religious beliefs. However, government-issued IDs collected for vendor verification are handled with additional security measures.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by Stripe. You may find their privacy notice link(s) here: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">https://stripe.com/privacy</a>. We do not store your full credit card numbers on our servers.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">Information automatically collected</h3>
                <p className="text-gray-400 italic mb-4">In Short: Some information is collected automatically when you visit our Services.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Like many businesses, we also collect information through cookies and similar technologies (primarily localStorage). The information we collect includes log and usage data, device data, and location data. For more details, see our <Link href="/cookies" className="text-purple-400 hover:text-purple-300">Cookie Policy</Link>.
                </p>
              </section>

              {/* Section 2 - HOW DO WE PROCESS YOUR INFORMATION */}
              <section id="process" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li><strong className="text-white">To facilitate account creation and authentication</strong> and otherwise manage user accounts through Supabase Auth.</li>
                  <li><strong className="text-white">To deliver and facilitate delivery of services</strong> to the user, including processing marketplace transactions.</li>
                  <li><strong className="text-white">To respond to user inquiries/offer support</strong> to users.</li>
                  <li><strong className="text-white">To send administrative information</strong> to you, including order confirmations and dispute updates.</li>
                  <li><strong className="text-white">To fulfill and manage your orders,</strong> including escrow management and fund releases.</li>
                  <li><strong className="text-white">To enable user-to-user communications</strong> through our real-time messaging system.</li>
                  <li><strong className="text-white">To request feedback</strong> and enable reviews after completed transactions.</li>
                  <li><strong className="text-white">To protect our Services</strong> through fraud prevention and dispute resolution.</li>
                  <li><strong className="text-white">To verify vendor identities</strong> to ensure marketplace trust and safety.</li>
                  <li><strong className="text-white">To process vendor withdrawals</strong> and manage platform commission fees.</li>
                  <li><strong className="text-white">To identify usage trends</strong> and improve our Services.</li>
                  <li><strong className="text-white">To save or protect an individual&apos;s vital interest.</strong></li>
                  <li><strong className="text-white">To prevent fraud and abuse</strong> by analyzing login patterns, detecting multiple accounts from the same device or IP address, and identifying suspicious behavioral patterns.</li>
                  <li><strong className="text-white">To calculate risk assessments</strong> for accounts based on behavioral patterns to protect buyers and sellers from fraudulent transactions.</li>
                  <li><strong className="text-white">To detect related accounts</strong> that may share the same IP address or device fingerprint to prevent marketplace manipulation, fake reviews, and ban evasion.</li>
                  <li><strong className="text-white">To monitor for unauthorized access</strong> by detecting unusual login locations or devices that may indicate account compromise.</li>
                </ul>
              </section>

              {/* Section 3 - WHEN AND WITH WHOM DO WE SHARE */}
              <section id="share" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We may share information in specific situations described in this section and/or with the following third parties.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may need to share your personal information in the following situations:
                </p>
                
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Buyer-Seller Information Sharing</h4>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    As a marketplace platform, certain information is shared between transaction participants:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong className="text-white">Visible to Buyers:</strong> Seller username, profile avatar, seller rating, total sales, verification status, member since date</li>
                    <li><strong className="text-white">Visible to Sellers:</strong> Buyer username, order details, delivery address (if applicable)</li>
                    <li><strong className="text-white">NOT Shared:</strong> Email addresses, phone numbers, real names (unless voluntarily shared in messages), payment details, IP addresses, device information</li>
                  </ul>
                </div>

                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li><strong className="text-white">Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                  <li><strong className="text-white">Other Users.</strong> When you share personal information through messages or otherwise interact with public areas of the Services, such information may be viewed by other users and may be publicly made available outside the Services.</li>
                  <li><strong className="text-white">Third-Party Service Providers.</strong> We share data with service providers who assist us in operating our platform (see Section 4).</li>
                  <li><strong className="text-white">Legal Requirements.</strong> We may disclose information where required to do so by law or in response to valid requests by public authorities.</li>
                  <li><strong className="text-white">Fraud Prevention.</strong> We may share information with law enforcement or other parties when we believe in good faith that disclosure is necessary to prevent fraud, investigate violations of our Terms of Service, or protect the rights and safety of our users.</li>
                </ul>
              </section>

              {/* Section 4 - THIRD-PARTY SERVICES - UPDATED */}
              <section id="third-party" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">4. THIRD-PARTY SERVICES WE USE</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use the following third-party services to operate our platform. These services may collect data about you as described below:
                </p>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                    <h4 className="text-lg font-semibold text-white mb-2">Supabase (Authentication, Database, Storage)</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Supabase provides our core backend infrastructure including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm mb-2">
                      <li>User authentication and session management</li>
                      <li>PostgreSQL database for all user and transaction data</li>
                      <li>File storage for avatars and verification documents</li>
                      <li>Real-time subscriptions for messaging</li>
                    </ul>
                    <p className="text-gray-300 text-sm mb-2">
                      <strong className="text-white">Data Location:</strong> Your data is stored on Supabase servers in the United States.
                    </p>
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Supabase Privacy Policy →
                    </a>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                    <h4 className="text-lg font-semibold text-white mb-2">Stripe (Payment Processing)</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Stripe processes all payment transactions on our platform:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm mb-2">
                      <li>Credit/debit card processing</li>
                      <li>Fraud prevention and detection</li>
                      <li>PCI DSS compliant payment handling</li>
                    </ul>
                    <p className="text-gray-300 text-sm mb-2">
                      <strong className="text-white">Important:</strong> We do not store your full credit card information. All payment data is handled directly by Stripe.
                    </p>
                    <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Stripe Privacy Policy →
                    </a>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                    <h4 className="text-lg font-semibold text-white mb-2">Vercel (Hosting)</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Vercel hosts our web application and may collect:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm mb-2">
                      <li>Server logs (IP addresses, request times)</li>
                      <li>Performance metrics</li>
                    </ul>
                    <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Vercel Privacy Policy →
                    </a>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                    <h4 className="text-lg font-semibold text-white mb-2">Google Analytics</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      We use Google Analytics to understand how visitors use our website:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm mb-2">
                      <li>Page views and user behavior</li>
                      <li>Traffic sources and demographics</li>
                      <li>Session duration and bounce rates</li>
                    </ul>
                    <p className="text-gray-300 text-sm mb-2">
                      <strong className="text-white">Opt-out:</strong> You can opt out using the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Google Analytics Opt-out Browser Add-on</a>.
                    </p>
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Google Privacy Policy →
                    </a>
                  </div>

                  {/* Trustpilot - NEW */}
                  <div className="bg-green-900/20 rounded-xl p-6 border border-green-500/30">
                    <h4 className="text-lg font-semibold text-white mb-2">⭐ Trustpilot (Review Widget)</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      We display a Trustpilot widget to show customer reviews. The widget may collect:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm mb-2">
                      <li>Widget interaction data</li>
                      <li>Browser information</li>
                      <li>Cookies for session management</li>
                    </ul>
                    <p className="text-gray-300 text-sm mb-2">
                      <strong className="text-white">Important:</strong> The Trustpilot widget also loads third-party services (Hotjar, Google Ads) that may set their own cookies. See our <Link href="/cookies" className="text-purple-400 hover:text-purple-300">Cookie Policy</Link> for details.
                    </p>
                    <a href="https://legal.trustpilot.com/for-reviewers/end-user-privacy-terms" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Trustpilot Privacy Policy →
                    </a>
                  </div>

                  {/* Hotjar - NEW */}
                  <div className="bg-orange-900/20 rounded-xl p-6 border border-orange-500/30">
                    <h4 className="text-lg font-semibold text-white mb-2">🔥 Hotjar (via Trustpilot Widget)</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      The Trustpilot widget loads Hotjar analytics, which may collect:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm mb-2">
                      <li>Session recordings and heatmaps</li>
                      <li>User behavior analytics</li>
                      <li>Device and browser information</li>
                    </ul>
                    <p className="text-gray-300 text-sm mb-2">
                      <strong className="text-white">Note:</strong> This service is loaded by Trustpilot, not directly by Nashflare.
                    </p>
                    <p className="text-gray-300 text-sm mb-2">
                      <strong className="text-white">Opt-out:</strong> Visit <a href="https://www.hotjar.com/legal/compliance/opt-out" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Hotjar Opt-out</a>
                    </p>
                    <a href="https://www.hotjar.com/legal/policies/privacy/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Hotjar Privacy Policy →
                    </a>
                  </div>

                  {/* Google Ads - NEW */}
                  <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
                    <h4 className="text-lg font-semibold text-white mb-2">📢 Google Advertising (via Trustpilot Widget)</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      The Trustpilot widget may load Google advertising cookies. <strong className="text-white">Nashflare does not run ads</strong> - these are set by Trustpilot&apos;s integration and may be used for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm mb-2">
                      <li>Ad personalization across the web</li>
                      <li>Frequency capping</li>
                      <li>Ad measurement</li>
                    </ul>
                    <p className="text-gray-300 text-sm mb-2">
                      <strong className="text-white">Opt-out:</strong> Visit <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Google Ads Settings</a> to manage your preferences.
                    </p>
                    <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-sm">
                      View Google Ads Policy →
                    </a>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                    <h4 className="text-lg font-semibold text-white mb-2">IP Geolocation Services</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      We use IP geolocation services to determine approximate location from IP addresses for fraud prevention:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm mb-2">
                      <li>Country, region, and city detection</li>
                      <li>Timezone identification</li>
                      <li>VPN/proxy detection</li>
                    </ul>
                    <p className="text-gray-300 text-sm">
                      <strong className="text-white">Note:</strong> This data is used solely for security purposes and is not shared with third parties.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5 - COOKIES - UPDATED */}
              <section id="cookies" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We use localStorage for our own functionality and third-party cookies from integrated services.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use localStorage (similar to cookies) to gather information when you interact with our Services. This includes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li><strong className="text-white">Authentication Tokens:</strong> Supabase stores encrypted session tokens to keep you logged in</li>
                  <li><strong className="text-white">Shopping Cart:</strong> Your cart contents are stored locally until checkout</li>
                  <li><strong className="text-white">User Preferences:</strong> Theme settings and notification preferences</li>
                </ul>

                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-6 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">⚠️ Third-Party Cookies</h4>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Our website also uses third-party services that set their own cookies, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong className="text-white">Google Analytics:</strong> Analytics cookies for understanding site usage</li>
                    <li><strong className="text-white">Trustpilot Widget:</strong> Functional and analytics cookies</li>
                    <li><strong className="text-white">Hotjar (via Trustpilot):</strong> Session recording and analytics</li>
                    <li><strong className="text-white">Google Ads (via Trustpilot):</strong> Advertising cookies</li>
                    <li><strong className="text-white">Stripe:</strong> Fraud prevention cookies during checkout</li>
                  </ul>
                </div>

                <p className="text-gray-300 leading-relaxed">
                  For detailed information about all cookies and how to opt out, please see our <Link href="/cookies" className="text-purple-400 hover:text-purple-300">Cookie Policy</Link>.
                </p>
              </section>

              {/* Section 6 - DATA RETENTION */}
              <section id="retain" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">6. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
                
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Data Retention Periods</h4>
                  <ul className="space-y-3 text-gray-300">
                    <li>
                      <strong className="text-white">Account Information:</strong> Retained for the lifetime of your account plus <strong>3 years</strong> after account deletion (for legal compliance and dispute resolution)
                    </li>
                    <li>
                      <strong className="text-white">Transaction History:</strong> <strong>7 years</strong> (required for tax and financial record-keeping)
                    </li>
                    <li>
                      <strong className="text-white">Messages:</strong> <strong>2 years</strong> after the associated order is completed
                    </li>
                    <li>
                      <strong className="text-white">Dispute Records:</strong> <strong>5 years</strong> after resolution
                    </li>
                    <li>
                      <strong className="text-white">Vendor Verification Documents:</strong> <strong>3 years</strong> after vendor status ends or account deletion
                    </li>
                    <li>
                      <strong className="text-white">Reviews:</strong> Permanently retained (anonymized if account is deleted)
                    </li>
                    <li>
                      <strong className="text-white">Server Logs:</strong> <strong>90 days</strong> (rolling deletion)
                    </li>
                    <li>
                      <strong className="text-white">Login/Session History:</strong> <strong>12 months</strong> (rolling deletion)
                    </li>
                    <li>
                      <strong className="text-white">IP Addresses:</strong> <strong>12 months</strong> after collection
                    </li>
                    <li>
                      <strong className="text-white">Device Fingerprints:</strong> <strong>12 months</strong> after last login
                    </li>
                    <li>
                      <strong className="text-white">Fraud Flags &amp; Risk Assessments:</strong> <strong>5 years</strong> after account deletion (legal compliance)
                    </li>
                    <li>
                      <strong className="text-white">Related Account Records:</strong> <strong>5 years</strong> after detection
                    </li>
                  </ul>
                </div>

                <p className="text-gray-300 leading-relaxed">
                  When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
                </p>
              </section>

              {/* Section 7 - SECURITY */}
              <section id="safe" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">7. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We aim to protect your personal information through a system of organizational and technical security measures.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li><strong className="text-white">Row Level Security (RLS):</strong> Database policies ensure users can only access their own data</li>
                  <li><strong className="text-white">Encrypted Authentication:</strong> Passwords are hashed and authentication tokens are encrypted</li>
                  <li><strong className="text-white">Secure File Storage:</strong> Verification documents are stored with restricted access policies</li>
                  <li><strong className="text-white">HTTPS Encryption:</strong> All data in transit is encrypted using TLS</li>
                  <li><strong className="text-white">Payment Security:</strong> PCI DSS compliant payment processing through Stripe</li>
                  <li><strong className="text-white">Access Controls:</strong> Administrative access is limited and logged</li>
                  <li><strong className="text-white">Fraud Detection:</strong> Automated systems monitor for suspicious activity patterns</li>
                  <li><strong className="text-white">Audit Logging:</strong> Administrative actions are logged for accountability</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.
                </p>
              </section>

              {/* Section 8 - MINORS */}
              <section id="minors" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">8. DO WE COLLECT INFORMATION FROM MINORS?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We do not knowingly collect data from or market to children under 18 years of age.</p>
                <p className="text-gray-300 leading-relaxed">
                  We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>.
                </p>
              </section>

              {/* Section 9 - PRIVACY RIGHTS */}
              <section id="rights" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">9. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
                <p className="text-gray-400 italic mb-4">In Short: You may review, change, or terminate your account at any time.</p>
                <h3 className="text-xl font-semibold text-white mb-3">Account Information</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you would at any time like to review or change the information in your account or terminate your account, you can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Log in to your account settings and update your user account</li>
                  <li>Contact us using the contact information provided</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements (see Section 6 for retention periods).
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">Security Data Rights</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You may request access to the security data we have collected about you, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Your login history and associated IP addresses</li>
                  <li>Device fingerprints associated with your account</li>
                  <li>Any fraud flags or risk assessments on your account</li>
                  <li>Related account detections</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To request this information, contact us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">Third-Party Cookie Opt-Outs</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You can opt out of third-party tracking:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li><strong className="text-white">Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Install opt-out add-on</a></li>
                  <li><strong className="text-white">Google Ads:</strong> <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Manage ad settings</a></li>
                  <li><strong className="text-white">Hotjar:</strong> <a href="https://www.hotjar.com/legal/compliance/opt-out" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Opt out of Hotjar</a></li>
                </ul>

                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white">Cookies and similar technologies:</strong> You can set your browser to remove cookies and localStorage data. If you choose to remove this data, you may be logged out and your cart will be cleared. See our <Link href="/cookies" className="text-purple-400 hover:text-purple-300">Cookie Policy</Link> for more details.
                </p>
              </section>

              {/* Section 10 - DNT */}
              <section id="dnt" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">10. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
                <p className="text-gray-300 leading-relaxed">
                  Most web browsers and some mobile operating systems include a Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.
                </p>
              </section>

              {/* Section 11 - US RESIDENTS */}
              <section id="us" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">11. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
                <p className="text-gray-400 italic mb-4">In Short: If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Tennessee, Texas, Utah, or Virginia, you may have specific rights regarding your personal information.</p>
                
                <h3 className="text-xl font-semibold text-white mb-3">Your Rights</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You have rights under certain US state data protection laws. These rights include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Right to know whether or not we are processing your personal data</li>
                  <li>Right to access your personal data</li>
                  <li>Right to correct inaccuracies in your personal data</li>
                  <li>Right to request the deletion of your personal data</li>
                  <li>Right to obtain a copy of the personal data you previously shared with us</li>
                  <li>Right to non-discrimination for exercising your rights</li>
                  <li>Right to opt out of targeted advertising or data sales (we do not sell your data)</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">How to Exercise Your Rights</h3>
                <p className="text-gray-300 leading-relaxed">
                  To exercise these rights, you can contact us by emailing us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>, by mailing to 7901 4th St N STE 300, St. Petersburg, FL 33702, or by referring to the contact details at the bottom of this document. We will respond to your request within 45 days.
                </p>
              </section>

              {/* Section 12 - UPDATES */}
              <section id="updates" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">12. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
                <p className="text-gray-400 italic mb-4">In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>
                <p className="text-gray-300 leading-relaxed">
                  We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
                </p>
              </section>

              {/* Section 13 - CONTACT */}
              <section id="contact" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">13. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you have questions or comments about this notice, you may email us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a> or contact us by post at:
                </p>
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                  <p className="text-white font-semibold mb-2">Nashflare LLC</p>
                  <p className="text-gray-300">7901 4th St N STE 300</p>
                  <p className="text-gray-300">St. Petersburg, FL 33702</p>
                  <p className="text-gray-300">United States</p>
                  <p className="text-gray-300 mt-2">Phone: <a href="tel:1-813-434-7657" className="text-purple-400 hover:text-purple-300">1-813-434-7657</a></p>
                </div>
              </section>

              {/* Section 14 - REVIEW/UPDATE/DELETE */}
              <section id="review" className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">14. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
                <p className="text-gray-300 leading-relaxed">
                  Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please visit: <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>. We will respond to your request within 45 days.
                </p>
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
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300 text-sm transition">Privacy Policy</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}