// src/lib/auth/api-key.ts
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

// Track API request - FIXED VERSION
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
    pages?: number;  // Added pages support
  }
) {
  try {
    // Extract tier and other metadata
    const { tier, ...otherMetadata } = metadata || {};
    
    await prisma.apiRequest.create({
      data: {
        apiKey: {
          connect: { id: apiKeyId }  // Use connect instead of apiKeyId
        },
        endpoint,
        method,
        status,
        duration,
        tier: tier || 'free',  // Set tier separately as it's a required field
        // Conditionally add optional fields
        ...(otherMetadata.fileSize && { fileSize: otherMetadata.fileSize }),
        ...(otherMetadata.language && { language: otherMetadata.language }),
        ...(otherMetadata.pages && { pages: otherMetadata.pages }),
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
      apiKeyId: apiKeyId,  // Use apiKeyId directly - it's indexed
      createdAt: { gte: oneHourAgo },
    },
  });

  return requestCount < limit;
}

// Get API usage stats (useful for dashboard)
export async function getApiUsageStats(apiKeyId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    const [totalRequests, requestsByEndpoint, requestsByStatus] = await Promise.all([
      // Total requests
      prisma.apiRequest.count({
        where: {
          apiKeyId,
          createdAt: { gte: startDate },
        },
      }),
      
      // Requests grouped by endpoint
      prisma.apiRequest.groupBy({
        by: ['endpoint'],
        where: {
          apiKeyId,
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: {
          _count: {
            endpoint: 'desc',
          },
        },
        take: 10,
      }),
      
      // Requests grouped by status
      prisma.apiRequest.groupBy({
        by: ['status'],
        where: {
          apiKeyId,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ]);
    
    return {
      totalRequests,
      requestsByEndpoint,
      requestsByStatus,
      period: { startDate, endDate: new Date() },
    };
  } catch (error) {
    console.error('Failed to get API usage stats:', error);
    Sentry.captureException(error);
    return null;
  }
}

// Revoke API key
export async function revokeApiKey(apiKeyId: string) {
  try {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { 
        active: false,
        isActive: false,  // Update both fields for compatibility
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    Sentry.captureException(error);
    return { success: false, error: 'Failed to revoke key' };
  }
}