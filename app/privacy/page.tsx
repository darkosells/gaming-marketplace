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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-gray-400">Last updated November 26, 2024</p>
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
                  <p className="text-gray-300 leading-relaxed mb-4">
                    This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by using our table of contents below to find the section you are looking for.
                  </p>
                  <ul className="space-y-4 text-gray-300">
                    <li>
                      <strong className="text-white">What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.
                    </li>
                    <li>
                      <strong className="text-white">Do we process any sensitive personal information?</strong> We do not process sensitive personal information.
                    </li>
                    <li>
                      <strong className="text-white">Do we collect any information from third parties?</strong> We do not collect any information from third parties.
                    </li>
                    <li>
                      <strong className="text-white">How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.
                    </li>
                    <li>
                      <strong className="text-white">How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.
                    </li>
                    <li>
                      <strong className="text-white">What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.
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
                    <li><a href="#legal" className="text-purple-400 hover:text-purple-300 transition">WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</a></li>
                    <li><a href="#share" className="text-purple-400 hover:text-purple-300 transition">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
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

              {/* Section 1 */}
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
                  <li>Passwords</li>
                  <li>Billing addresses</li>
                  <li>Debit/credit card numbers</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">Sensitive Information.</strong> We do not process sensitive information.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by Stripe. You may find their privacy notice link(s) here: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">https://stripe.com/privacy</a>.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">Information automatically collected</h3>
                <p className="text-gray-400 italic mb-4">In Short: Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Like many businesses, we also collect information through cookies and similar technologies. The information we collect includes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li><strong className="text-white">Log and Usage Data.</strong> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files.</li>
                  <li><strong className="text-white">Device Data.</strong> We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services.</li>
                  <li><strong className="text-white">Location Data.</strong> We collect location data such as information about your device&apos;s location, which can be either precise or imprecise.</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section id="process" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li><strong className="text-white">To facilitate account creation and authentication</strong> and otherwise manage user accounts.</li>
                  <li><strong className="text-white">To deliver and facilitate delivery of services</strong> to the user.</li>
                  <li><strong className="text-white">To respond to user inquiries/offer support</strong> to users.</li>
                  <li><strong className="text-white">To send administrative information</strong> to you.</li>
                  <li><strong className="text-white">To fulfill and manage your orders.</strong></li>
                  <li><strong className="text-white">To enable user-to-user communications.</strong></li>
                  <li><strong className="text-white">To request feedback.</strong></li>
                  <li><strong className="text-white">To protect our Services.</strong></li>
                  <li><strong className="text-white">To identify usage trends.</strong></li>
                  <li><strong className="text-white">To save or protect an individual&apos;s vital interest.</strong></li>
                </ul>
              </section>

              {/* Section 3 */}
              <section id="legal" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you are located in the US, this section applies to you.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We may process your information if you have given us specific permission (consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred. You can withdraw your consent at any time. We may also process your information when we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation.
                </p>
              </section>

              {/* Section 4 */}
              <section id="share" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We may share information in specific situations described in this section and/or with the following third parties.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may need to share your personal information in the following situations:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li><strong className="text-white">Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                  <li><strong className="text-white">Other Users.</strong> When you share personal information or otherwise interact with public areas of the Services, such personal information may be viewed by all users and may be publicly made available outside the Services in perpetuity.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section id="cookies" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We may use cookies and other tracking technologies to collect and store your information.</p>
                <p className="text-gray-300 leading-relaxed">
                  We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions. For more information about our specific cookie usage, please see our <Link href="/cookies" className="text-purple-400 hover:text-purple-300">Cookie Policy</Link>.
                </p>
              </section>

              {/* Section 6 */}
              <section id="retain" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">6. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
                </p>
              </section>

              {/* Section 7 */}
              <section id="safe" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">7. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We aim to protect your personal information through a system of organizational and technical security measures.</p>
                <p className="text-gray-300 leading-relaxed">
                  We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
                </p>
              </section>

              {/* Section 8 */}
              <section id="minors" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">8. DO WE COLLECT INFORMATION FROM MINORS?</h2>
                <p className="text-gray-400 italic mb-4">In Short: We do not knowingly collect data from or market to children under 18 years of age.</p>
                <p className="text-gray-300 leading-relaxed">
                  We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>.
                </p>
              </section>

              {/* Section 9 */}
              <section id="rights" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">9. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
                <p className="text-gray-400 italic mb-4">In Short: You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-white">Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>.
                </p>
                <h3 className="text-xl font-semibold text-white mb-3">Account Information</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you would at any time like to review or change the information in your account or terminate your account, you can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
                  <li>Log in to your account settings and update your user account</li>
                  <li>Contact us using the contact information provided</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white">Cookies and similar technologies:</strong> Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services.
                </p>
              </section>

              {/* Section 10 */}
              <section id="dnt" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">10. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
                <p className="text-gray-300 leading-relaxed">
                  Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
                </p>
              </section>

              {/* Section 11 */}
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
                  <li>Right to opt out of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">How to Exercise Your Rights</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To exercise these rights, you can contact us by emailing us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>, by mailing to 7901 4th St N STE 300, St. Petersburg, FL 33702, or by referring to the contact details at the bottom of this document.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">Request Verification</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">Appeals</h3>
                <p className="text-gray-300 leading-relaxed">
                  Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.
                </p>
              </section>

              {/* Section 12 */}
              <section id="updates" className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">12. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
                <p className="text-gray-400 italic mb-4">In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>
                <p className="text-gray-300 leading-relaxed">
                  We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
                </p>
              </section>

              {/* Section 13 */}
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
                </div>
              </section>

              {/* Section 14 */}
              <section id="review" className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">14. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
                <p className="text-gray-300 leading-relaxed">
                  Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please visit: <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300">contact@nashflare.com</a>.
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
            &copy; 2024 Nashflare. All rights reserved.
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