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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-gray-400">Last updated January 01, 2024</p>
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
                  Nashflare provides a safe and easy accessible Marketplace for Gamers. Our offers range from accounts, keys and In-game items to Level or Rank Boosting and Coaching. You can contact us by phone at 1-813-434-7657, email at contact@nashflare.com, or by mail to 7901 4th St N STE 300, St. Petersburg, FL 33702, United States.
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
                    <li><a href="#ip" className="text-purple-400 hover:text-purple-300 transition">INTELLECTUAL PROPERTY RIGHTS</a></li>
                    <li><a href="#representations" className="text-purple-400 hover:text-purple-300 transition">USER REPRESENTATIONS</a></li>
                    <li><a href="#registration" className="text-purple-400 hover:text-purple-300 transition">USER REGISTRATION</a></li>
                    <li><a href="#products" className="text-purple-400 hover:text-purple-300 transition">PRODUCTS</a></li>
                    <li><a href="#purchases" className="text-purple-400 hover:text-purple-300 transition">PURCHASES AND PAYMENT</a></li>
                    <li><a href="#refunds" className="text-purple-400 hover:text-purple-300 transition">REFUNDS POLICY</a></li>
                    <li><a href="#prohibited" className="text-purple-400 hover:text-purple-300 transition">PROHIBITED ACTIVITIES</a></li>
                    <li><a href="#ugc" className="text-purple-400 hover:text-purple-300 transition">USER GENERATED CONTRIBUTIONS</a></li>
                    <li><a href="#license" className="text-purple-400 hover:text-purple-300 transition">CONTRIBUTION LICENSE</a></li>
                    <li><a href="#reviews" className="text-purple-400 hover:text-purple-300 transition">GUIDELINES FOR REVIEWS</a></li>
                    <li><a href="#management" className="text-purple-400 hover:text-purple-300 transition">SERVICES MANAGEMENT</a></li>
                    <li><a href="#privacy" className="text-purple-400 hover:text-purple-300 transition">PRIVACY POLICY</a></li>
                    <li><a href="#dmca" className="text-purple-400 hover:text-purple-300 transition">DIGITAL MILLENNIUM COPYRIGHT ACT (DMCA) NOTICE AND POLICY</a></li>
                    <li><a href="#term" className="text-purple-400 hover:text-purple-300 transition">TERM AND TERMINATION</a></li>
                    <li><a href="#modifications" className="text-purple-400 hover:text-purple-300 transition">MODIFICATIONS AND INTERRUPTIONS</a></li>
                    <li><a href="#governing" className="text-purple-400 hover:text-purple-300 transition">GOVERNING LAW</a></li>
                    <li><a href="#dispute" className="text-purple-400 hover:text-purple-300 transition">DISPUTE RESOLUTION</a></li>
                    <li><a href="#corrections" className="text-purple-400 hover:text-purple-300 transition">CORRECTIONS</a></li>
                    <li><a href="#disclaimer" className="text-purple-400 hover:text-purple-300 transition">DISCLAIMER</a></li>
                    <li><a href="#liability" className="text-purple-400 hover:text-purple-300 transition">LIMITATIONS OF LIABILITY</a></li>
                    <li><a href="#indemnification" className="text-purple-400 hover:text-purple-300 transition">INDEMNIFICATION</a></li>
                    <li><a href="#userdata" className="text-purple-400 hover:text-purple-300 transition">USER DATA</a></li>
                    <li><a href="#electronic" className="text-purple-400 hover:text-purple-300 transition">ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</a></li>
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
                  The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  The Services are not tailored to comply with industry-specific regulations (Health Insurance Portability and Accountability Act (HIPAA), Federal Information Security Management Act (FISMA), etc.), so if your interactions would be subjected to such laws, you may not use the Services. You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).
                </p>
              </section>

              {/* Section 2 */}
              <section id="ip" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">2. INTELLECTUAL PROPERTY RIGHTS</h2>
                <h3 className="text-xl font-semibold text-white mb-3">Our intellectual property</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the &quot;Content&quot;), as well as the trademarks, service marks, and logos contained therein (the &quot;Marks&quot;).
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties in the United States and around the world.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  The Content and Marks are provided in or through the Services &quot;AS IS&quot; for your personal, non-commercial use or internal business purpose only.
                </p>
              </section>

              {/* Section 3 */}
              <section id="representations" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">3. USER REPRESENTATIONS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  By using the Services, you represent and warrant that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>All registration information you submit will be true, accurate, current, and complete</li>
                  <li>You will maintain the accuracy of such information and promptly update such registration information as necessary</li>
                  <li>You have the legal capacity and you agree to comply with these Legal Terms</li>
                  <li>You are not a minor in the jurisdiction in which you reside</li>
                  <li>You will not access the Services through automated or non-human means</li>
                  <li>You will not use the Services for any illegal or unauthorized purpose</li>
                  <li>Your use of the Services will not violate any applicable law or regulation</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section id="registration" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">4. USER REGISTRATION</h2>
                <p className="text-gray-300 leading-relaxed">
                  You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
                </p>
              </section>

              {/* Section 5 */}
              <section id="products" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">5. PRODUCTS</h2>
                <p className="text-gray-300 leading-relaxed">
                  We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the Services. However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors, and your electronic display may not accurately reflect the actual colors and details of the products. All products are subject to availability, and we cannot guarantee that items will be in stock. We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change.
                </p>
              </section>

              {/* Section 6 */}
              <section id="purchases" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">6. PURCHASES AND PAYMENT</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We accept the following forms of payment:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Visa</li>
                  <li>Mastercard</li>
                  <li>American Express</li>
                  <li>Discover</li>
                  <li>PayPal</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in US dollars.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorize us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.
                </p>
              </section>

              {/* Section 7 */}
              <section id="refunds" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">7. REFUNDS POLICY</h2>
                <p className="text-gray-300 leading-relaxed">
                  All sales are final and no refund will be issued. However, if a seller fails to deliver the purchased item as described, buyers are protected under our 48-hour buyer protection policy. Disputes can be filed through our dispute resolution system, and refunds may be issued at our sole discretion after investigation.
                </p>
              </section>

              {/* Section 8 */}
              <section id="prohibited" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">8. PROHIBITED ACTIVITIES</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  As a user of the Services, you agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us</li>
                  <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords</li>
                  <li>Circumvent, disable, or otherwise interfere with security-related features of the Services</li>
                  <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services</li>
                  <li>Use any information obtained from the Services in order to harass, abuse, or harm another person</li>
                  <li>Make improper use of our support services or submit false reports of abuse or misconduct</li>
                  <li>Use the Services in a manner inconsistent with any applicable laws or regulations</li>
                  <li>Engage in unauthorized framing of or linking to the Services</li>
                  <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material that interferes with any party&apos;s uninterrupted use and enjoyment of the Services</li>
                  <li>Engage in any automated use of the system, such as using scripts to send comments or messages</li>
                  <li>Delete the copyright or other proprietary rights notice from any Content</li>
                  <li>Attempt to impersonate another user or person or use the username of another user</li>
                  <li>Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism</li>
                  <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services</li>
                  <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you</li>
                  <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services</li>
                  <li>Copy or adapt the Services&apos; software, including but not limited to Flash, PHP, HTML, JavaScript, or other code</li>
                  <li>Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services</li>
                  <li>Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email</li>
                  <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise</li>
                  <li>Sell or otherwise transfer your profile</li>
                </ul>
              </section>

              {/* Section 9 */}
              <section id="ugc" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">9. USER GENERATED CONTRIBUTIONS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, &quot;Contributions&quot;).
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Contributions may be viewable by other users of the Services and through third-party websites. As such, any Contributions you transmit may be treated as non-confidential and non-proprietary.
                </p>
              </section>

              {/* Section 10 */}
              <section id="license" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">10. CONTRIBUTION LICENSE</h2>
                <p className="text-gray-300 leading-relaxed">
                  By posting your Contributions to any part of the Services, you automatically grant, and you represent and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such Contributions for any purpose, commercial, advertising, or otherwise, and to prepare derivative works of, or incorporate into other works, such Contributions, and grant and authorize sublicenses of the foregoing.
                </p>
              </section>

              {/* Section 11 */}
              <section id="reviews" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">11. GUIDELINES FOR REVIEWS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may provide you areas on the Services to leave reviews or ratings. When posting a review, you must comply with the following criteria:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>You should have firsthand experience with the person/entity being reviewed</li>
                  <li>Your reviews should not contain offensive profanity, or abusive, racist, offensive, or hateful language</li>
                  <li>Your reviews should not contain discriminatory references based on religion, race, gender, national origin, age, marital status, sexual orientation, or disability</li>
                  <li>Your reviews should not contain references to illegal activity</li>
                  <li>You should not be affiliated with competitors if posting negative reviews</li>
                  <li>You should not make any conclusions as to the legality of conduct</li>
                  <li>You may not post any false or misleading statements</li>
                  <li>You may not organize a campaign encouraging others to post reviews, whether positive or negative</li>
                </ul>
              </section>

              {/* Section 12 */}
              <section id="management" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">12. SERVICES MANAGEMENT</h2>
                <p className="text-gray-300 leading-relaxed">
                  We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, including without limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.
                </p>
              </section>

              {/* Section 13 */}
              <section id="privacy" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">13. PRIVACY POLICY</h2>
                <p className="text-gray-300 leading-relaxed">
                  We care about data privacy and security. Please review our Privacy Policy: <Link href="/privacy" className="text-purple-400 hover:text-purple-300 transition">https://www.nashflare.com/privacy</Link>. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. Please be advised the Services are hosted in the United States. If you access the Services from any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in the United States, then through your continued use of the Services, you are transferring your data to the United States, and you expressly consent to have your data transferred to and processed in the United States.
                </p>
              </section>

              {/* Section 14 */}
              <section id="dmca" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">14. DIGITAL MILLENNIUM COPYRIGHT ACT (DMCA) NOTICE AND POLICY</h2>
                <h3 className="text-xl font-semibold text-white mb-3">Notifications</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We respect the intellectual property rights of others. If you believe that any material available on or through the Services infringes upon any copyright you own or control, please immediately notify us using the contact information provided below (a &quot;Notification&quot;).
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Counter Notification</h3>
                <p className="text-gray-300 leading-relaxed">
                  If you believe your own copyrighted material has been removed from the Services as a result of a mistake or misidentification, you may submit a written counter notification to us using the contact information provided below.
                </p>
              </section>

              {/* Section 15 */}
              <section id="term" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">15. TERM AND TERMINATION</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.
                </p>
              </section>

              {/* Section 16 */}
              <section id="modifications" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">16. MODIFICATIONS AND INTERRUPTIONS</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We also reserve the right to modify or discontinue all or part of the Services without notice at any time. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Services at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Services during any downtime or discontinuance of the Services.
                </p>
              </section>

              {/* Section 17 */}
              <section id="governing" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">17. GOVERNING LAW</h2>
                <p className="text-gray-300 leading-relaxed">
                  These Legal Terms and your use of the Services are governed by and construed in accordance with the laws of the State of Florida applicable to agreements made and to be entirely performed within the State of Florida, without regard to its conflict of law principles.
                </p>
              </section>

              {/* Section 18 */}
              <section id="dispute" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">18. DISPUTE RESOLUTION</h2>
                <h3 className="text-xl font-semibold text-white mb-3">Informal Negotiations</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a &quot;Dispute&quot; and collectively, the &quot;Disputes&quot;) brought by either you or us (individually, a &quot;Party&quot; and collectively, the &quot;Parties&quot;), the Parties agree to first attempt to negotiate any Dispute informally for at least thirty (30) days before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Binding Arbitration</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Any dispute arising out of or in connection with these Legal Terms, including any question regarding its existence, validity, or termination, shall be referred to and finally resolved by binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall be conducted in St. Petersburg, Florida, United States.
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Restrictions</h3>
                <p className="text-gray-300 leading-relaxed">
                  The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law, (a) no arbitration shall be joined with any other proceeding; (b) there is no right or authority for any Dispute to be arbitrated on a class-action basis or to utilize class action procedures; and (c) there is no right or authority for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.
                </p>
              </section>

              {/* Section 19 */}
              <section id="corrections" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">19. CORRECTIONS</h2>
                <p className="text-gray-300 leading-relaxed">
                  There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.
                </p>
              </section>

              {/* Section 20 */}
              <section id="disclaimer" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">20. DISCLAIMER</h2>
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6">
                  <p className="text-gray-300 leading-relaxed">
                    THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES&apos; CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES.
                  </p>
                </div>
              </section>

              {/* Section 21 */}
              <section id="liability" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">21. LIMITATIONS OF LIABILITY</h2>
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6">
                  <p className="text-gray-300 leading-relaxed">
                    IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                  </p>
                </div>
              </section>

              {/* Section 22 */}
              <section id="indemnification" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">22. INDEMNIFICATION</h2>
                <p className="text-gray-300 leading-relaxed">
                  You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys&apos; fees and expenses, made by any third party due to or arising out of: (1) your Contributions; (2) use of the Services; (3) breach of these Legal Terms; (4) any breach of your representations and warranties set forth in these Legal Terms; (5) your violation of the rights of a third party, including but not limited to intellectual property rights; or (6) any overt harmful act toward any other user of the Services with whom you connected via the Services.
                </p>
              </section>

              {/* Section 23 */}
              <section id="userdata" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">23. USER DATA</h2>
                <p className="text-gray-300 leading-relaxed">
                  We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.
                </p>
              </section>

              {/* Section 24 */}
              <section id="electronic" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">24. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</h2>
                <p className="text-gray-300 leading-relaxed">
                  Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES. You hereby waive any rights or requirements under any statutes, regulations, rules, ordinances, or other laws in any jurisdiction which require an original signature or delivery or retention of non-electronic records, or to payments or the granting of credits by any means other than electronic means.
                </p>
              </section>

              {/* Section 25 */}
              <section id="california" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">25. CALIFORNIA USERS AND RESIDENTS</h2>
                <p className="text-gray-300 leading-relaxed">
                  If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.
                </p>
              </section>

              {/* Section 26 */}
              <section id="miscellaneous" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">26. MISCELLANEOUS</h2>
                <p className="text-gray-300 leading-relaxed">
                  These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions.
                </p>
              </section>

              {/* Section 27 */}
              <section id="contact" className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">27. CONTACT US</h2>
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
            &copy; 2024 Nashflare. All rights reserved.
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