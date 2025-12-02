import { NextRequest, NextResponse } from 'next/server'

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!

// Use sandbox for testing, production for live
// Set NOWPAYMENTS_SANDBOX=true in Vercel env vars to use sandbox
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_SANDBOX === 'true'
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1'

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
        { error: 'Cryptocurrency payments not configured' },
        { status: 500 }
      )
    }

    // Log which mode we're using
    const isSandbox = process.env.NOWPAYMENTS_SANDBOX === 'true'
    console.log(`NOWPayments mode: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}`)
    console.log(`API URL: ${NOWPAYMENTS_API_URL}`)

    // Calculate totals
    const subtotal = body.amount
    const serviceFee = subtotal * 0.05
    const total = subtotal + serviceFee

    // Get the site URL for redirects
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nashflare.com'

    // DON'T create order yet - only create when payment is confirmed via webhook
    // Store all order details in the invoice order_id field as JSON
    const orderData = {
      listing_id: body.listingId,
      buyer_id: body.buyerId,
      seller_id: body.sellerId,
      amount: subtotal,
      quantity: body.quantity,
      listing_title: body.listingTitle
    }

    // Create NOWPayments invoice
    // We encode order data in order_id field (NOWPayments allows up to 512 chars)
    const invoiceData = {
      price_amount: total,
      price_currency: 'usd',
      order_id: Buffer.from(JSON.stringify(orderData)).toString('base64'),
      order_description: `Nashflare - ${body.listingTitle}`.substring(0, 150),
      ipn_callback_url: `${siteUrl}/api/nowpayments/webhook`,
      success_url: `${siteUrl}/orders?payment=crypto_pending`,
      cancel_url: `${siteUrl}/checkout?payment=cancelled`
    }

    console.log('Creating NOWPayments invoice:', { ...invoiceData, order_id: '[encoded]' })

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