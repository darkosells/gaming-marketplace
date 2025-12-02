import { NextRequest, NextResponse } from 'next/server'

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!

// Use sandbox URL for testing, change to live for production
const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  
  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal auth error:', error)
    throw new Error('Failed to get PayPal access token')
  }
  
  const data = await response.json()
  return data.access_token
}

async function capturePayPalOrder(orderId: string, accessToken: string) {
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    console.error('PayPal capture error:', data)
    throw new Error(data.message || 'Failed to capture PayPal order')
  }
  
  return data
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      )
    }
    
    if (!PAYPAL_CLIENT_SECRET) {
      console.error('PAYPAL_CLIENT_SECRET not configured')
      return NextResponse.json(
        { error: 'PayPal not configured on server' },
        { status: 500 }
      )
    }
    
    console.log('Capturing PayPal order:', orderId)
    
    // Get access token
    const accessToken = await getPayPalAccessToken()
    
    // Capture the payment
    const captureData = await capturePayPalOrder(orderId, accessToken)
    
    console.log('PayPal capture response:', JSON.stringify(captureData, null, 2))
    
    if (captureData.status === 'COMPLETED') {
      // Get the capture ID for reference
      const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id
      
      return NextResponse.json({
        success: true,
        status: captureData.status,
        captureId: captureId,
        orderId: captureData.id,
      })
    } else {
      return NextResponse.json({
        success: false,
        status: captureData.status,
        error: 'Payment not completed',
      })
    }
    
  } catch (error: any) {
    console.error('PayPal capture API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture payment' },
      { status: 500 }
    )
  }
}