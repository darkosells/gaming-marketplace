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

    // Create Coinbase Commerce invoice/charge
    const invoiceData = {
      business_name: 'Nashflare',
      customer_email: body.billingEmail,
      customer_name: 'Customer',
      memo: `Order #${order.id.substring(0, 8)} - ${body.listingTitle}`.substring(0, 200),
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

    console.log('Creating Coinbase invoice:', invoiceData)

    const response = await fetch(`${COINBASE_API_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(invoiceData)
    })

    const result = await response.json()
    console.log('Coinbase API response:', response.status, JSON.stringify(result))

    if (!response.ok) {
      console.error('Coinbase API error:', result)
      
      // If invoices don't work, try the legacy charges endpoint
      console.log('Trying legacy charges endpoint...')
      
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

      const chargeResponse = await fetch(`${COINBASE_API_URL}/charges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22'
        },
        body: JSON.stringify(chargeData)
      })

      const chargeResult = await chargeResponse.json()
      console.log('Charges API response:', chargeResponse.status, JSON.stringify(chargeResult))

      if (!chargeResponse.ok) {
        // Delete the pending order since both methods failed
        await supabase.from('orders').delete().eq('id', order.id)
        
        return NextResponse.json(
          { error: chargeResult.error?.message || result.error?.message || 'Failed to create payment. Please check your Coinbase Commerce account setup.' },
          { status: chargeResponse.status }
        )
      }

      // Charges endpoint worked
      await supabase
        .from('orders')
        .update({ payment_id: chargeResult.data.id })
        .eq('id', order.id)

      return NextResponse.json({
        success: true,
        chargeId: chargeResult.data.id,
        hostedUrl: chargeResult.data.hosted_url,
        orderId: order.id
      })
    }

    console.log('Coinbase invoice created:', result.data.id)

    // Update order with Coinbase invoice ID
    await supabase
      .from('orders')
      .update({ payment_id: result.data.id })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      invoiceId: result.data.id,
      hostedUrl: result.data.hosted_url,
      orderId: order.id
    })

  } catch (error: any) {
    console.error('Coinbase payment creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}