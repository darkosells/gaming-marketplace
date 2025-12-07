// app/api/cron/auto-complete/route.ts
// This route is called by Vercel Cron Jobs every hour to auto-complete
// orders that have been in 'delivered' status for more than 48 hours

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron (optional but recommended for security)
    const authHeader = request.headers.get('authorization')
    
    // In production, you should verify the CRON_SECRET
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('🕐 Auto-complete cron job started at:', new Date().toISOString())

    // Find all orders that need to be auto-completed
    // Status is 'delivered', delivered_at is more than 48 hours ago
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: ordersToComplete, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        buyer_id,
        seller_id,
        listing_id,
        delivered_at,
        listing:listings(title)
      `)
      .eq('status', 'delivered')
      .lt('delivered_at', fortyEightHoursAgo)

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!ordersToComplete || ordersToComplete.length === 0) {
      console.log('✅ No orders to auto-complete')
      return NextResponse.json({ 
        success: true, 
        message: 'No orders to auto-complete',
        completed: 0 
      })
    }

    console.log(`📦 Found ${ordersToComplete.length} orders to auto-complete`)

    let completedCount = 0
    let errorCount = 0
    const results: { orderId: string; status: string; error?: string }[] = []

    for (const order of ordersToComplete) {
      try {
        // Update the order status to 'completed'
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', order.id)
          .eq('status', 'delivered') // Double-check status hasn't changed

        if (updateError) {
          console.error(`❌ Failed to complete order ${order.id}:`, updateError)
          results.push({ orderId: order.id, status: 'error', error: updateError.message })
          errorCount++
          continue
        }

        // Note: Seller's balance is automatically calculated from completed orders
        // in the vendor dashboard, so we don't need to update a balance field

        // Send notification to conversation
        try {
          // Find the conversation for this order
          const { data: conversation } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('order_id', order.id)
            .single()

          if (conversation) {
            // Add a system message about auto-completion
            await supabaseAdmin
              .from('messages')
              .insert({
                conversation_id: conversation.id,
                sender_id: order.seller_id, // Use seller as sender for system message
                receiver_id: order.buyer_id,
                listing_id: order.listing_id,
                order_id: order.id,
                content: `✅ Order Auto-Completed\n\nThis order has been automatically completed after the 48-hour buyer protection period expired without any disputes.\n\nThank you for your purchase!`,
                message_type: 'system',
                read: false
              })

            // Update conversation last message
            await supabaseAdmin
              .from('conversations')
              .update({
                last_message: '✅ Order auto-completed',
                last_message_at: new Date().toISOString()
              })
              .eq('id', conversation.id)
          }
        } catch (msgError) {
          // Don't fail if message sending fails
          console.warn(`⚠️ Could not send completion message for order ${order.id}:`, msgError)
        }

        console.log(`✅ Auto-completed order: ${order.id}`)
        results.push({ orderId: order.id, status: 'completed' })
        completedCount++

      } catch (orderError: any) {
        console.error(`❌ Error processing order ${order.id}:`, orderError)
        results.push({ orderId: order.id, status: 'error', error: orderError.message })
        errorCount++
      }
    }

    console.log(`🎉 Auto-complete job finished. Completed: ${completedCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: `Auto-completed ${completedCount} orders`,
      completed: completedCount,
      errors: errorCount,
      results
    })

  } catch (error: any) {
    console.error('❌ Auto-complete cron job failed:', error)
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    )
  }
}