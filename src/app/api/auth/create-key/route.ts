import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateApiKey } from '@/lib/auth/api-key';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, name, tier = 'free' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name },
      });
    }

    // Generate API key
    const apiKey = generateApiKey(tier);

    // Save to database
    const key = await prisma.apiKey.create({
      data: {
        key: apiKey,
        userId: user.id,
        tier,
        name: `${tier} API Key`,
        rateLimit: tier === 'free' ? 100 : tier === 'pro' ? 1000 : 10000,
      },
    });

    return NextResponse.json({
      apiKey: key.key,
      tier: key.tier,
      rateLimit: key.rateLimit,
      message: 'API key created successfully',
    });

  } catch (error) {
    console.error('Create key error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}