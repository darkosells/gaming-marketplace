'use client'

import Link from 'next/link'

export default function TermsOfService() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-gray-400">Last updated November 16, 2025</p>
          </div>

          {/* Main Content Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="prose prose-invert prose-purple max-w-none">
              
              {/* Agreement Section */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">AGREEMENT TO OUR LEGAL TERMS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We are Nashflare LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; &quot;our&quot;), a company registered in Florida, United States at 7901 4th St N STE 300, St. Petersburg, FL 33702.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We operate the website http://www.nashflare.com (the &quot;Site&quot;), as well as any other related products and services that refer or link to these legal terms (the &quot;Legal Terms&quot;) (collectively, the &quot;Services&quot;).
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nashflare provides a safe and easily accessible Marketplace for Gamers. Our offers range from gaming accounts, game keys, and in-game items to in-game currency and top-ups. You can contact us by phone at 1-813-434-7657, email at contact@nashflare.com, or by mail to 7901 4th St N STE 300, St. Petersburg, FL 33702, United States.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;you&quot;), and Nashflare LLC, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. <strong className="text-white">IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</strong>
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will become effective upon posting or notifying you by contact@nashflare.com, as stated in the email message. By continuing to use the Services after the effective date of any changes, you agree to be bound by the modified terms. The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We recommend that you print a copy of these Legal Terms for your records.
                </p>
              </section>

              {/* Table of Contents */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">TABLE OF CONTENTS</h2>
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li><a href="#services" className="text-purple-400 hover:text-purple-300 transition">OUR SERVICES</a></li>
                    <li><a href="#marketplace" className="text-purple-400 hover:text-purple-300 transition">MARKETPLACE RULES AND FEES</a></li>
                    <li><a href="#buyer-protection" className="text-purple-400 hover:text-purple-300 transition">BUYER PROTECTION AND ESCROW</a></li>
                    <li><a href="#seller-obligations" className="text-purple-400 hover:text-purple-300 transition">SELLER OBLIGATIONS</a></li>
                    <li><a href="#prohibited-items" className="text-purple-400 hover:text-purple-300 transition">PROHIBITED ITEMS AND ACTIVITIES</a></li>
                    <li><a href="#disputes" className="text-purple-400 hover:text-purple-300 transition">INTERNAL DISPUTE RESOLUTION</a></li>
                    <li><a href="#account-risks" className="text-purple-400 hover:text-purple-300 transition">ACCOUNT TRANSFER RISKS AND DISCLAIMERS</a></li>
                    <li><a href="#ip" className="text-purple-400 hover:text-purple-300 transition">INTELLECTUAL PROPERTY RIGHTS</a></li>
                    <li><a href="#representations" className="text-purple-400 hover:text-purple-300 transition">USER REPRESENTATIONS</a></li>
                    <li><a href="#registration" className="text-purple-400 hover:text-purple-300 transition">USER REGISTRATION</a></li>
                    <li><a href="#purchases" className="text-purple-400 hover:text-purple-300 transition">PURCHASES AND PAYMENT</a></li>
                    <li><a href="#refunds" className="text-purple-400 hover:text-purple-300 transition">REFUNDS AND BUYER PROTECTION POLICY</a></li>
                    <li><a href="#prohibited" className="text-purple-400 hover:text-purple-300 transition">PROHIBITED PLATFORM ACTIVITIES</a></li>
                    <li><a href="#ugc" className="text-purple-400 hover:text-purple-300 transition">USER GENERATED CONTRIBUTIONS</a></li>
                    <li><a href="#reviews" className="text-purple-400 hover:text-purple-300 transition">GUIDELINES FOR REVIEWS</a></li>
                    <li><a href="#privacy" className="text-purple-400 hover:text-purple-300 transition">PRIVACY POLICY</a></li>
                    <li><a href="#term" className="text-purple-400 hover:text-purple-300 transition">TERM AND TERMINATION</a></li>
                    <li><a href="#modifications" className="text-purple-400 hover:text-purple-300 transition">MODIFICATIONS AND INTERRUPTIONS</a></li>
                    <li><a href="#governing" className="text-purple-400 hover:text-purple-300 transition">GOVERNING LAW</a></li>
                    <li><a href="#legal-dispute" className="text-purple-400 hover:text-purple-300 transition">LEGAL DISPUTE RESOLUTION</a></li>
                    <li><a href="#disclaimer" className="text-purple-400 hover:text-purple-300 transition">DISCLAIMER</a></li>
                    <li><a href="#liability" className="text-purple-400 hover:text-purple-300 transition">LIMITATIONS OF LIABILITY</a></li>
                    <li><a href="#indemnification" className="text-purple-400 hover:text-purple-300 transition">INDEMNIFICATION</a></li>
                    <li><a href="#userdata" className="text-purple-400 hover:text-purple-300 transition">USER DATA</a></li>
                    <li><a href="#electronic" className="text-purple-400 hover:text-purple-300 transition">ELECTRONIC COMMUNICATIONS</a></li>
                    <li><a href="#california" className="text-purple-400 hover:text-purple-300 transition">CALIFORNIA USERS AND RESIDENTS</a></li>
                    <li><a href="#miscellaneous" className="text-purple-400 hover:text-purple-300 transition">MISCELLANEOUS</a></li>
                    <li><a href="#contact" className="text-purple-400 hover:text-purple-300 transition">CONTACT US</a></li>
                  </ol>
                </div>
              </section>

              {/* Section 1 */}
              <section id="services" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">1. OUR SERVICES</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nashflare operates as a peer-to-peer marketplace platform that connects buyers and sellers of digital gaming products, including but not limited to gaming accounts, in-game currency, in-game items, and game activation keys. We act as an intermediary facilitating transactions between users but do not own, possess, or control the items being sold.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  The Services are not tailored to comply with industry-specific regulations (HIPAA, FISMA, etc.), so if your interactions would be subjected to such laws, you may not use the Services. You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).
                </p>
              </section>

              {/* Section 2 - NEW: Marketplace Rules */}
              <section id="marketplace" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">2. MARKETPLACE RULES AND FEES</h2>
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-6 mb-4">
                  <h3 className="text-xl font-semibold text-white mb-3">Platform Service Fee</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Nashflare charges a <strong className="text-white">5% service fee</strong> on all completed transactions. This fee is calculated based on the listing price and is added to the buyer&apos;s total at checkout. The service fee covers platform maintenance, buyer protection services, dispute resolution, and secure payment processing.
                  </p>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Transaction Process</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Buyers browse listings and add items to their cart</li>
                  <li>Payment is processed securely through our payment processor (Stripe)</li>
                  <li>Funds are held in escrow until delivery is confirmed</li>
                  <li>Sellers deliver the digital product (account credentials, game key, etc.)</li>
                  <li>Buyers have 48 hours to verify delivery and report any issues</li>
                  <li>After the protection period, funds are released to the seller minus the platform fee</li>
                </ul>
                <h3 className="text-xl font-semibold text-white mb-3">Vendor Withdrawals</h3>
                <p className="text-gray-300 leading-relaxed">
                  Sellers may withdraw their available balance through supported payment methods (Bitcoin, Skrill, or other methods as offered). Withdrawal requests are processed within 1-3 business days. Minimum withdrawal amounts and processing fees may apply.
                </p>
              </section>

              {/* Section 3 - NEW: Buyer Protection */}
              <section id="buyer-protection" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">3. BUYER PROTECTION AND ESCROW</h2>
                <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-6 mb-4">
                  <h3 className="text-xl font-semibold text-white mb-3">48-Hour Buyer Protection</h3>
                  <p className="text-gray-300 leading-relaxed">
                    All purchases on Nashflare include a <strong className="text-white">48-hour buyer protection window</strong>. During this period, buyers can verify that the delivered product matches the listing description and functions as expected. If issues arise, buyers may open a dispute for resolution.
                  </p>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Escrow System</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  All payments are held securely in escrow until the transaction is completed satisfactorily:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Your payment is secure and not released to the seller immediately</li>
                  <li>Sellers are incentivized to deliver as described</li>
                  <li>Funds are only released after the 48-hour protection period expires without disputes</li>
                  <li>In case of disputes, funds remain in escrow until resolution</li>
                </ul>
                <h3 className="text-xl font-semibold text-white mb-3">What&apos;s Covered</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Non-delivery of purchased items</li>
                  <li>Items significantly different from listing description</li>
                  <li>Invalid or already-used game keys</li>
                  <li>Account credentials that don&apos;t work</li>
                  <li>Missing items or features that were advertised</li>
                </ul>
                <h3 className="text-xl font-semibold text-white mb-3">What&apos;s NOT Covered</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Buyer&apos;s remorse or change of mind after successful delivery</li>
                  <li>Issues arising after the 48-hour protection period</li>
                  <li>Account bans or suspensions by game publishers after transfer (see Section 7)</li>
                  <li>Loss of items due to buyer&apos;s actions after receiving the account</li>
                  <li>Disputes opened after confirming satisfactory delivery</li>
                </ul>
              </section>

              {/* Section 4 - NEW: Seller Obligations */}
              <section id="seller-obligations" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">4. SELLER OBLIGATIONS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  By listing items for sale on Nashflare, sellers agree to the following obligations:
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Listing Accuracy</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>All listing information must be accurate, complete, and not misleading</li>
                  <li>Images must accurately represent the product being sold</li>
                  <li>Account levels, items, currency amounts, and other details must be current</li>
                  <li>Any known issues or limitations must be disclosed in the listing</li>
                </ul>
                <h3 className="text-xl font-semibold text-white mb-3">Delivery Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Sellers must deliver purchased items within <strong className="text-white">24 hours</strong> of receiving the order notification</li>
                  <li>Delivery must be made through the platform&apos;s secure messaging system</li>
                  <li>Account credentials must be complete and allow full access as advertised</li>
                  <li>Game keys must be valid, unused, and for the correct region/platform</li>
                  <li>Sellers must respond to buyer inquiries within 24 hours during the protection period</li>
                </ul>
                <h3 className="text-xl font-semibold text-white mb-3">Prohibited Seller Behavior</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Selling items you do not own or have the right to sell</li>
                  <li>Attempting to recover accounts after sale</li>
                  <li>Providing false or incomplete delivery information</li>
                  <li>Requesting payment outside the platform</li>
                  <li>Creating fake or misleading listings</li>
                  <li>Manipulating reviews or ratings</li>
                </ul>
              </section>

              {/* Section 5 - NEW: Prohibited Items */}
              <section id="prohibited-items" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">5. PROHIBITED ITEMS AND ACTIVITIES</h2>
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6 mb-4">
                  <p className="text-gray-300 leading-relaxed">
                    The following items and activities are strictly prohibited on Nashflare. Violations may result in immediate account termination and forfeiture of funds.
                  </p>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Prohibited Items</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Stolen accounts or items obtained through unauthorized access</li>
                  <li>Accounts created using stolen credit cards or fraudulent means</li>
                  <li>Accounts with active bans, suspensions, or pending violations</li>
                  <li>Items obtained through exploits, hacks, or cheating software</li>
                  <li>Counterfeit or pirated game keys</li>
                  <li>Accounts containing illegal content</li>
                  <li>Items that violate intellectual property rights</li>
                </ul>
              </section>

              {/* Section 6 - NEW: Internal Disputes */}
              <section id="disputes" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">6. INTERNAL DISPUTE RESOLUTION</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nashflare provides an internal dispute resolution system to handle conflicts between buyers and sellers.
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Dispute Process</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-4">
                  <li>Buyer opens dispute with evidence and explanation within 48-hour window</li>
                  <li>Seller is notified and has 24 hours to respond</li>
                  <li>Both parties can provide additional evidence</li>
                  <li>Nashflare admin reviews the case within 48-72 hours</li>
                  <li>Final decision is made and funds are distributed accordingly</li>
                </ol>
                <h3 className="text-xl font-semibold text-white mb-3">Possible Outcomes</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li><strong className="text-white">Full refund to buyer:</strong> If seller failed to deliver or item was significantly misrepresented</li>
                  <li><strong className="text-white">Partial refund:</strong> If item was delivered but with minor discrepancies</li>
                  <li><strong className="text-white">Funds released to seller:</strong> If buyer&apos;s claim is found to be invalid</li>
                  <li><strong className="text-white">Account suspension:</strong> For either party found to be acting in bad faith</li>
                </ul>
              </section>

              {/* Section 7 - NEW: Account Risks */}
              <section id="account-risks" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">7. ACCOUNT TRANSFER RISKS AND DISCLAIMERS</h2>
                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-6 mb-4">
                  <h3 className="text-xl font-semibold text-white mb-3">⚠️ Important Warning</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Trading gaming accounts may violate the Terms of Service of the respective game publishers. By using Nashflare, you acknowledge and accept the following risks:
                  </p>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Publisher Enforcement</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Game publishers (Epic Games, Riot Games, Rockstar, etc.) may prohibit account transfers</li>
                  <li>Accounts may be banned, suspended, or terminated by the publisher at any time</li>
                  <li>Publishers may detect account transfers through IP changes, location changes, or other means</li>
                  <li>Bans imposed by publishers are outside Nashflare&apos;s control</li>
                </ul>
                <h3 className="text-xl font-semibold text-white mb-3">Buyer Acknowledgment</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  By purchasing accounts on Nashflare, you acknowledge that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>You understand the risk of account bans by game publishers</li>
                  <li>Nashflare is not responsible for actions taken by game publishers</li>
                  <li>Buyer protection does NOT cover bans that occur after successful delivery and protection period</li>
                  <li>You are responsible for securing the account after transfer</li>
                </ul>
              </section>

              {/* Section 8 */}
              <section id="ip" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">8. INTELLECTUAL PROPERTY RIGHTS</h2>
                <p className="text-gray-300 leading-relaxed">
                  We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the &quot;Content&quot;), as well as the trademarks, service marks, and logos contained therein (the &quot;Marks&quot;). Our Content and Marks are protected by copyright and trademark laws.
                </p>
              </section>

              {/* Section 9 */}
              <section id="representations" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">9. USER REPRESENTATIONS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  By using the Services, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>All registration information you submit will be true, accurate, current, and complete</li>
                  <li>You have the legal capacity and you agree to comply with these Legal Terms</li>
                  <li>You are not a minor in the jurisdiction in which you reside (minimum 18 years old)</li>
                  <li>You will not access the Services through automated or non-human means</li>
                  <li>You will not use the Services for any illegal or unauthorized purpose</li>
                  <li>Your use of the Services will not violate any applicable law or regulation</li>
                  <li>You have the legal right to sell any items you list on the platform</li>
                  <li>You understand and accept the risks associated with digital gaming product transactions</li>
                </ul>
              </section>

              {/* Section 10 */}
              <section id="registration" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">10. USER REGISTRATION</h2>
                <p className="text-gray-300 leading-relaxed">
                  You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
                </p>
              </section>

              {/* Section 11 */}
              <section id="purchases" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">11. PURCHASES AND PAYMENT</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We accept the following forms of payment through our payment processor, Stripe:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Visa</li>
                  <li>Mastercard</li>
                  <li>American Express</li>
                  <li>Discover</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  You agree to provide current, complete, and accurate purchase and account information for all purchases. A <strong className="text-white">5% service fee</strong> will be added to all purchases. All payments shall be in US dollars. All payment information is processed securely by Stripe and is never stored on our servers.
                </p>
              </section>

              {/* Section 12 - UPDATED */}
              <section id="refunds" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">12. REFUNDS AND BUYER PROTECTION POLICY</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Due to the digital nature of products sold on Nashflare, <strong className="text-white">all sales are generally final</strong>. However, buyers are protected under our 48-hour buyer protection policy:
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Refund Eligibility</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li><strong className="text-white">Eligible:</strong> Non-delivery, significantly misrepresented items, invalid keys, non-functional credentials</li>
                  <li><strong className="text-white">NOT eligible:</strong> Buyer&apos;s remorse, issues after 48-hour protection period, publisher bans after successful transfer</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  Refunds, when approved, are processed to the original payment method within 5-10 business days. Repeated abuse of the refund system may result in account suspension.
                </p>
              </section>

              {/* Section 13 */}
              <section id="prohibited" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">13. PROHIBITED PLATFORM ACTIVITIES</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  As a user of the Services, you agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Systematically retrieve data from the Services without written permission</li>
                  <li>Trick, defraud, or mislead us and other users</li>
                  <li>Circumvent or interfere with security-related features of the Services</li>
                  <li>Use any information obtained from the Services to harass or harm another person</li>
                  <li>Make improper use of our support services or submit false reports</li>
                  <li>Engage in any automated use of the system</li>
                  <li>Attempt to impersonate another user</li>
                  <li>Interfere with or disrupt the Services or networks</li>
                  <li>Harass, intimidate, or threaten any of our employees or agents</li>
                  <li>Attempt to bypass any measures designed to prevent or restrict access</li>
                  <li>Sell or otherwise transfer your profile</li>
                </ul>
              </section>

              {/* Section 14 */}
              <section id="ugc" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">14. USER GENERATED CONTRIBUTIONS</h2>
                <p className="text-gray-300 leading-relaxed">
                  The Services may provide you with the opportunity to create, submit, post, or display content and materials (&quot;Contributions&quot;). Contributions may be viewable by other users and may be treated as non-confidential and non-proprietary. By posting Contributions, you grant us an unrestricted, worldwide license to use, copy, reproduce, disclose, and distribute such Contributions.
                </p>
              </section>

              {/* Section 15 */}
              <section id="reviews" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">15. GUIDELINES FOR REVIEWS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When posting a review, you must:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Have firsthand experience with the person/entity being reviewed</li>
                  <li>Not include offensive profanity, racism, or hateful language</li>
                  <li>Not include discriminatory references</li>
                  <li>Not include references to illegal activity</li>
                  <li>Not post false or misleading statements</li>
                  <li>Not organize campaigns to manipulate reviews</li>
                </ul>
              </section>

              {/* Section 16 */}
              <section id="privacy" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">16. PRIVACY POLICY</h2>
                <p className="text-gray-300 leading-relaxed">
                  We care about data privacy and security. Please review our Privacy Policy: <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition">https://www.nashflare.com/privacy</Link>. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms.
                </p>
              </section>

              {/* Section 17 */}
              <section id="term" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">17. TERM AND TERMINATION</h2>
                <p className="text-gray-300 leading-relaxed">
                  These Legal Terms shall remain in full force and effect while you use the Services. WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES TO ANY PERSON FOR ANY REASON. If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party.
                </p>
              </section>

              {/* Section 18 */}
              <section id="modifications" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">18. MODIFICATIONS AND INTERRUPTIONS</h2>
                <p className="text-gray-300 leading-relaxed">
                  We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors.
                </p>
              </section>

              {/* Section 19 */}
              <section id="governing" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">19. GOVERNING LAW</h2>
                <p className="text-gray-300 leading-relaxed">
                  These Legal Terms and your use of the Services are governed by and construed in accordance with the laws of the State of Florida applicable to agreements made and to be entirely performed within the State of Florida, without regard to its conflict of law principles.
                </p>
              </section>

              {/* Section 20 - UPDATED with filled blanks */}
              <section id="legal-dispute" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">20. LEGAL DISPUTE RESOLUTION</h2>
                <h3 className="text-xl font-semibold text-white mb-3">Informal Negotiations</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The Parties agree to first attempt to negotiate any Dispute informally for at least <strong className="text-white">thirty (30) days</strong> before initiating arbitration.
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Binding Arbitration</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Any dispute arising out of or in connection with these Legal Terms shall be referred to and finally resolved by binding arbitration administered by the American Arbitration Association (&quot;AAA&quot;) in accordance with its Commercial Arbitration Rules. The number of arbitrators shall be <strong className="text-white">one (1)</strong>. The seat, or legal place, of arbitration shall be <strong className="text-white">St. Petersburg, Florida, United States</strong>. The language of the proceedings shall be <strong className="text-white">English</strong>.
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Restrictions</h3>
                <p className="text-gray-300 leading-relaxed">
                  Any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law, no arbitration shall be joined with any other proceeding, and there is no right or authority for any Dispute to be arbitrated on a class-action basis.
                </p>
              </section>

              {/* Section 21 */}
              <section id="disclaimer" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">21. DISCLAIMER</h2>
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6">
                  <p className="text-gray-300 leading-relaxed">
                    THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED. WE MAKE NO WARRANTIES ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES&apos; CONTENT AND WE WILL ASSUME NO LIABILITY FOR ANY ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS.
                  </p>
                </div>
              </section>

              {/* Section 22 */}
              <section id="liability" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">22. LIMITATIONS OF LIABILITY</h2>
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6">
                  <p className="text-gray-300 leading-relaxed">
                    IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES. OUR LIABILITY WILL BE LIMITED TO THE AMOUNT PAID BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING.
                  </p>
                </div>
              </section>

              {/* Section 23 */}
              <section id="indemnification" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">23. INDEMNIFICATION</h2>
                <p className="text-gray-300 leading-relaxed">
                  You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys&apos; fees and expenses, made by any third party due to or arising out of: your Contributions, use of the Services, breach of these Legal Terms, your violation of the rights of a third party, or any harmful act toward any other user.
                </p>
              </section>

              {/* Section 24 */}
              <section id="userdata" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">24. USER DATA</h2>
                <p className="text-gray-300 leading-relaxed">
                  We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services.
                </p>
              </section>

              {/* Section 25 */}
              <section id="electronic" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">25. ELECTRONIC COMMUNICATIONS</h2>
                <p className="text-gray-300 leading-relaxed">
                  Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically satisfy any legal requirement that such communication be in writing.
                </p>
              </section>

              {/* Section 26 */}
              <section id="california" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">26. CALIFORNIA USERS AND RESIDENTS</h2>
                <p className="text-gray-300 leading-relaxed">
                  If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.
                </p>
              </section>

              {/* Section 27 */}
              <section id="miscellaneous" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">27. MISCELLANEOUS</h2>
                <p className="text-gray-300 leading-relaxed">
                  These Legal Terms and any policies or operating rules posted by us on the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions.
                </p>
              </section>

              {/* Section 28 */}
              <section id="contact" className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">28. CONTACT US</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:
                </p>
                <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                  <p className="text-white font-semibold mb-2">Nashflare LLC</p>
                  <p className="text-gray-300">7901 4th St N STE 300</p>
                  <p className="text-gray-300">St. Petersburg, FL 33702</p>
                  <p className="text-gray-300">United States</p>
                  <p className="text-gray-300 mt-2">Phone: <a href="tel:1-813-434-7657" className="text-purple-400 hover:text-purple-300">1-813-434-7657</a></p>
                  <p className="text-gray-300">Email: <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a></p>
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
            <Link href="/terms" className="text-purple-400 hover:text-purple-300 text-sm transition">Terms of Service</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition">Privacy Policy</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}