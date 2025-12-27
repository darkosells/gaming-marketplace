// app/checkout/hooks/useCheckout.ts - Main checkout logic hook

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { sendOrderEmails, sendDeliveryNotificationEmail, sendBoostOfferAcceptedEmail } from '@/lib/email'
import { CartItem, BillingInfo, FormErrors, SellerStats, CheckoutType, BoostCheckoutData } from '../types'
// Boosting imports
import { BOOSTING_COMMISSION_RATE } from '@/lib/boosting/constants'
import { RANKS_MAP } from '@/lib/boosting/ranks'
import { RankKey } from '@/lib/boosting/types'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''

declare global {
  interface Window {
    paypal?: any
  }
}

export function useCheckout() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // ============================================================================
  // CHECKOUT TYPE STATE (new for boosting)
  // ============================================================================
  const [checkoutType, setCheckoutType] = useState<CheckoutType>('listing')
  const [boostData, setBoostData] = useState<BoostCheckoutData | null>(null)

  // Core state
  const [cartItem, setCartItem] = useState<CartItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null)

  // Payment state
  const [selectedPayment, setSelectedPayment] = useState('')
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [cryptoError, setCryptoError] = useState<string | null>(null)

  // Modal state
  const [showMobileSummary, setShowMobileSummary] = useState(false)
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false)

  // Billing form state
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: '',
    lastName: '',
    email: ''
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Refs
  const paypalButtonsRef = useRef<HTMLDivElement>(null)
  const paypalButtonsRendered = useRef(false)
  const paypalOrderId = useRef<string | null>(null)
  const billingInfoRef = useRef(billingInfo)

  // Keep billingInfoRef in sync
  useEffect(() => {
    billingInfoRef.current = billingInfo
  }, [billingInfo])

  // Validation
  const validateForm = useCallback(() => {
    const errors: FormErrors = {}
    
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
  }, [billingInfo])

  const isFormValid = Boolean(
    billingInfo.firstName.trim() && 
    billingInfo.lastName.trim() && 
    billingInfo.email.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email)
  )

  // ============================================================================
  // PRICING CALCULATIONS (updated for boosting)
  // ============================================================================
  const subtotal = checkoutType === 'boost' && boostData
    ? boostData.offer.offered_price
    : cartItem 
      ? cartItem.listing.price * cartItem.quantity 
      : 0

  const serviceFee = checkoutType === 'boost' && boostData
    ? boostData.offer.platform_fee
    : subtotal * 0.05

  const total = subtotal + serviceFee

  // Vendor payout for boosting (after platform fee)
  const vendorPayout = checkoutType === 'boost' && boostData
    ? boostData.offer.offered_price - boostData.offer.platform_fee
    : 0

  // ============================================================================
  // PayPal Error Messages
  // ============================================================================
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

  // ============================================================================
  // BOOSTING ORDER CREATION (new)
  // ============================================================================
  const createBoostingOrder = useCallback(async (paymentId: string, paymentMethod: string, paymentStatus: string) => {
    if (!boostData || !user) {
      throw new Error('Missing boost data or user')
    }

    const { request, offer } = boostData
    console.log('Creating boosting order with:', { paymentId, paymentMethod, paymentStatus })

    // Generate order number
    const orderNumber = `BOOST-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // STEP 1: Create boosting order
    const { data: order, error: orderError } = await supabase
      .from('boosting_orders')
      .insert({
        order_number: orderNumber,
        request_id: request.id,
        offer_id: offer.id,
        customer_id: user.id,
        vendor_id: offer.vendor_id,
        game: request.game,
        current_rank: request.current_rank,
        current_rr: request.current_rr,
        desired_rank: request.desired_rank,
        queue_type: request.queue_type,
        is_priority: request.is_priority,
        addon_offline_mode: request.addon_offline_mode,
        addon_solo_queue_only: request.addon_solo_queue_only,
        addon_no_5_stack: request.addon_no_5_stack,
        addon_specific_agents: request.addon_specific_agents,
        specific_agents_list: request.specific_agents_list,
        progress_current_rank: request.current_rank,
        progress_current_rr: request.current_rr,
        final_price: offer.offered_price,
        platform_fee: offer.platform_fee,
        vendor_payout: offer.offered_price - offer.platform_fee,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_reference: paymentId,
        status: 'awaiting_credentials'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Boosting order creation error:', orderError)
      throw new Error(`Database error: ${orderError.message}`)
    }

    console.log('Boosting order created:', order.id)

    // STEP 2: Update the offer status to accepted
    await supabase
      .from('boost_offers')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', offer.id)

    // STEP 3: Update the request status to paid
    await supabase
      .from('boost_requests')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', request.id)

    // STEP 4: Decline all other pending offers for this request
    await supabase
      .from('boost_offers')
      .update({ status: 'declined' })
      .eq('request_id', request.id)
      .neq('id', offer.id)
      .eq('status', 'pending')

    // ========== STEP 5: SEND CONFIRMATION EMAIL TO BOOSTER ==========
    try {
      console.log('📧 Sending boost offer accepted email to booster...')
      
      // Fetch booster's email
      const { data: boosterProfile } = await supabase
        .from('profiles')
        .select('email, username')
        .eq('id', offer.vendor_id)
        .single()
      
      // Fetch customer's username
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (boosterProfile?.email) {
        const currentRankData = RANKS_MAP[request.current_rank as RankKey]
        const desiredRankData = RANKS_MAP[request.desired_rank as RankKey]
        const boosterPayout = offer.offered_price - offer.platform_fee
        
        await sendBoostOfferAcceptedEmail({
          boosterEmail: boosterProfile.email,
          boosterUsername: boosterProfile.username || (offer as any).vendor?.username || 'Booster',
          customerUsername: customerProfile?.username || 'Customer',
          currentRank: currentRankData?.name || request.current_rank,
          desiredRank: desiredRankData?.name || request.desired_rank,
          finalPrice: offer.offered_price,
          boosterPayout: boosterPayout,
          orderNumber: orderNumber,
          orderId: order.id
        })
        
        console.log('✅ Boost offer accepted email sent to booster')
      } else {
        console.warn('⚠️ Could not send email - booster email not found')
      }
    } catch (emailError) {
      console.error('❌ Email sending failed (non-critical):', emailError)
    }
    // ================================================================

    // STEP 6: Redirect to credentials submission page
    router.push(`/dashboard/boosts/${order.id}/credentials`)
  }, [boostData, user, supabase, router])

  // ============================================================================
  // Database Order Creation with Automatic Delivery Email Fix (existing)
  // ============================================================================
  const createDatabaseOrder = useCallback(async (paymentId: string, paymentMethod: string, paymentStatus: string) => {
    // For boosting orders, use the boosting order creation
    if (checkoutType === 'boost') {
      return createBoostingOrder(paymentId, paymentMethod, paymentStatus)
    }

    if (!cartItem || !user) {
      throw new Error('Missing cart item or user')
    }

    const totalPrice = cartItem.listing.price * cartItem.quantity
    console.log('Creating order with:', { paymentId, paymentMethod, paymentStatus, totalPrice })

    // STEP 1: INSERT order with PENDING status first
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
        payment_method: paymentMethod,
        payment_id: paymentId,
        listing_delivery_type: cartItem.listing.delivery_type
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

    console.log('Order created with pending status:', order.id)

    // STEP 2: UPDATE order to PAID status - THIS TRIGGERS AUTOMATIC DELIVERY!
    let updatedOrder: { status: string; [key: string]: any } | null = null
    if (paymentStatus === 'paid') {
      console.log('Updating order to paid status (this will trigger automatic delivery if applicable)...')
      
      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()
        .single()

      if (updateError) {
        console.error('Order update error:', updateError)
      } else {
        updatedOrder = updated
        console.log('Order updated to paid. New status:', updatedOrder?.status)
        if (updatedOrder?.status === 'delivered') {
          console.log('✅ Automatic delivery triggered successfully!')
        }
      }
    }

    // STEP 3: Reduce stock (only for manual delivery - automatic handled by trigger)
    if (cartItem.listing.delivery_type === 'manual') {
      const { error: stockError } = await supabase
        .from('listings')
        .update({ 
          stock: cartItem.listing.stock - cartItem.quantity,
          status: cartItem.listing.stock - cartItem.quantity <= 0 ? 'sold' : 'active'
        })
        .eq('id', cartItem.listing.id)

      if (stockError) {
        console.error('Stock update error:', stockError)
      }
    }

    // STEP 4: Fetch profiles for emails
    let buyerProfile: { username: string } | null = null
    let sellerProfile: { username: string; email: string } | null = null

    try {
      const { data: buyer } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      buyerProfile = buyer

      const { data: seller } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', cartItem.listing.seller_id)
        .single()
      sellerProfile = seller
    } catch (profileError) {
      console.error('Error fetching profiles:', profileError)
    }

    // STEP 5: Send order confirmation emails
    try {
      console.log('📧 Sending order confirmation emails...')
      
      if (sellerProfile?.email) {
        const sellerAmount = totalPrice * 0.95

        await sendOrderEmails({
          id: order.id,
          listing_title: cartItem.listing.title,
          quantity: cartItem.quantity,
          total_amount: totalPrice,
          seller_amount: sellerAmount,
          buyer_email: billingInfoRef.current.email,
          seller_email: sellerProfile.email,
          buyer_username: buyerProfile?.username || 'Buyer',
          seller_username: cartItem.listing.profiles?.username || sellerProfile.username || 'Seller',
          site_url: window.location.origin
        })
        
        console.log('✅ Order confirmation emails sent successfully')
      } else {
        console.warn('⚠️ Could not send emails - seller email not found')
      }
    } catch (emailError) {
      console.error('❌ Email sending failed (non-critical):', emailError)
    }

    // ========================================================================
    // STEP 6: FIX - Send delivery email for automatic delivery orders
    // ========================================================================
    if (updatedOrder?.status === 'delivered' && cartItem.listing.delivery_type === 'automatic') {
      try {
        console.log('📧 Sending automatic delivery notification email...')
        
        // Wait 2 seconds to avoid Resend rate limit (2 requests/second)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Fetch the delivery code that was assigned by the trigger
        const { data: deliveryCode } = await supabase
          .from('delivery_codes')
          .select('code_text')
          .eq('order_id', order.id)
          .single()
        
        if (deliveryCode) {
          await sendDeliveryNotificationEmail({
            buyerEmail: billingInfoRef.current.email,
            buyerUsername: buyerProfile?.username || 'Buyer',
            orderId: order.id,
            listingTitle: cartItem.listing.title,
            deliveryCode: deliveryCode.code_text,
            sellerUsername: cartItem.listing.profiles?.username || sellerProfile?.username || 'Seller'
          })
          console.log('✅ Automatic delivery email sent successfully')
        } else {
          console.warn('⚠️ Could not find delivery code for automatic delivery email')
        }
      } catch (deliveryEmailError) {
        console.error('❌ Delivery email failed (non-critical):', deliveryEmailError)
      }
    }

    // STEP 7: Clear cart and redirect
    localStorage.removeItem('cart')
    window.dispatchEvent(new Event('cart-updated'))
    router.push(`/order/${order.id}`)
  }, [cartItem, user, supabase, router, checkoutType, createBoostingOrder])

  // ============================================================================
  // PayPal Button Rendering (updated for boosting)
  // ============================================================================
  const renderPayPalButtons = useCallback(() => {
    if (!paypalLoaded || !window.paypal || !paypalButtonsRef.current || paypalButtonsRendered.current) {
      return
    }

    // For listing checkout, require cartItem
    if (checkoutType === 'listing' && !cartItem) {
      return
    }

    // For boost checkout, require boostData
    if (checkoutType === 'boost' && !boostData) {
      return
    }

    paypalButtonsRef.current.innerHTML = ''
    
    // Calculate totals based on checkout type
    const itemSubtotal = checkoutType === 'boost' && boostData
      ? boostData.offer.offered_price
      : cartItem!.listing.price * cartItem!.quantity
    
    const fee = checkoutType === 'boost' && boostData
      ? boostData.offer.platform_fee
      : itemSubtotal * 0.05
    
    const orderTotal = itemSubtotal + fee

    // Item details for PayPal
    const itemName = checkoutType === 'boost' && boostData
      ? `Valorant Rank Boost - ${boostData.request.current_rank} to ${boostData.request.desired_rank}`
      : cartItem!.listing.title
    
    const itemDescription = checkoutType === 'boost'
      ? 'Valorant Boosting Service'
      : `${cartItem!.listing.game} - ${cartItem!.listing.category}`

    try {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 50
        },
        
        onClick: (data: any, actions: any) => {
          const billing = billingInfoRef.current
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          
          const isValid = billing.firstName.trim() && 
                          billing.lastName.trim() && 
                          billing.email.trim() &&
                          emailRegex.test(billing.email)
          
          if (!isValid) {
            const errors: FormErrors = {}
            if (!billing.firstName.trim()) errors.firstName = 'First name is required'
            if (!billing.lastName.trim()) errors.lastName = 'Last name is required'
            if (!billing.email.trim()) errors.email = 'Email is required'
            else if (!emailRegex.test(billing.email)) errors.email = 'Please enter a valid email'
            setFormErrors(errors)
            
            setPaypalError('Please fill in all required billing fields before paying.')
            return actions.reject()
          }
          setPaypalError(null)
          return actions.resolve()
        },
        
        createOrder: async (data: any, actions: any) => {
          const billing = billingInfoRef.current
          
          const orderId = await actions.order.create({
            intent: 'CAPTURE',
            payer: {
              name: {
                given_name: billing.firstName || undefined,
                surname: billing.lastName || undefined,
              },
              email_address: billing.email || undefined,
            },
            purchase_units: [{
              description: `Nashflare - ${itemName}`.substring(0, 127),
              amount: {
                currency_code: 'USD',
                value: orderTotal.toFixed(2),
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: itemSubtotal.toFixed(2)
                  },
                  handling: {
                    currency_code: 'USD',
                    value: fee.toFixed(2)
                  }
                }
              },
              items: [{
                name: itemName.substring(0, 127),
                description: itemDescription.substring(0, 127),
                unit_amount: {
                  currency_code: 'USD',
                  value: itemSubtotal.toFixed(2)
                },
                quantity: '1',
                category: 'DIGITAL_GOODS'
              }]
            }],
            application_context: {
              brand_name: 'Nashflare',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW'
            }
          })
          paypalOrderId.current = orderId
          console.log('PayPal order created:', orderId)
          return orderId
        },

        onApprove: async (data: any, actions: any) => {
          setProcessing(true)
          setPaypalError(null)
          
          const processingTimeout = setTimeout(() => {
            setPaypalError('Payment is taking too long. Please check your PayPal account or try again.')
            setProcessing(false)
          }, 60000)
          
          const ppOrderId = data.orderID || paypalOrderId.current
          console.log('Payment approved! PayPal Order ID:', ppOrderId)
          
          try {
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
        }
      }).render(paypalButtonsRef.current)
      
      paypalButtonsRendered.current = true
    } catch (error) {
      console.error('Error rendering PayPal buttons:', error)
      setPaypalError('Failed to initialize PayPal. Please refresh the page.')
    }
  }, [paypalLoaded, cartItem, boostData, checkoutType, createDatabaseOrder])

  // ============================================================================
  // Crypto Payment Handler (updated for boosting)
  // ============================================================================
  const handleCryptoPayment = useCallback(async () => {
    if (!user) return

    // For listing checkout, require cartItem
    if (checkoutType === 'listing' && !cartItem) return

    // For boost checkout, require boostData
    if (checkoutType === 'boost' && !boostData) return

    if (!validateForm()) {
      return
    }

    setCryptoLoading(true)
    setCryptoError(null)

    try {
      // Different payload for boosting vs listing
      const payload = checkoutType === 'boost' && boostData
        ? {
            type: 'boost',
            requestId: boostData.request.id,
            offerId: boostData.offer.id,
            amount: boostData.offer.offered_price,
            platformFee: boostData.offer.platform_fee,
            buyerId: user.id,
            vendorId: boostData.offer.vendor_id,
            billingEmail: billingInfo.email
          }
        : {
            type: 'listing',
            listingId: cartItem!.listing.id,
            listingTitle: cartItem!.listing.title,
            amount: cartItem!.listing.price * cartItem!.quantity,
            quantity: cartItem!.quantity,
            buyerId: user.id,
            sellerId: cartItem!.listing.seller_id,
            billingEmail: billingInfo.email
          }

      const response = await fetch('/api/nowpayments/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create crypto payment')
      }

      window.location.href = result.invoiceUrl

    } catch (error: any) {
      console.error('Crypto payment error:', error)
      setCryptoError(error.message || 'Failed to initiate crypto payment. Please try again.')
      setCryptoLoading(false)
    }
  }, [cartItem, boostData, user, checkoutType, validateForm, billingInfo.email])

  // ============================================================================
  // Handle Place Order (for crypto and validation)
  // ============================================================================
  const handlePlaceOrder = useCallback(async () => {
    if (!user) return

    // Check if we have the required data
    if (checkoutType === 'listing' && !cartItem) return
    if (checkoutType === 'boost' && !boostData) return

    // Check if payment method is selected
    if (!selectedPayment) {
      setCryptoError('Please select a payment method')
      return
    }

    // For crypto, use NOWPayments
    if (selectedPayment === 'crypto') {
      await handleCryptoPayment()
      return
    }

    // For PayPal, the buttons handle the payment flow
    // This function is not called when PayPal is selected
  }, [cartItem, boostData, user, checkoutType, selectedPayment, handleCryptoPayment])

  // ============================================================================
  // INITIALIZATION - Check for boost checkout params
  // ============================================================================
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?returnUrl=/checkout')
        return
      }
      
      setUser(user)
      setBillingInfo(prev => ({ ...prev, email: user.email || '' }))

      // Check for boosting checkout params
      const requestId = searchParams.get('request')
      const offerId = searchParams.get('offer')

      if (requestId && offerId) {
        // This is a boosting checkout
        setCheckoutType('boost')
        await loadBoostCheckoutData(requestId, offerId, user.id)
      } else {
        // This is a regular listing checkout
        setCheckoutType('listing')
        await loadCartData()
      }
      
      setLoading(false)
    }

    const loadBoostCheckoutData = async (requestId: string, offerId: string, userId: string) => {
      try {
        // Fetch the boost request
        const { data: request, error: requestError } = await supabase
          .from('boost_requests')
          .select('*')
          .eq('id', requestId)
          .eq('customer_id', userId)
          .single()

        if (requestError || !request) {
          console.error('Error loading boost request:', requestError)
          router.push('/boosting/my-requests')
          return
        }

        // Check request status
        if (request.status !== 'open' && request.status !== 'accepted') {
          console.error('Request is not available for checkout')
          router.push('/boosting/my-requests')
          return
        }

        // Fetch the offer with vendor info
const { data: offer, error: offerError } = await supabase
  .from('boost_offers')
  .select(`
    *,
    vendor:profiles!boost_offers_vendor_id_fkey (
      id,
      username,
      avatar_url
    )
  `)
  .eq('id', offerId)
  .eq('request_id', requestId)
  .in('status', ['pending', 'accepted'])
  .single()

        if (offerError || !offer) {
          console.error('Error loading boost offer:', offerError)
          router.push(`/boosting/my-requests/${requestId}`)
          return
        }

        // Fetch vendor boosting stats
        const { data: vendorStats } = await supabase
          .from('vendor_boosting_stats')
          .select('*')
          .eq('vendor_id', offer.vendor_id)
          .single()

        setBoostData({
          request,
          offer: {
            ...offer,
            offered_price: offer.offered_price || request.customer_offer_price,
            platform_fee: offer.platform_fee || request.platform_fee
          },
          vendorStats
        })

      } catch (error) {
        console.error('Error loading boost checkout data:', error)
        router.push('/boosting/my-requests')
      }
    }

    const loadCartData = async () => {
      const cartData = localStorage.getItem('cart')
      if (!cartData) {
        router.push('/cart')
        return
      }

      try {
        const cart = JSON.parse(cartData)
        
        const { data: listing, error } = await supabase
          .from('listings')
          .select(`*, profiles (username, avatar_url, average_rating, verified)`)
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

    checkAuth()
  }, [router, supabase, searchParams])

  // Load PayPal SDK
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setPaypalError('PayPal is not configured. Please contact support.')
      return
    }

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
      setPaypalError('Failed to load PayPal. Please check your internet connection.')
    }
    
    document.body.appendChild(script)
  }, [])

  // Fetch seller stats (only for listing checkout)
  useEffect(() => {
    const fetchSellerStats = async () => {
      if (checkoutType !== 'listing' || !cartItem?.listing.seller_id) return
      
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, review_rating')
          .eq('seller_id', cartItem.listing.seller_id)
          .eq('status', 'completed')
        
        if (!error && orders) {
          const totalSales = orders.length
          const ratedOrders = orders.filter(o => o.review_rating)
          const avgRating = ratedOrders.length > 0 
            ? ratedOrders.reduce((sum, o) => sum + (o.review_rating || 0), 0) / ratedOrders.length 
            : 5
          
          setSellerStats({ rating: avgRating, totalSales })
        }
      } catch (err) {
        console.error('Error fetching seller stats:', err)
      }
    }
    
    fetchSellerStats()
  }, [cartItem, supabase, checkoutType])

  // Re-render PayPal buttons when payment method changes
  useEffect(() => {
    if (selectedPayment === 'paypal' && paypalLoaded) {
      // Reset the rendered flag to allow re-rendering
      paypalButtonsRendered.current = false
      
      // Check we have the required data
      if (checkoutType === 'listing' && cartItem) {
        renderPayPalButtons()
      } else if (checkoutType === 'boost' && boostData) {
        renderPayPalButtons()
      }
    }
  }, [selectedPayment, paypalLoaded, cartItem, boostData, checkoutType, renderPayPalButtons])

  return {
    // Checkout type
    checkoutType,
    boostData,
    
    // Cart & User
    cartItem,
    user,
    loading,
    
    // Billing
    billingInfo,
    setBillingInfo,
    formErrors,
    setFormErrors,
    isFormValid,
    validateForm,
    
    // Payment
    selectedPayment,
    setSelectedPayment,
    processing,
    handlePlaceOrder,
    
    // PayPal
    paypalLoaded,
    paypalError,
    setPaypalError,
    paypalButtonsRef,
    paypalButtonsRendered,
    paypalOrderId,
    renderPayPalButtons,
    
    // Crypto
    cryptoLoading,
    cryptoError,
    setCryptoError,
    handleCryptoPayment,
    
    // Seller/Vendor
    sellerStats,
    vendorPayout,
    
    // Pricing
    subtotal,
    serviceFee,
    total,
    
    // Modals
    showMobileSummary,
    setShowMobileSummary,
    showGuaranteeModal,
    setShowGuaranteeModal
  }
}