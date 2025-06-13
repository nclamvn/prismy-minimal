import { NextRequest, NextResponse } from 'next/server'
import { ApiKeyManager } from '@/lib/auth/api-keys'

export async function authMiddleware(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' },
      { status: 401 }
    )
  }

  const validation = await ApiKeyManager.validateApiKey(apiKey)
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.error?.includes('limit') ? 429 : 401 }
    )
  }

  if (validation.apiKey) {
    const rateLimit = await ApiKeyManager.checkRateLimit(validation.apiKey)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error },
        { status: 429 }
      )
    }
  }

  const response = NextResponse.next()
  response.headers.set('x-user-id', validation.apiKey!.userId)
  response.headers.set('x-tier', validation.apiKey!.tier)
  response.headers.set('x-api-key-id', validation.apiKey!.id)

  return response
}

export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const authResult = await authMiddleware(request)
    
    if (authResult.status !== 200) {
      return authResult
    }

    const userId = authResult.headers.get('x-user-id')
    const tier = authResult.headers.get('x-tier')
    const apiKeyId = authResult.headers.get('x-api-key-id')

    const authContext = {
      userId,
      tier,
      apiKeyId,
      user: { id: userId }
    }

    return handler(request, authContext)
  }
}
