import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Verify IPN signature
function verifySignature(payload: any, receivedSignature: string, secret: string): boolean {
  // Sort parameters alphabetically
  const sortedParams = JSON.stringify(payload, Object.keys(payload).sort())
  
  // Create HMAC SHA-512 signature
  const hmac = crypto.createHmac('sha512', secret)
  hmac.update(sortedParams)
  const computedSignature = hmac.digest('hex')
  
  return computedSignature === receivedSignature
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

    // Create Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const orderId = payload.order_id
    const paymentStatus = payload.payment_status

    if (!orderId) {
      console.log('No order_id in webhook payload, skipping')
      return NextResponse.json({ received: true })
    }

    console.log(`Processing payment status: ${paymentStatus} for order: ${orderId}`)

    // Handle different payment statuses
    // NOWPayments statuses: waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired
    switch (paymentStatus) {
      case 'finished':
        // Payment completed successfully
        console.log(`Payment finished for order ${orderId}`)
        
        // Update order to paid
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .eq('payment_status', 'pending') // Only update if still pending

        if (updateError) {
          console.error('Failed to update order:', updateError)
        } else {
          console.log(`Order ${orderId} marked as paid`)
          
          // Reduce stock
          const { data: order } = await supabase
            .from('orders')
            .select('listing_id, quantity')
            .eq('id', orderId)
            .single()

          if (order) {
            const { data: listing } = await supabase
              .from('listings')
              .select('stock')
              .eq('id', order.listing_id)
              .single()

            if (listing) {
              const newStock = Math.max(0, listing.stock - order.quantity)
              await supabase
                .from('listings')
                .update({ 
                  stock: newStock,
                  status: newStock <= 0 ? 'sold' : 'active'
                })
                .eq('id', order.listing_id)
              
              console.log(`Stock reduced for listing ${order.listing_id}: ${listing.stock} -> ${newStock}`)
            }
          }
        }
        break

      case 'confirmed':
      case 'sending':
        // Payment confirmed on blockchain, being processed
        console.log(`Payment confirmed/sending for order ${orderId}`)
        await supabase
          .from('orders')
          .update({ payment_status: 'processing' })
          .eq('id', orderId)
        break

      case 'confirming':
        // Transaction detected, waiting for confirmations
        console.log(`Payment confirming for order ${orderId}`)
        await supabase
          .from('orders')
          .update({ payment_status: 'confirming' })
          .eq('id', orderId)
        break

      case 'partially_paid':
        // Customer sent less than required
        console.log(`Payment partially paid for order ${orderId}`)
        await supabase
          .from('orders')
          .update({ payment_status: 'partial' })
          .eq('id', orderId)
        break

      case 'failed':
      case 'expired':
      case 'refunded':
        // Payment failed, expired, or refunded
        console.log(`Payment ${paymentStatus} for order ${orderId}`)
        await supabase
          .from('orders')
          .update({ 
            status: 'cancelled',
            payment_status: paymentStatus 
          })
          .eq('id', orderId)
        break

      case 'waiting':
        // Waiting for customer to send payment
        console.log(`Payment waiting for order ${orderId}`)
        // No action needed, order already in pending state
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

// NOWPayments may send GET requests to verify endpoint
export async function GET() {
  return NextResponse.json({ status: 'NOWPayments webhook endpoint active' })
}