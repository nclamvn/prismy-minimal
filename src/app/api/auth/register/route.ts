import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json()
    
    // Mock register - always success
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: Date.now().toString(),
        email: email,
        name: name || email.split('@')[0]
      },
      apiKey: {
        id: '1',
        key: 'test-api-key-' + Date.now(),
        name: 'Default Key',
        tier: 'free'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
