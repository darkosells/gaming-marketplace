import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOWPAYMENTS_API_URL_PRODUCTION = 'https://api.nowpayments.io/v1'
const NOWPAYMENTS_API_URL_SANDBOX = 'https://api-sandbox.nowpayments.io/v1'

interface CreateInvoiceRequest {
  listingId: string
  listingTitle: string
  amount: number
  quantity: number
  buyerId: string
  sellerId: string
  billingEmail: string
}

export async function POST(request: NextRequest) {
  try {
    // Get environment variables inside the function
    const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const isSandbox = process.env.NOWPAYMENTS_SANDBOX === 'true'
    const NOWPAYMENTS_API_URL = isSandbox ? NOWPAYMENTS_API_URL_SANDBOX : NOWPAYMENTS_API_URL_PRODUCTION

    const body: CreateInvoiceRequest = await request.json()
    
    if (!body.listingId || !body.amount || !body.buyerId || !body.sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!NOWPAYMENTS_API_KEY) {
      console.error('NOWPAYMENTS_API_KEY not configured')
      return NextResponse.json(
        { error: 'Cryptocurrency payments are not available yet. Please use PayPal or try again later.' },
        { status: 503 }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Supabase environment variables not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log(`NOWPayments mode: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}`)
    console.log(`API URL: ${NOWPAYMENTS_API_URL}`)

    // Calculate totals
    const subtotal = body.amount
    const serviceFee = subtotal * 0.05
    const total = subtotal + serviceFee

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nashflare.com'

    // Create temporary checkout session (NOT a real order)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    const { data: session, error: sessionError } = await supabase
      .from('crypto_checkout_sessions')
      .insert({
        listing_id: body.listingId,
        buyer_id: body.buyerId,
        seller_id: body.sellerId,
        amount: subtotal,
        quantity: body.quantity,
        listing_title: body.listingTitle
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      console.error('Failed to create checkout session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to initialize checkout' },
        { status: 500 }
      )
    }

    console.log('Checkout session created:', session.id)

    // Use short session ID for NOWPayments
    const invoiceData = {
      price_amount: total,
      price_currency: 'USD',
      order_id: session.id,
      order_description: `Nashflare - ${body.listingTitle}`.substring(0, 150),
      ipn_callback_url: `${siteUrl}/api/nowpayments/webhook`,
      success_url: `${siteUrl}/orders?payment=crypto_pending`,
      cancel_url: `${siteUrl}/checkout?payment=cancelled`
    }

    console.log('Creating NOWPayments invoice:', invoiceData)

    const response = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NOWPAYMENTS_API_KEY
      },
      body: JSON.stringify(invoiceData)
    })

    const result = await response.json()
    console.log('NOWPayments API response:', response.status, JSON.stringify(result))

    if (!response.ok) {
      console.error('NOWPayments API error:', result)
      
      // Clean up the session since invoice creation failed
      await supabase.from('crypto_checkout_sessions').delete().eq('id', session.id)
      
      return NextResponse.json(
        { error: result.message || 'Failed to create crypto payment' },
        { status: response.status }
      )
    }

    console.log('NOWPayments invoice created:', result.id)

    return NextResponse.json({
      success: true,
      invoiceId: result.id,
      invoiceUrl: result.invoice_url
    })

  } catch (error: any) {
    console.error('NOWPayments invoice creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}