import { NextRequest, NextResponse } from 'next/server'
import { ApiKeyManager } from '@/lib/auth/api-keys'

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' },
      { status: 401 }
    )
  }

  try {
    const validation = await ApiKeyManager.validateApiKey(apiKey)
    
    if (!validation.valid || !validation.apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const usage = await ApiKeyManager.getUsage(validation.apiKey.id)
    
    return NextResponse.json(usage)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    )
  }
}
