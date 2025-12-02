import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const computedSignature = hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-cc-webhook-signature')

    // Verify signature if secret is configured
    if (COINBASE_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(payload, signature, COINBASE_WEBHOOK_SECRET)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(payload)
    console.log('Coinbase webhook received:', event.type)

    // Create Supabase client with service role for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const eventData = event.data
    const orderId = eventData.metadata?.order_id

    if (!orderId) {
      console.log('No order_id in webhook metadata, skipping')
      return NextResponse.json({ received: true })
    }

    // Handle different event types (both charge and checkout events)
    const eventType = event.type.replace('charge:', '').replace('checkout:', '')
    
    switch (eventType) {
      case 'confirmed':
      case 'completed':
        // Payment confirmed on blockchain
        console.log(`Payment confirmed for order ${orderId}`)
        
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
            }
          }
        }
        break

      case 'pending':
        // Payment detected but not yet confirmed
        console.log(`Payment pending for order ${orderId}`)
        await supabase
          .from('orders')
          .update({ payment_status: 'processing' })
          .eq('id', orderId)
        break

      case 'failed':
      case 'expired':
        // Payment failed or expired
        console.log(`Payment failed/expired for order ${orderId}`)
        await supabase
          .from('orders')
          .update({ 
            status: 'cancelled',
            payment_status: 'failed' 
          })
          .eq('id', orderId)
        break

      case 'delayed':
      case 'underpaid':
        // Payment delayed (underpaid or taking long to confirm)
        console.log(`Payment delayed/underpaid for order ${orderId}`)
        await supabase
          .from('orders')
          .update({ payment_status: 'delayed' })
          .eq('id', orderId)
        break

      case 'resolved':
        // Previously delayed payment now resolved
        console.log(`Payment resolved for order ${orderId}`)
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', orderId)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
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

// Coinbase may send GET requests to verify endpoint
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}