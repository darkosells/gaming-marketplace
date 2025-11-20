// app/api/auth/request-reset/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log('🔍 Password reset requested for:', email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email')
      .eq('email', email.toLowerCase())
      .single()

    console.log('🔍 Profile found:', !!profile)
    if (profileError) {
      console.log('🔍 Profile error:', profileError)
    }

    if (profileError || !profile) {
      // For security, don't reveal if email exists or not
      // Just return success so attackers can't enumerate users
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, you will receive a reset code.' 
      })
    }

    // Generate 6-digit code
    const resetCode = generateVerificationCode()
    console.log('🔍 Generated reset code:', resetCode)
    
    // Hash the code before storing
    const hashedCode = await bcrypt.hash(resetCode, 10)
    console.log('🔍 Hashed code:', hashedCode.substring(0, 20) + '...')
    
    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    console.log('🔍 Expires at:', expiresAt)

    // Store hashed code in database
    console.log('🔍 Updating profile with reset code...')
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        password_reset_code: hashedCode,
        password_reset_code_expires: expiresAt,
        password_reset_attempts: 0
      })
      .eq('id', profile.id)
      .select()

    if (updateError) {
      console.error('❌ Failed to store reset code:', updateError)
      return NextResponse.json(
        { error: 'Failed to process reset request' },
        { status: 500 }
      )
    }

    console.log('✅ Reset code stored in database')
    console.log('🔍 Update result:', updateData)

    // Verify it was saved by reading it back
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('password_reset_code, password_reset_code_expires')
      .eq('id', profile.id)
      .single()

    console.log('🔍 Verification - Code saved:', !!verifyData?.password_reset_code)
    console.log('🔍 Verification - Expires:', verifyData?.password_reset_code_expires)

    // Send email directly from server using Edge Function
    const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/send-order-email'
    
    console.log('📧 Sending password reset email to:', profile.email)
    console.log('📧 Edge Function URL:', EDGE_FUNCTION_URL)

    const emailResponse = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'password_reset',
        userEmail: profile.email,
        username: profile.username,
        resetCode: resetCode
      })
    })

    console.log('📧 Email response status:', emailResponse.status)

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('❌ Failed to send reset email:', errorText)
      // Don't fail the whole request if email fails
      // The code is already saved in the database
    } else {
      console.log('✅ Password reset email sent successfully!')
    }

    return NextResponse.json({ 
      success: true,
      message: 'Reset code sent to your email' 
    })
  } catch (error: any) {
    console.error('❌ Password reset request error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}