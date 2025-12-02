import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Verify IPN signature
function verifySignature(payload: any, receivedSignature: string, secret: string): boolean {
  const sortedParams = JSON.stringify(payload, Object.keys(payload).sort())
  const hmac = crypto.createHmac('sha512', secret)
  hmac.update(sortedParams)
  const computedSignature = hmac.digest('hex')
  return computedSignature === receivedSignature
}

// Decode order data from base64
function decodeOrderData(encodedOrderId: string): any {
  try {
    const decoded = Buffer.from(encodedOrderId, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode order data:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const receivedSignature = request.headers.get('x-nowpayments-sig')

    console.log('NOWPayments webhook received:', payload)

    // Verify signature if IPN secret is configured
    if (NOWPAYMENTS_IPN_SECRET && receivedSignature) {
      const isValid = verifySignature(payload, receivedSignature, NOWPAYMENTS_IPN_SECRET)
      if (!isValid) {
        console.error('Invalid IPN signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const encodedOrderId = payload.order_id
    const paymentStatus = payload.payment_status
    const paymentId = payload.payment_id

    if (!encodedOrderId) {
      console.log('No order_id in webhook payload, skipping')
      return NextResponse.json({ received: true })
    }

    // Decode order data from the order_id field
    const orderData = decodeOrderData(encodedOrderId)
    if (!orderData) {
      console.error('Failed to decode order data')
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 })
    }

    console.log(`Processing payment status: ${paymentStatus}`)
    console.log('Order data:', orderData)

    switch (paymentStatus) {
      case 'finished':
        // Payment completed - NOW create the order!
        console.log('Payment finished - creating order')
        
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

        // Create the order now that payment is confirmed
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            listing_id: orderData.listing_id,
            buyer_id: orderData.buyer_id,
            seller_id: orderData.seller_id,
            amount: orderData.amount,
            quantity: orderData.quantity,
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
          .eq('id', orderData.listing_id)
          .single()

        if (listing) {
          const newStock = Math.max(0, listing.stock - orderData.quantity)
          await supabase
            .from('listings')
            .update({ 
              stock: newStock,
              status: newStock <= 0 ? 'sold' : 'active'
            })
            .eq('id', orderData.listing_id)
          
          console.log(`Stock reduced: ${listing.stock} -> ${newStock}`)
        }
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
        console.log(`Payment ${paymentStatus} - no order created`)
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