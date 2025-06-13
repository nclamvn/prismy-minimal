import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface ApiKey {
  id: string
  key: string
  name: string
  userId: string
  tier: string
  requests: number
  lastUsed?: Date | null
  active: boolean
  createdAt: Date
}

export interface ApiKeyUsage {
  current: number
  limit: number
  remaining: number
  tier: string
  resetDate: Date
}

export class ApiKeyManager {
  static generateApiKey(): string {
    const prefix = 'pk_'
    const randomBytes = crypto.randomBytes(32).toString('hex')
    return `${prefix}${randomBytes}`
  }

  static async createApiKey(userId: string, name: string, tier: string = 'free'): Promise<ApiKey> {
    const key = this.generateApiKey()
    
    const rateLimits = {
      free: 100,
      starter: 1000,
      professional: 5000,
      enterprise: 10000
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name,
        userId,
        tier,
        rateLimit: rateLimits[tier as keyof typeof rateLimits] || 100,
        active: true,
        isActive: true
      }
    })

    return apiKey as ApiKey
  }

  static async validateApiKey(key: string): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          key,
          active: true,
          isActive: true
        }
      })

      if (!apiKey) {
        return { valid: false, error: 'Invalid API key' }
      }

      if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
        return { valid: false, error: 'API key expired' }
      }

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { 
          lastUsed: new Date(),
          lastUsedAt: new Date()
        }
      })

      return { valid: true, apiKey: apiKey as ApiKey }
    } catch (error) {
      return { valid: false, error: 'Database error' }
    }
  }

  static async incrementUsage(keyId: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        requests: {
          increment: 1
        }
      }
    })
  }

  static async checkRateLimit(apiKey: ApiKey): Promise<{ allowed: boolean; error?: string }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentRequests = await prisma.apiRequest.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })

//     if (recentRequests >= apiKey.rateLimit) {
//       return { allowed: false, error: 'Rate limit exceeded' }
//     }

    return { allowed: true }
  }

  static async logRequest(apiKeyId: string, endpoint: string, method: string, status: number, duration: number, tier?: string): Promise<void> {
    await prisma.apiRequest.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        status,
        duration,
        tier: tier || 'free'
      }
    })
  }

  static async getUsage(apiKeyId: string): Promise<ApiKeyUsage | null> {
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: apiKeyId }
    })

    if (!apiKey) return null

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentRequests = await prisma.apiRequest.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })

    return {
      current: recentRequests,
      limit: apiKey.rateLimit,
      remaining: Math.max(0, apiKey.rateLimit - recentRequests),
      tier: apiKey.tier,
      resetDate: new Date(Date.now() + 60 * 60 * 1000)
    }
  }

  static async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return apiKeys as ApiKey[]
  }

  static async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      await prisma.apiKey.updateMany({
        where: { 
          id: keyId,
          userId 
        },
        data: { 
          active: false,
          isActive: false
        }
      })
      return true
    } catch (error) {
      return false
    }
  }
}
