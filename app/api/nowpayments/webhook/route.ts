import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function verifySignature(payload: any, receivedSignature: string, secret: string): boolean {
  const sortedParams = JSON.stringify(payload, Object.keys(payload).sort())
  const hmac = crypto.createHmac('sha512', secret)
  hmac.update(sortedParams)
  const computedSignature = hmac.digest('hex')
  return computedSignature === receivedSignature
}

export async function POST(request: NextRequest) {
  try {
    // Get environment variables inside the function
    const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Supabase environment variables not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const payload = await request.json()
    const receivedSignature = request.headers.get('x-nowpayments-sig')

    console.log('NOWPayments webhook received:', payload)

    if (NOWPAYMENTS_IPN_SECRET && receivedSignature) {
      const isValid = verifySignature(payload, receivedSignature, NOWPAYMENTS_IPN_SECRET)
      if (!isValid) {
        console.error('Invalid IPN signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const sessionId = payload.order_id
    const paymentStatus = payload.payment_status
    const paymentId = payload.payment_id

    if (!sessionId) {
      console.log('No order_id in webhook payload, skipping')
      return NextResponse.json({ received: true })
    }

    console.log(`Processing payment status: ${paymentStatus} for session: ${sessionId}`)

    switch (paymentStatus) {
      case 'finished':
        console.log('Payment finished - creating order from session')
        
        // Check if order already exists (duplicate webhook protection)
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_id', String(paymentId))
          .single()

        if (existingOrder) {
          console.log('Order already exists:', existingOrder.id)
          return NextResponse.json({ received: true, message: 'Order already exists' })
        }

        // Get the checkout session data
        const { data: session, error: sessionError } = await supabase
          .from('crypto_checkout_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError || !session) {
          console.error('Checkout session not found:', sessionId)
          return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Create the real order now
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            listing_id: session.listing_id,
            buyer_id: session.buyer_id,
            seller_id: session.seller_id,
            amount: session.amount,
            quantity: session.quantity,
            status: 'paid',
            payment_status: 'paid',
            payment_method: 'crypto',
            payment_id: String(paymentId),
            paid_at: new Date().toISOString()
          })
          .select()
          .single()

        if (orderError || !newOrder) {
          console.error('Failed to create order:', orderError)
          return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
        }

        console.log(`Order created: ${newOrder.id}`)

        // Reduce stock
        const { data: listing } = await supabase
          .from('listings')
          .select('stock')
          .eq('id', session.listing_id)
          .single()

        if (listing) {
          const newStock = Math.max(0, listing.stock - session.quantity)
          await supabase
            .from('listings')
            .update({ 
              stock: newStock,
              status: newStock <= 0 ? 'sold' : 'active'
            })
            .eq('id', session.listing_id)
          
          console.log(`Stock reduced: ${listing.stock} -> ${newStock}`)
        }

        // Delete the checkout session (cleanup)
        await supabase.from('crypto_checkout_sessions').delete().eq('id', sessionId)
        console.log('Checkout session cleaned up')
        
        break

      case 'confirmed':
      case 'confirming':
      case 'sending':
        console.log(`Payment ${paymentStatus} - waiting for completion`)
        break

      case 'partially_paid':
        console.log('Payment partially paid - waiting for full amount')
        break

      case 'failed':
      case 'expired':
      case 'refunded':
        console.log(`Payment ${paymentStatus} - deleting session`)
        await supabase.from('crypto_checkout_sessions').delete().eq('id', sessionId)
        break

      case 'waiting':
        console.log('Payment waiting - no action needed')
        break

      default:
        console.log(`Unhandled payment status: ${paymentStatus}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'NOWPayments webhook endpoint active' })
}