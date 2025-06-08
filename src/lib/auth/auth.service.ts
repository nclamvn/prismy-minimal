import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export class AuthService {
  async validateApiKey(apiKey: string) {
    try {
      const key = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { user: true }
      });

      if (!key || !key.isActive) {
        return null;
      }

      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: key.id },
        data: { lastUsedAt: new Date() }
      });

      return key;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  async trackApiUsage(
    apiKeyId: string,
    userId: string,
    data: {
      endpoint: string;
      method: string;
      responseTime: number;
      statusCode: number;
    }
  ) {
    try {
      await prisma.apiRequest.create({
        data: {
          apiKeyId,
          userId,
          ...data
        }
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  generateApiKey(): string {
    const prefix = process.env.NODE_ENV === 'production' ? 'sk_live_' : 'sk_test_';
    const randomBytes = Array.from({ length: 32 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('');
    return prefix + randomBytes;
  }

  async createApiKey(userId: string, name: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return prisma.apiKey.create({
      data: {
        key: this.generateApiKey(),
        name,
        userId
      }
    });
  }
}

export const authService = new AuthService();