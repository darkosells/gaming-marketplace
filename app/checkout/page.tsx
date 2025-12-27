// app/checkout/page.tsx - Main checkout page

'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useCheckout } from './hooks/useCheckout'
import CheckoutForm from './components/CheckoutForm'
import PaymentMethods from './components/PaymentMethods'
import OrderSummary from './components/OrderSummary'
import MobileSummary from './components/MobileSummary'
import GuaranteeModal from './components/GuaranteeModal'

function CheckoutContent() {
  const checkout = useCheckout()

  // Loading state
  if (checkout.loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-white mt-4 sm:mt-6 text-base sm:text-lg">Loading checkout...</p>
        </div>
      </div>
    )
  }

  // No cart item (for listing checkout) and no boost data (for boost checkout)
  if (checkout.checkoutType === 'listing' && !checkout.cartItem) {
    return null
  }
  if (checkout.checkoutType === 'boost' && !checkout.boostData) {
    return null
  }

  // Determine back link based on checkout type
  const backLink = checkout.checkoutType === 'boost' && checkout.boostData
    ? `/boosting/my-requests/${checkout.boostData.request.id}`
    : '/cart'
  const backText = checkout.checkoutType === 'boost' ? 'Back to Offers' : 'Back to Cart'

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Modals */}
      <GuaranteeModal 
        show={checkout.showGuaranteeModal} 
        onClose={() => checkout.setShowGuaranteeModal(false)} 
      />

      {/* Mobile Summary */}
      <MobileSummary
        cartItem={checkout.cartItem}
        sellerStats={checkout.sellerStats}
        subtotal={checkout.subtotal}
        serviceFee={checkout.serviceFee}
        total={checkout.total}
        selectedPayment={checkout.selectedPayment}
        isFormValid={checkout.isFormValid}
        cryptoLoading={checkout.cryptoLoading}
        handlePlaceOrder={checkout.handlePlaceOrder}
        showMobileSummary={checkout.showMobileSummary}
        setShowMobileSummary={checkout.setShowMobileSummary}
        checkoutType={checkout.checkoutType}
        boostData={checkout.boostData}
      />

      {/* Static Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 transform-gpu">
        <Navigation />

        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-32 sm:pb-12">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <Link href={backLink} className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base">
              <span>←</span> {backText}
            </Link>
            <div className="inline-block mb-3 sm:mb-4">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium">
                🔒 Secure Checkout
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                {checkout.checkoutType === 'boost' ? 'Complete Your Boost Order' : 'Complete Your Purchase'}
              </span>
            </h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              
              {/* Compact Trust Banner - Clickable */}
              <button
                onClick={() => checkout.setShowGuaranteeModal(true)}
                className="w-full bg-green-500/10 border border-green-500/30 rounded-xl p-3 sm:p-4 hover:border-green-500/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-bold text-sm sm:text-base">
                        {checkout.checkoutType === 'boost' ? 'Boost Protection Guarantee' : '48-Hour Buyer Protection'}
                      </h3>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">Money-Back Guarantee</span>
                    </div>
                    <p className="text-green-300/70 text-xs sm:text-sm mt-0.5">
                      {checkout.checkoutType === 'boost' 
                        ? 'Full refund if boost not completed as promised • Click to learn more'
                        : 'Full refund if anything goes wrong • Click to learn more'
                      }
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Billing Information */}
              <CheckoutForm
                billingInfo={checkout.billingInfo}
                setBillingInfo={checkout.setBillingInfo}
                formErrors={checkout.formErrors}
                setFormErrors={checkout.setFormErrors}
              />

              {/* Payment Methods */}
              <PaymentMethods
                selectedPayment={checkout.selectedPayment}
                setSelectedPayment={checkout.setSelectedPayment}
                isFormValid={checkout.isFormValid}
                paypalLoaded={checkout.paypalLoaded}
                paypalError={checkout.paypalError}
                setPaypalError={checkout.setPaypalError}
                processing={checkout.processing}
                paypalButtonsRef={checkout.paypalButtonsRef}
                paypalButtonsRendered={checkout.paypalButtonsRendered}
                paypalOrderId={checkout.paypalOrderId}
                renderPayPalButtons={checkout.renderPayPalButtons}
                cryptoLoading={checkout.cryptoLoading}
                cryptoError={checkout.cryptoError}
                setCryptoError={checkout.setCryptoError}
                handleCryptoPayment={checkout.handleCryptoPayment}
                total={checkout.total}
              />

              {/* What Happens Next - Compact Version */}
              <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide text-center mb-3">What Happens Next</p>
                {checkout.checkoutType === 'boost' ? (
                  // Boosting flow steps
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-purple-400">🔐</span>
                      <div>
                        <span className="text-white font-medium">Submit Credentials</span>
                        <span className="text-gray-500 text-xs block sm:inline sm:ml-1">— Securely share account</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-cyan-400">🚀</span>
                      <div>
                        <span className="text-white font-medium">Boost Begins</span>
                        <span className="text-gray-500 text-xs block sm:inline sm:ml-1">— Track progress live</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-green-400">✓</span>
                      <div>
                        <span className="text-white font-medium">Rank Achieved</span>
                        <span className="text-gray-500 text-xs block sm:inline sm:ml-1">— Confirm & rate</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Listing checkout flow steps
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      {checkout.cartItem?.listing.delivery_type === 'automatic' ? (
                        <>
                          <span className="text-green-400">⚡</span>
                          <div>
                            <span className="text-white font-medium">Instant Delivery</span>
                            <span className="text-gray-500 text-xs block sm:inline sm:ml-1">— Receive immediately</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-blue-400">📦</span>
                          <div>
                            <span className="text-white font-medium">Fast Delivery</span>
                            <span className="text-gray-500 text-xs block sm:inline sm:ml-1">— Usually within hours</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-blue-400">📧</span>
                      <div>
                        <span className="text-white font-medium">Email Confirmation</span>
                        <span className="text-gray-500 text-xs block sm:inline sm:ml-1">— Order details sent</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="text-purple-400">💬</span>
                      <div>
                        <span className="text-white font-medium">Chat Support</span>
                        <span className="text-gray-500 text-xs block sm:inline sm:ml-1">— We're here to help</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Right Column - Order Summary */}
            <OrderSummary
              cartItem={checkout.cartItem}
              sellerStats={checkout.sellerStats}
              subtotal={checkout.subtotal}
              serviceFee={checkout.serviceFee}
              total={checkout.total}
              selectedPayment={checkout.selectedPayment}
              isFormValid={checkout.isFormValid}
              cryptoLoading={checkout.cryptoLoading}
              handlePlaceOrder={checkout.handlePlaceOrder}
              checkoutType={checkout.checkoutType}
              boostData={checkout.boostData}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="hidden lg:block">
          <Footer />
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        /* PayPal button container styling */
        .paypal-buttons-container {
          min-height: 150px;
          width: 100%;
        }
        .paypal-buttons-container iframe {
          z-index: 1 !important;
        }
        .paypal-buttons-wrapper {
          width: 100%;
        }
        /* GPU acceleration for smooth scrolling */
        .transform-gpu {
          transform: translateZ(0);
          will-change: transform;
        }
      `}</style>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-white mt-4 sm:mt-6 text-base sm:text-lg">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}