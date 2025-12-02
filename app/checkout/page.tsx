'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// PayPal Client ID - Replace with your Sandbox Client ID
// Get it from: https://developer.paypal.com/dashboard/applications/sandbox
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'YOUR_SANDBOX_CLIENT_ID'

interface CartItem {
  listing_id: string
  quantity: number
  listing: {
    id: string
    title: string
    price: number
    game: string
    category: string
    image_url: string
    stock: number
    seller_id: string
    profiles: {
      username: string
    }
  }
}

declare global {
  interface Window {
    paypal?: any
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItem, setCartItem] = useState<CartItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState('paypal') // Default to PayPal now
  const [showMobileSummary, setShowMobileSummary] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [cryptoError, setCryptoError] = useState<string | null>(null)
  
  // Billing form state
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    country: '',
    zipCode: ''
  })
  
  // Form validation
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!billingInfo.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!billingInfo.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!billingInfo.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email)) {
      errors.email = 'Please enter a valid email'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const isFormValid = billingInfo.firstName.trim() && 
                      billingInfo.lastName.trim() && 
                      billingInfo.email.trim() &&
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email)
  
  // Convert PayPal errors to user-friendly messages
  const getPayPalErrorMessage = (error: any): string => {
    const errorString = error?.message || error?.toString() || ''
    
    if (errorString.includes('INSTRUMENT_DECLINED')) {
      return 'Your payment method was declined. Please try a different card or payment method.'
    }
    if (errorString.includes('PAYER_ACTION_REQUIRED')) {
      return 'Additional action required. Please complete the verification in PayPal.'
    }
    if (errorString.includes('ORDER_NOT_APPROVED')) {
      return 'Payment was not approved. Please try again.'
    }
    if (errorString.includes('PERMISSION_DENIED')) {
      return 'Payment permission denied. Please contact support.'
    }
    if (errorString.includes('INTERNAL_SERVER_ERROR') || errorString.includes('500')) {
      return 'PayPal is experiencing issues. Please try again in a few minutes.'
    }
    if (errorString.includes('RESOURCE_NOT_FOUND')) {
      return 'Payment session expired. Please refresh and try again.'
    }
    if (errorString.includes('INVALID_CURRENCY_CODE')) {
      return 'Currency not supported. Please contact support.'
    }
    if (errorString.includes('Window closed') || errorString.includes('popup')) {
      return 'Payment window was closed. Please try again.'
    }
    if (errorString.includes('Network') || errorString.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.'
    }
    
    return error?.message || 'Payment failed. Please try again or use a different payment method.'
  }
  
  const paypalButtonsRef = useRef<HTMLDivElement>(null)
  const paypalButtonsRendered = useRef(false)
  const paypalOrderId = useRef<string | null>(null)
  const billingInfoRef = useRef(billingInfo)
  
  // Keep billingInfoRef in sync with state
  useEffect(() => {
    billingInfoRef.current = billingInfo
  }, [billingInfo])

  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  // Load PayPal SDK
  useEffect(() => {
    if (PAYPAL_CLIENT_ID === 'YOUR_SANDBOX_CLIENT_ID') {
      setPaypalError('PayPal Client ID not configured. Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your environment variables.')
      return
    }

    // Check if script already exists
    if (document.querySelector('script[src*="paypal.com/sdk"]')) {
      if (window.paypal) {
        setPaypalLoaded(true)
      }
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&commit=true&disable-funding=paylater`
    script.async = true
    
    script.onload = () => {
      setPaypalLoaded(true)
      setPaypalError(null)
    }
    
    script.onerror = () => {
      setPaypalError('Failed to load PayPal SDK. Please check your internet connection.')
    }
    
    document.body.appendChild(script)

    return () => {
      // Don't remove the script on cleanup as it may still be needed
    }
  }, [])

  // Render PayPal buttons when SDK is loaded and PayPal is selected
  const renderPayPalButtons = useCallback(() => {
    if (!paypalLoaded || !window.paypal || !paypalButtonsRef.current || !cartItem || paypalButtonsRendered.current) {
      return
    }

    // Clear any existing buttons
    paypalButtonsRef.current.innerHTML = ''
    
    const subtotal = cartItem.listing.price * cartItem.quantity
    const serviceFee = subtotal * 0.05
    const total = subtotal + serviceFee

    try {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 50
        },
        
        // Check form before allowing PayPal
        onClick: (data: any, actions: any) => {
          if (!validateForm()) {
            setPaypalError('Please fill in all required billing fields before paying.')
            return actions.reject()
          }
          setPaypalError(null)
          return actions.resolve()
        },
        
        // Create PayPal order
        createOrder: async (data: any, actions: any) => {
          // Use ref to get latest billing info values
          const billing = billingInfoRef.current
          
          const orderId = await actions.order.create({
            intent: 'CAPTURE',
            payer: {
              name: {
                given_name: billing.firstName || undefined,
                surname: billing.lastName || undefined,
              },
              email_address: billing.email || undefined,
              address: billing.address ? {
                address_line_1: billing.address,
                admin_area_2: billing.city || undefined,
                postal_code: billing.zipCode || undefined,
                country_code: billing.country || undefined,
              } : undefined,
            },
            purchase_units: [{
              description: `Nashflare - ${cartItem.listing.title}`.substring(0, 127),
              amount: {
                currency_code: 'USD',
                value: total.toFixed(2),
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: subtotal.toFixed(2)
                  },
                  handling: {
                    currency_code: 'USD',
                    value: serviceFee.toFixed(2)
                  }
                }
              },
              items: [{
                name: cartItem.listing.title.substring(0, 127),
                description: `${cartItem.listing.game} - ${cartItem.listing.category}`.substring(0, 127),
                unit_amount: {
                  currency_code: 'USD',
                  value: cartItem.listing.price.toFixed(2)
                },
                quantity: cartItem.quantity.toString(),
                category: 'DIGITAL_GOODS'
              }]
            }],
            application_context: {
              brand_name: 'Nashflare',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW'
            }
          })
          // Store the PayPal order ID for later use
          paypalOrderId.current = orderId
          console.log('PayPal order created:', orderId)
          return orderId
        },

        // Capture payment on approval
        onApprove: async (data: any, actions: any) => {
          setProcessing(true)
          setPaypalError(null)
          
          // Set a timeout to prevent infinite processing state (60 seconds)
          const processingTimeout = setTimeout(() => {
            setPaypalError('Payment is taking too long. Please check your PayPal account or try again.')
            setProcessing(false)
          }, 60000)
          
          const ppOrderId = data.orderID || paypalOrderId.current
          console.log('Payment approved! PayPal Order ID:', ppOrderId)
          
          try {
            // Capture payment on the SERVER (more reliable than client-side)
            console.log('Capturing payment via server API...')
            const captureResponse = await fetch('/api/paypal/capture', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ orderId: ppOrderId }),
            })
            
            clearTimeout(processingTimeout)
            
            const captureResult = await captureResponse.json()
            console.log('Server capture result:', captureResult)
            
            if (!captureResponse.ok || !captureResult.success) {
              throw new Error(captureResult.error || 'Failed to capture payment')
            }
            
            if (captureResult.status === 'COMPLETED') {
              console.log('Payment captured successfully! Creating database order...')
              // Now create the database order - payment is confirmed
              await createDatabaseOrder(captureResult.captureId || ppOrderId, 'paypal', 'paid')
            } else {
              throw new Error(`Payment status: ${captureResult.status}`)
            }
            
          } catch (error: any) {
            clearTimeout(processingTimeout)
            console.error('Payment capture error:', error)
            setPaypalError(getPayPalErrorMessage(error))
            setProcessing(false)
          }
        },

        onError: (err: any) => {
          console.error('PayPal error:', err)
          setPaypalError(getPayPalErrorMessage(err))
          setProcessing(false)
        },

        onCancel: () => {
          console.log('Payment cancelled by user')
          setProcessing(false)
        },
        
        onClose: () => {
          console.log('PayPal popup closed')
          // Only show message if we were processing and didn't complete
          // The onApprove should handle successful payments
        }
      }).render(paypalButtonsRef.current)
      
      paypalButtonsRendered.current = true
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error)
      setPaypalError('Failed to initialize PayPal. Please refresh the page.')
    }
  }, [paypalLoaded, cartItem])

  // Re-render PayPal buttons when payment method changes or cart updates
  useEffect(() => {
    if (selectedPayment === 'paypal' && paypalLoaded && cartItem) {
      paypalButtonsRendered.current = false
      renderPayPalButtons()
    }
  }, [selectedPayment, paypalLoaded, cartItem, renderPayPalButtons])

  const createDatabaseOrder = async (paymentId: string, paymentMethod: string, paymentStatus: string) => {
    if (!cartItem || !user) {
      throw new Error('Missing cart item or user')
    }

    const totalPrice = cartItem.listing.price * cartItem.quantity
    console.log('Creating order with:', { paymentId, paymentMethod, paymentStatus, totalPrice })

    // Create the order with paid status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        listing_id: cartItem.listing.id,
        buyer_id: user.id,
        seller_id: cartItem.listing.seller_id,
        amount: totalPrice,
        quantity: cartItem.quantity,
        status: paymentStatus === 'paid' ? 'paid' : 'pending',
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_id: paymentId,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      throw new Error(`Database error: ${orderError.message}`)
    }

    if (!order) {
      throw new Error('Order was not created - no data returned')
    }

    console.log('Order created successfully:', order.id)

    // Reduce stock for the listing
    const { error: stockError } = await supabase
      .from('listings')
      .update({ 
        stock: cartItem.listing.stock - cartItem.quantity,
        status: cartItem.listing.stock - cartItem.quantity <= 0 ? 'sold' : 'active'
      })
      .eq('id', cartItem.listing.id)

    if (stockError) {
      console.error('Stock update error:', stockError)
      // Don't throw - order is created, stock update failure is non-critical
    }

    // Clear cart
    localStorage.removeItem('cart')
    window.dispatchEvent(new Event('cart-updated'))

    // Redirect to order page
    router.push(`/order/${order.id}`)
  }

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login?returnUrl=/checkout')
      return
    }
    
    setUser(user)
    setBillingInfo(prev => ({ ...prev, email: user.email || '' }))
    loadCart()
    setLoading(false)
  }

  const loadCart = async () => {
    const cartData = localStorage.getItem('cart')
    if (!cartData) {
      router.push('/cart')
      return
    }

    try {
      const cart = JSON.parse(cartData)
      
      const { data: listing, error } = await supabase
        .from('listings')
        .select(`*, profiles (username)`)
        .eq('id', cart.listing_id)
        .single()

      if (error) throw error

      if (listing && listing.status === 'active') {
        setCartItem({
          listing_id: cart.listing_id,
          quantity: 1,
          listing: listing
        })
      } else {
        localStorage.removeItem('cart')
        router.push('/cart')
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      router.push('/cart')
    }
  }

  // Handle test order creation (simulate payment)
  const handleTestOrder = async () => {
    if (!cartItem || !user) return

    if (!validateForm()) {
      return
    }

    setProcessing(true)

    try {
      const totalPrice = cartItem.listing.price * cartItem.quantity

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          listing_id: cartItem.listing.id,
          buyer_id: user.id,
          seller_id: cartItem.listing.seller_id,
          amount: totalPrice,
          quantity: cartItem.quantity,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'test'
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw new Error(orderError.message || 'Failed to create order')
      }

      if (!order) {
        throw new Error('Order was not created')
      }

      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart-updated'))

      router.push(`/order/${order.id}`)

    } catch (error: any) {
      console.error('Error creating order:', error)
      alert('Failed to create order: ' + (error.message || 'Unknown error occurred'))
    } finally {
      setProcessing(false)
    }
  }

  // Handle crypto payment via Coinbase Commerce
  const handleCryptoPayment = async () => {
    if (!cartItem || !user) return

    if (!validateForm()) {
      return
    }

    setCryptoLoading(true)
    setCryptoError(null)

    try {
      const response = await fetch('/api/coinbase/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: cartItem.listing.id,
          listingTitle: cartItem.listing.title,
          amount: cartItem.listing.price * cartItem.quantity,
          quantity: cartItem.quantity,
          buyerId: user.id,
          sellerId: cartItem.listing.seller_id,
          billingEmail: billingInfo.email
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create crypto payment')
      }

      // Clear cart before redirecting
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart-updated'))

      // Redirect to Coinbase Commerce hosted checkout
      window.location.href = result.hostedUrl

    } catch (error: any) {
      console.error('Crypto payment error:', error)
      setCryptoError(error.message || 'Failed to initiate crypto payment. Please try again.')
      setCryptoLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!cartItem || !user) return

    // For crypto, use Coinbase Commerce
    if (selectedPayment === 'crypto') {
      await handleCryptoPayment()
      return
    }

    // For test mode, create test order
    if (selectedPayment === 'test') {
      await handleTestOrder()
      return
    }

    // For PayPal, the buttons handle the payment flow
    // This function is not called when PayPal is selected
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-4 sm:mt-6 text-base sm:text-lg">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (!cartItem) {
    return null
  }

  const subtotal = cartItem.listing.price * cartItem.quantity
  const serviceFee = subtotal * 0.05
  const total = subtotal + serviceFee

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Mobile Summary Modal */}
      {showMobileSummary && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMobileSummary(false)}
          ></div>
          <div className="relative w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Order Summary</h3>
              <button 
                onClick={() => setShowMobileSummary(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-3 pb-4 border-b border-white/10">
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  {cartItem.listing.image_url ? (
                    <img
                      src={cartItem.listing.image_url}
                      alt={cartItem.listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">
                        {cartItem.listing.category === 'account' ? '🎮' : cartItem.listing.category === 'topup' ? '💰' : '🔑'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm line-clamp-2">{cartItem.listing.title}</p>
                  <p className="text-purple-400 text-xs">{cartItem.listing.game}</p>
                  <p className="text-gray-400 text-xs">Qty: {cartItem.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${(cartItem.listing.price * cartItem.quantity).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Service Fee (5%)</span>
                  <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between text-white text-xl font-bold">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <span className="text-green-400 text-xl">🔒</span>
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <span className="text-green-400 text-xl">🛡️</span>
                  <span>Buyer Protection</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <span className="text-green-400 text-xl">⚡</span>
                  <span>Instant Delivery</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <span className="text-green-400 text-xl">💬</span>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-24 sm:pb-12">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <Link href="/cart" className="text-purple-400 hover:text-purple-300 transition flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base">
              <span>←</span> Back to Cart
            </Link>
            <div className="inline-block mb-3 sm:mb-4">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium">
                💳 Secure Checkout
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Checkout</span>
            </h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Billing Information */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="text-purple-400">📝</span>
                  Billing Information
                </h2>

                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2 text-xs sm:text-sm">First Name *</label>
                    <input
                      type="text"
                      value={billingInfo.firstName}
                      onChange={(e) => {
                        setBillingInfo({ ...billingInfo, firstName: e.target.value })
                        if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' })
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 border ${formErrors.firstName ? 'border-red-500' : 'border-white/10'} text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition`}
                      placeholder="John"
                      required
                    />
                    {formErrors.firstName && <p className="text-red-400 text-xs mt-1">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 text-xs sm:text-sm">Last Name *</label>
                    <input
                      type="text"
                      value={billingInfo.lastName}
                      onChange={(e) => {
                        setBillingInfo({ ...billingInfo, lastName: e.target.value })
                        if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' })
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 border ${formErrors.lastName ? 'border-red-500' : 'border-white/10'} text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition`}
                      placeholder="Doe"
                      required
                    />
                    {formErrors.lastName && <p className="text-red-400 text-xs mt-1">{formErrors.lastName}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white font-medium mb-2 text-xs sm:text-sm">Email *</label>
                    <input
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) => {
                        setBillingInfo({ ...billingInfo, email: e.target.value })
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' })
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 border ${formErrors.email ? 'border-red-500' : 'border-white/10'} text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition`}
                      placeholder="john@example.com"
                      required
                    />
                    {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white font-medium mb-2 text-xs sm:text-sm">Address</label>
                    <input
                      type="text"
                      value={billingInfo.address}
                      onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 text-xs sm:text-sm">City</label>
                    <input
                      type="text"
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 text-xs sm:text-sm">Country</label>
                    <select
                      value={billingInfo.country}
                      onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="AU">Australia</option>
                      <option value="NL">Netherlands</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 text-xs sm:text-sm">ZIP / Postal Code</label>
                    <input
                      type="text"
                      value={billingInfo.zipCode}
                      onChange={(e) => setBillingInfo({ ...billingInfo, zipCode: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="10001"
                    />
                  </div>
                </div>
                
                {/* Email confirmation note */}
                <div className="mt-4 flex items-start gap-2 text-gray-400 text-xs">
                  <span className="text-green-400">✉️</span>
                  <span>Order confirmation will be sent to <span className="text-white">{billingInfo.email || 'your email'}</span></span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="text-purple-400">💳</span>
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {/* PayPal - Primary Payment Method */}
                  <label className={`flex items-start sm:items-center p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedPayment === 'paypal' 
                      ? 'bg-blue-500/20 border-blue-500/50' 
                      : 'bg-slate-800/50 border-white/10 hover:border-blue-500/30'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={selectedPayment === 'paypal'}
                      onChange={(e) => {
                        setSelectedPayment(e.target.value)
                        paypalButtonsRendered.current = false
                        paypalOrderId.current = null
                      }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 ${
                      selectedPayment === 'paypal' ? 'border-blue-500' : 'border-gray-500'
                    }`}>
                      {selectedPayment === 'paypal' && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold flex flex-wrap items-center gap-2 text-sm sm:text-base">
                        <span>PayPal</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">RECOMMENDED</span>
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm">Pay with PayPal, Credit or Debit Card</p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
                      {/* PayPal Logo */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#003087] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">PP</span>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">💳</span>
                      </div>
                    </div>
                  </label>

                  {/* Cryptocurrency via Coinbase Commerce */}
                  <label className={`flex items-start sm:items-center p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedPayment === 'crypto' 
                      ? 'bg-orange-500/20 border-orange-500/50' 
                      : 'bg-slate-800/50 border-white/10 hover:border-orange-500/30'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="crypto"
                      checked={selectedPayment === 'crypto'}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 ${
                      selectedPayment === 'crypto' ? 'border-orange-500' : 'border-gray-500'
                    }`}>
                      {selectedPayment === 'crypto' && (
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold flex flex-wrap items-center gap-2 text-sm sm:text-base">
                        <span>Cryptocurrency</span>
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm">Bitcoin, Ethereum, USDC, Litecoin & more</p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">₿</span>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">Ξ</span>
                      </div>
                    </div>
                  </label>

                  {/* Test/Simulation Mode */}
                  <label className={`flex items-start sm:items-center p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedPayment === 'test' 
                      ? 'bg-green-500/20 border-green-500/50' 
                      : 'bg-slate-800/50 border-white/10 hover:border-green-500/30'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="test"
                      checked={selectedPayment === 'test'}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 ${
                      selectedPayment === 'test' ? 'border-green-500' : 'border-gray-500'
                    }`}>
                      {selectedPayment === 'test' && (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold flex flex-wrap items-center gap-2 text-sm sm:text-base">
                        <span>Test Mode</span>
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">DEV</span>
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm">Simulate payment for testing purposes</p>
                    </div>
                    <div className="flex gap-2 ml-2 flex-shrink-0">
                      <span className="text-xl sm:text-2xl">🧪</span>
                    </div>
                  </label>
                </div>

                {/* PayPal Buttons Container */}
                {selectedPayment === 'paypal' && (
                  <div className="mt-6">
                    {/* Form validation warning */}
                    {!isFormValid && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
                        <p className="text-yellow-300 text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">⚠️</span>
                          <span>
                            <span className="font-semibold">Please complete billing info:</span> Fill in your name and email above before paying.
                          </span>
                        </p>
                      </div>
                    )}
                    
                    {paypalError ? (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">❌</span>
                          <div className="flex-1">
                            <p className="text-red-400 font-semibold mb-1">Payment Failed</p>
                            <p className="text-red-300 text-sm">{paypalError}</p>
                            <button
                              onClick={() => {
                                setPaypalError(null)
                                paypalButtonsRendered.current = false
                                renderPayPalButtons()
                              }}
                              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 text-sm font-medium transition-all"
                            >
                              🔄 Try Again
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : !paypalLoaded ? (
                      <div className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-3 text-gray-400">
                          <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                          <span>Loading PayPal...</span>
                        </div>
                      </div>
                    ) : processing ? (
                      <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                          <div className="text-center">
                            <p className="text-blue-400 font-semibold text-lg">Processing Payment...</p>
                            <p className="text-gray-400 text-sm mt-1">Please wait while we confirm your payment</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4">
                          <p className="text-blue-300 text-xs sm:text-sm flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">🔒</span>
                            <span>
                              <span className="font-semibold">Secure Payment:</span> Click the PayPal button below to complete your purchase. 
                              You can pay with your PayPal balance or any credit/debit card.
                            </span>
                          </p>
                        </div>
                        <div className={`paypal-buttons-wrapper bg-slate-800/50 rounded-xl p-4 sm:p-6 ${!isFormValid ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div 
                            ref={paypalButtonsRef} 
                            className="paypal-buttons-container min-h-[150px] w-full"
                          ></div>
                        </div>
                        <p className="text-center text-gray-500 text-xs mt-3">
                          🔒 Secured by PayPal • 256-bit SSL encryption
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Info box for other payment methods */}
                {selectedPayment === 'test' && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <p className="text-green-300 text-xs sm:text-sm flex items-start gap-2">
                      <span className="text-base sm:text-lg flex-shrink-0">ℹ️</span>
                      <span>
                        <span className="font-semibold">Test Mode Active:</span> Your order will be created and you can simulate the payment on the order details page. 
                        No real payment will be processed.
                      </span>
                    </p>
                  </div>
                )}

                {/* Crypto Payment Section */}
                {selectedPayment === 'crypto' && (
                  <div className="mt-6">
                    {/* Form validation warning */}
                    {!isFormValid && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
                        <p className="text-yellow-300 text-xs sm:text-sm flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">⚠️</span>
                          <span>
                            <span className="font-semibold">Please complete billing info:</span> Fill in your name and email above before paying.
                          </span>
                        </p>
                      </div>
                    )}

                    {cryptoError ? (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">❌</span>
                          <div className="flex-1">
                            <p className="text-red-400 font-semibold mb-1">Payment Failed</p>
                            <p className="text-red-300 text-sm">{cryptoError}</p>
                            <button
                              onClick={() => setCryptoError(null)}
                              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 text-sm font-medium transition-all"
                            >
                              🔄 Try Again
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : cryptoLoading ? (
                      <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="w-12 h-12 border-4 border-orange-400/30 border-t-orange-400 rounded-full animate-spin"></div>
                          <div className="text-center">
                            <p className="text-orange-400 font-semibold text-lg">Preparing Crypto Checkout...</p>
                            <p className="text-gray-400 text-sm mt-1">You'll be redirected to Coinbase Commerce</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl mb-4">
                          <p className="text-orange-300 text-xs sm:text-sm flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">₿</span>
                            <span>
                              <span className="font-semibold">Pay with Cryptocurrency:</span> Click the button below to pay with Bitcoin, Ethereum, USDC, or other supported cryptocurrencies via Coinbase Commerce.
                            </span>
                          </p>
                        </div>

                        {/* Supported Cryptocurrencies */}
                        <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 mb-4">
                          <p className="text-gray-400 text-xs mb-3 text-center">Supported Cryptocurrencies</p>
                          <div className="flex justify-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                              <span className="text-orange-400 font-bold">₿</span>
                              <span className="text-white text-sm">Bitcoin</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                              <span className="text-blue-400 font-bold">Ξ</span>
                              <span className="text-white text-sm">Ethereum</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-400/10 rounded-lg border border-blue-400/30">
                              <span className="text-blue-300 font-bold">$</span>
                              <span className="text-white text-sm">USDC</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-500/10 rounded-lg border border-gray-500/30">
                              <span className="text-gray-300 font-bold">Ł</span>
                              <span className="text-white text-sm">Litecoin</span>
                            </div>
                          </div>
                        </div>

                        {/* Pay Button */}
                        <button
                          onClick={handleCryptoPayment}
                          disabled={!isFormValid || cryptoLoading}
                          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                            isFormValid
                              ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02]'
                              : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-xl">₿</span>
                          <span>Pay ${total.toFixed(2)} with Crypto</span>
                        </button>

                        <p className="text-center text-gray-500 text-xs mt-3">
                          🔒 Secured by Coinbase Commerce • Instant confirmation
                        </p>

                        {/* How it works */}
                        <div className="mt-4 p-3 bg-slate-800/30 rounded-xl">
                          <p className="text-gray-400 text-xs mb-2 font-semibold">How it works:</p>
                          <ol className="text-gray-500 text-xs space-y-1">
                            <li className="flex items-start gap-2">
                              <span className="text-orange-400">1.</span>
                              <span>Click the button to open Coinbase Commerce</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-orange-400">2.</span>
                              <span>Choose your cryptocurrency and send payment</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-orange-400">3.</span>
                              <span>Once confirmed, you'll receive your order</span>
                            </li>
                          </ol>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Right Column - Order Summary */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">📦</span>
                  Order Summary
                </h2>

                <div className="flex gap-3 mb-6 pb-6 border-b border-white/10">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    {cartItem.listing.image_url ? (
                      <img
                        src={cartItem.listing.image_url}
                        alt={cartItem.listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">
                          {cartItem.listing.category === 'account' ? '🎮' : cartItem.listing.category === 'topup' ? '💰' : '🔑'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm line-clamp-2">{cartItem.listing.title}</p>
                    <p className="text-purple-400 text-xs">{cartItem.listing.game}</p>
                    <p className="text-gray-400 text-xs">Qty: {cartItem.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${(cartItem.listing.price * cartItem.quantity).toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Service Fee (5%)</span>
                    <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between text-white text-xl font-bold">
                      <span>Total</span>
                      <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Place Order Button - Only show for non-PayPal methods */}
                {selectedPayment !== 'paypal' && (
                  <>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={processing || cryptoLoading}
                      className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 mb-4 ${
                        selectedPayment === 'test'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50 hover:scale-105'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating Order...
                        </span>
                      ) : selectedPayment === 'test' ? (
                        '🚀 Create Test Order'
                      ) : (
                        '⏳ Coming Soon'
                      )}
                    </button>

                    {selectedPayment === 'test' && (
                      <p className="text-center text-gray-500 text-xs mb-6">
                        You'll simulate payment on the order page
                      </p>
                    )}
                  </>
                )}

                {selectedPayment === 'paypal' && (
                  <div className={`text-center py-4 px-3 ${isFormValid ? 'bg-blue-500/10 border-blue-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-xl mb-6`}>
                    {isFormValid ? (
                      <>
                        <div className="text-blue-400 text-2xl mb-2">👈</div>
                        <p className="text-blue-300 text-sm font-medium">Complete payment using the PayPal buttons</p>
                        <p className="text-gray-400 text-xs mt-1">Select PayPal, Credit or Debit Card</p>
                      </>
                    ) : (
                      <>
                        <div className="text-yellow-400 text-2xl mb-2">📝</div>
                        <p className="text-yellow-300 text-sm font-medium">Fill in billing info first</p>
                        <p className="text-gray-400 text-xs mt-1">Name and email are required</p>
                      </>
                    )}
                  </div>
                )}

                {selectedPayment === 'crypto' && (
                  <div className={`text-center py-4 px-3 ${isFormValid ? 'bg-orange-500/10 border-orange-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-xl mb-6`}>
                    {isFormValid ? (
                      <>
                        <div className="text-orange-400 text-2xl mb-2">₿</div>
                        <p className="text-orange-300 text-sm font-medium">Click the button to pay with crypto</p>
                        <p className="text-gray-400 text-xs mt-1">Bitcoin, Ethereum, USDC & more</p>
                      </>
                    ) : (
                      <>
                        <div className="text-yellow-400 text-2xl mb-2">📝</div>
                        <p className="text-yellow-300 text-sm font-medium">Fill in billing info first</p>
                        <p className="text-gray-400 text-xs mt-1">Name and email are required</p>
                      </>
                    )}
                  </div>
                )}

                {/* Trust Badges */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">🔒</span>
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">🛡️</span>
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">⚡</span>
                    <span>Instant Delivery</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">💬</span>
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Bar - Only show for non-PayPal methods */}
        {selectedPayment !== 'paypal' && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4 z-40 safe-area-bottom">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    ${total.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setShowMobileSummary(true)}
                  className="bg-white/10 text-white px-4 py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 min-h-[48px] text-sm whitespace-nowrap"
                >
                  📋 Summary
                </button>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={processing || cryptoLoading}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base min-h-[48px] ${
                  selectedPayment === 'test'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
                    : selectedPayment === 'crypto'
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:shadow-lg'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing || cryptoLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {cryptoLoading ? 'Preparing...' : 'Creating...'}
                  </span>
                ) : selectedPayment === 'test' ? (
                  '🚀 Create Test Order'
                ) : selectedPayment === 'crypto' ? (
                  `₿ Pay $${total.toFixed(2)} with Crypto`
                ) : (
                  '👆 Pay with PayPal'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mobile PayPal Info Bar */}
        {selectedPayment === 'paypal' && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4 z-40 safe-area-bottom">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Total</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  ${total.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowMobileSummary(true)}
                className="bg-white/10 text-white px-4 py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 min-h-[48px] text-sm whitespace-nowrap"
              >
                📋 Summary
              </button>
              <div className="bg-blue-500/20 text-blue-400 px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap">
                👆 Pay with PayPal
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
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
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
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
      `}</style>
    </div>
  )
}