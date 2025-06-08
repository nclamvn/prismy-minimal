import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

const prisma = new PrismaClient();

// Generate API key với prefix
export function generateApiKey(tier: string = 'free'): string {
  const prefix = tier === 'enterprise' ? 'sk_live_' : 'sk_test_';
  return prefix + nanoid(32);
}

// Validate API key
export async function validateApiKey(apiKey: string) {
  try {
    const key = await prisma.apiKey.findUnique({
      where: { 
        key: apiKey,
        active: true,
      },
      include: {
        user: true,
      },
    });

    if (!key) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check expiration
    if (key.expiresAt && new Date() > key.expiresAt) {
      return { valid: false, error: 'API key expired' };
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { 
        lastUsed: new Date(),
        requests: { increment: 1 },
      },
    });

    return { 
      valid: true, 
      key,
      user: key.user,
      tier: key.tier,
      rateLimit: key.rateLimit,
    };
  } catch (error) {
    Sentry.captureException(error);
    return { valid: false, error: 'Database error' };
  }
}

// Track API request
export async function trackApiRequest(
  apiKeyId: string, 
  endpoint: string,
  method: string,
  status: number,
  duration: number,
  metadata?: {
    tier?: string;
    fileSize?: number;
    language?: string;
  }
) {
  try {
    await prisma.apiRequest.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        status,
        duration,
        ...metadata,
      },
    });
  } catch (error) {
    // Log but don't throw - tracking shouldn't break the request
    console.error('Failed to track API request:', error);
    Sentry.captureException(error);
  }
}

// Check rate limit
export async function checkRateLimit(apiKeyId: string, limit: number): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const requestCount = await prisma.apiRequest.count({
    where: {
      apiKeyId,
      createdAt: { gte: oneHourAgo },
    },
  });

  return requestCount < limit;
}