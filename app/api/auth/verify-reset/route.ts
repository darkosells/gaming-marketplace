// app/api/auth/verify-reset/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

const MAX_ATTEMPTS = 5

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json()

    console.log('🔍 Verify reset called for email:', email)
    console.log('🔍 Code provided:', code)

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required' },
        { status: 400 }
      )
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get user with reset code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email, password_reset_code, password_reset_code_expires, password_reset_attempts')
      .eq('email', email.toLowerCase())
      .single()

    console.log('🔍 Profile found:', !!profile)
    console.log('🔍 Has reset code:', !!profile?.password_reset_code)
    console.log('🔍 Code expires at:', profile?.password_reset_code_expires)

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.json(
        { error: 'Invalid email or code' },
        { status: 400 }
      )
    }

    // Check if code exists
    if (!profile.password_reset_code || !profile.password_reset_code_expires) {
      console.error('❌ No reset code found in database')
      return NextResponse.json(
        { error: 'No reset code found. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if code has expired
    const expiryDate = new Date(profile.password_reset_code_expires)
    const now = new Date()
    console.log('🔍 Code expiry:', expiryDate)
    console.log('🔍 Current time:', now)
    console.log('🔍 Is expired:', expiryDate < now)

    if (expiryDate < now) {
      return NextResponse.json(
        { error: 'Reset code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check attempts
    if (profile.password_reset_attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new reset code.' },
        { status: 400 }
      )
    }

    // Verify code
    console.log('🔍 Comparing codes...')
    const isValidCode = await bcrypt.compare(code, profile.password_reset_code)
    console.log('🔍 Code valid:', isValidCode)

    if (!isValidCode) {
      // Increment failed attempts
      await supabase
        .from('profiles')
        .update({
          password_reset_attempts: (profile.password_reset_attempts || 0) + 1
        })
        .eq('id', profile.id)

      const attemptsLeft = MAX_ATTEMPTS - (profile.password_reset_attempts || 0) - 1
      return NextResponse.json(
        { error: `Invalid code. ${attemptsLeft} attempts remaining.` },
        { status: 400 }
      )
    }

    console.log('✅ Code verified! Updating password...')

    // Code is valid! Now update password using Supabase Admin API
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user by email from auth
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Failed to get users:', getUserError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    const authUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!authUser) {
      console.error('❌ Auth user not found')
      return NextResponse.json(
        { error: 'User not found in authentication system' },
        { status: 400 }
      )
    }

    console.log('✅ Auth user found, updating password...')

    // Update password using admin API
    const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    )

    if (updatePasswordError) {
      console.error('Failed to update password:', updatePasswordError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    console.log('✅ Password updated! Clearing reset code...')

    // Clear reset code from database
    await supabase
      .from('profiles')
      .update({
        password_reset_code: null,
        password_reset_code_expires: null,
        password_reset_attempts: 0
      })
      .eq('id', profile.id)

    console.log('✅ Sending confirmation email...')

    // Send password changed confirmation email
    const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/send-order-email'
    
    await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'password_changed',
        userEmail: profile.email,
        username: profile.username
      })
    })

    console.log('✅ Password reset complete!')

    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully' 
    })
  } catch (error: any) {
    console.error('❌ Password reset verification error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}