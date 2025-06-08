import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, checkRateLimit, trackApiRequest } from '@/lib/auth/api-key';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, auth: any) => Promise<NextResponse>
) {
  const startTime = Date.now();
  
  // Get API key from header
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required. Get your key at https://prismy.in/dashboard' },
      { status: 401 }
    );
  }

  // Validate API key
  const validation = await validateApiKey(apiKey);
  
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401 }
    );
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(
    validation.key!.id, 
    validation.rateLimit!
  );
  
  if (!withinLimit) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        limit: validation.rateLimit,
        reset: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      { status: 429 }
    );
  }

  // Process request
  let response: NextResponse;
  let status = 200;
  
  try {
    response = await handler(request, validation);
    status = response.status;
  } catch (error) {
    status = 500;
    throw error;
  } finally {
    // Track request
    const duration = Date.now() - startTime;
    await trackApiRequest(
      validation.key!.id,
      request.nextUrl.pathname,
      request.method,
      status,
      duration,
      {
        tier: validation.tier,
      }
    );
  }

  return response;
}