import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY!
const COINBASE_API_URL = 'https://api.commerce.coinbase.com'

interface CreateChargeRequest {
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
    const body: CreateChargeRequest = await request.json()
    
    if (!body.listingId || !body.amount || !body.buyerId || !body.sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!COINBASE_API_KEY) {
      console.error('COINBASE_COMMERCE_API_KEY not configured')
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

    // Create Coinbase Commerce charge
    const chargeData = {
      name: `Nashflare - ${body.listingTitle}`.substring(0, 100),
      description: `Order #${order.id.substring(0, 8)}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: total.toFixed(2),
        currency: 'USD'
      },
      metadata: {
        order_id: order.id,
        listing_id: body.listingId,
        buyer_id: body.buyerId,
        seller_id: body.sellerId,
        quantity: body.quantity.toString()
      },
      redirect_url: `${siteUrl}/order/${order.id}?payment=success`,
      cancel_url: `${siteUrl}/checkout?payment=cancelled`
    }

    console.log('Creating Coinbase charge:', chargeData)

    const response = await fetch(`${COINBASE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(chargeData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Coinbase API error:', result)
      
      // Delete the pending order since charge creation failed
      await supabase.from('orders').delete().eq('id', order.id)
      
      return NextResponse.json(
        { error: result.error?.message || 'Failed to create payment' },
        { status: response.status }
      )
    }

    console.log('Coinbase charge created:', result.data.id)

    // Update order with Coinbase charge ID
    await supabase
      .from('orders')
      .update({ payment_id: result.data.id })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      chargeId: result.data.id,
      hostedUrl: result.data.hosted_url,
      orderId: order.id,
      expiresAt: result.data.expires_at
    })

  } catch (error: any) {
    console.error('Coinbase charge creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}