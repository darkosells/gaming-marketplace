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

// Helper function to send order emails via Edge Function
async function sendOrderEmailsFromWebhook(data: {
  orderId: string
  listingTitle: string
  quantity: number
  totalAmount: number
  sellerAmount: number
  buyerEmail: string
  sellerEmail: string
  buyerUsername: string
  sellerUsername: string
}) {
  const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/send-order-email'
  
  try {
    // Send buyer confirmation email
    await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        type: 'order_confirmation',
        buyerEmail: data.buyerEmail,
        buyerUsername: data.buyerUsername,
        orderId: data.orderId,
        listingTitle: data.listingTitle,
        amount: data.totalAmount,
        quantity: data.quantity,
        sellerUsername: data.sellerUsername
      })
    })
    console.log('✅ Buyer confirmation email sent')

    // Send seller notification email
    await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        type: 'new_sale',
        sellerEmail: data.sellerEmail,
        sellerUsername: data.sellerUsername,
        orderId: data.orderId,
        listingTitle: data.listingTitle,
        amount: data.sellerAmount,
        quantity: data.quantity,
        buyerUsername: data.buyerUsername
      })
    })
    console.log('✅ Seller notification email sent')

  } catch (error) {
    console.error('❌ Failed to send order emails:', error)
    // Don't throw - emails are non-critical, order is already created
  }
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
          .select('stock, title')
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

        // ========================================
        // 📧 SEND ORDER CONFIRMATION EMAILS
        // ========================================
        try {
          // Fetch buyer info
          const { data: buyer } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', session.buyer_id)
            .single()

          // Fetch seller info
          const { data: seller } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', session.seller_id)
            .single()

          if (buyer && seller && listing) {
            // Calculate seller amount (95% after 5% fee)
            const sellerAmount = session.amount * 0.95

            await sendOrderEmailsFromWebhook({
              orderId: newOrder.id,
              listingTitle: session.listing_title || listing.title || 'Gaming Item',
              quantity: session.quantity,
              totalAmount: session.amount,
              sellerAmount: sellerAmount,
              buyerEmail: buyer.email,
              sellerEmail: seller.email,
              buyerUsername: buyer.username || 'Buyer',
              sellerUsername: seller.username || 'Seller'
            })
            console.log('📧 Order confirmation emails sent successfully')
          } else {
            console.warn('⚠️ Could not send emails - missing buyer/seller/listing data')
          }
        } catch (emailError) {
          console.error('❌ Email sending failed (non-critical):', emailError)
          // Don't fail the webhook - order is already created
        }
        // ========================================

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