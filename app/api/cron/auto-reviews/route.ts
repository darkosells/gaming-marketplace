// app/api/cron/auto-reviews/route.ts
// This route is called by Vercel Cron Jobs to auto-generate 5-star "GG" reviews
// for completed orders after 48 hours if the buyer hasn't left a review

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    console.log('⭐ Auto-reviews cron job started at:', new Date().toISOString())

    // Find completed orders from 48+ hours ago without reviews
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: ordersWithoutReviews, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        buyer_id,
        seller_id,
        listing_id,
        completed_at
      `)
      .eq('status', 'completed')
      .lt('completed_at', fortyEightHoursAgo)

    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!ordersWithoutReviews || ordersWithoutReviews.length === 0) {
      console.log('✅ No orders to check for auto-reviews')
      return NextResponse.json({ 
        success: true, 
        message: 'No orders to process',
        reviewsCreated: 0 
      })
    }

    console.log(`📋 Found ${ordersWithoutReviews.length} completed orders to check`)

    let reviewsCreated = 0
    let skipped = 0
    const results: { orderId: string; status: string; error?: string }[] = []

    for (const order of ordersWithoutReviews) {
      try {
        // Check if review already exists for this order
        const { data: existingReview } = await supabaseAdmin
          .from('reviews')
          .select('id')
          .eq('order_id', order.id)
          .single()

        if (existingReview) {
          // Review already exists, skip
          skipped++
          continue
        }

        // Create auto-generated 5-star "GG" review
        const { error: insertError } = await supabaseAdmin
          .from('reviews')
          .insert({
            order_id: order.id,
            buyer_id: order.buyer_id,
            seller_id: order.seller_id,
            rating: 5,
            comment: 'GG',
            is_auto_generated: true
          })

        if (insertError) {
          console.error(`❌ Failed to create review for order ${order.id}:`, insertError)
          results.push({ orderId: order.id, status: 'error', error: insertError.message })
          continue
        }

        console.log(`⭐ Auto-review created for order: ${order.id}`)
        results.push({ orderId: order.id, status: 'created' })
        reviewsCreated++

      } catch (orderError: any) {
        console.error(`❌ Error processing order ${order.id}:`, orderError)
        results.push({ orderId: order.id, status: 'error', error: orderError.message })
      }
    }

    console.log(`🎉 Auto-reviews job finished. Created: ${reviewsCreated}, Skipped: ${skipped}`)

    return NextResponse.json({
      success: true,
      message: `Created ${reviewsCreated} auto-reviews`,
      reviewsCreated,
      skipped,
      results
    })

  } catch (error: any) {
    console.error('❌ Auto-reviews cron job failed:', error)
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    )
  }
}