import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1'

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

    // Calculate totals
    const subtotal = body.amount
    const serviceFee = subtotal * 0.05
    const total = subtotal + serviceFee

    // Get the site URL for redirects
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nashflare.com'

    // Create a pending order first to get an order ID
    const supabase = createClient()
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        listing_id: body.listingId,
        buyer_id: body.buyerId,
        seller_id: body.sellerId,
        amount: subtotal,
        quantity: body.quantity,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'crypto'
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create NOWPayments invoice
    const invoiceData = {
      price_amount: total,
      price_currency: 'usd',
      order_id: order.id,
      order_description: `Nashflare - ${body.listingTitle}`.substring(0, 150),
      ipn_callback_url: `${siteUrl}/api/nowpayments/webhook`,
      success_url: `${siteUrl}/order/${order.id}?payment=success`,
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
      
      // Delete the pending order since invoice creation failed
      await supabase.from('orders').delete().eq('id', order.id)
      
      return NextResponse.json(
        { error: result.message || 'Failed to create crypto payment' },
        { status: response.status }
      )
    }

    console.log('NOWPayments invoice created:', result.id)

    // Update order with NOWPayments invoice ID
    await supabase
      .from('orders')
      .update({ payment_id: result.id })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      invoiceId: result.id,
      invoiceUrl: result.invoice_url,
      orderId: order.id
    })

  } catch (error: any) {
    console.error('NOWPayments invoice creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}