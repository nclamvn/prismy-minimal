import { NextRequest, NextResponse } from 'next/server'
import { ApiKeyManager } from '@/lib/auth/api-keys'
import { authMiddleware } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult.status !== 200) return authResult

  const userId = authResult.headers.get('x-user-id')!
  
  try {
    const apiKeys = await ApiKeyManager.getUserApiKeys(userId)
    return NextResponse.json({ apiKeys })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult.status !== 200) return authResult

  const userId = authResult.headers.get('x-user-id')!
  const { name, tier } = await request.json()

  try {
    const apiKey = await ApiKeyManager.createApiKey(userId, name, tier || 'free')
    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
        tier: apiKey.tier,
        createdAt: apiKey.createdAt
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authMiddleware(request)
  if (authResult.status !== 200) return authResult

  const userId = authResult.headers.get('x-user-id')!
  const { searchParams } = new URL(request.url)
  const keyId = searchParams.get('keyId')

  if (!keyId) {
    return NextResponse.json(
      { error: 'Key ID required' },
      { status: 400 }
    )
  }

  try {
    const success = await ApiKeyManager.revokeApiKey(keyId, userId)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}
