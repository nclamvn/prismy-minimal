import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { queueService } from '@/lib/services/queue/queue.service';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, auth) => {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const targetLanguage = formData.get('targetLanguage') as string || 'vi';
      let tier = formData.get('tier') as string || auth.tier || 'basic';
      
      // P0: Validate tier
      const validTiers = ['basic', 'standard', 'premium'];
      if (!validTiers.includes(tier)) {
        console.warn(`Invalid tier "${tier}", defaulting to basic`);
        tier = 'basic';
      }

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Check tier permissions
      if (tier !== 'basic' && auth.tier === 'free') {
        return NextResponse.json(
          { error: 'Upgrade to Pro plan for premium features' },
          { status: 403 }
        );
      }

      const fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Log for debugging
      console.log(`Processing file: ${fileName}, tier: ${tier}, language: ${targetLanguage}`);

      // Add job with validated tier
      const jobId = await queueService.addTranslationJob({
        fileName,
        fileBuffer: buffer,
        config: {
          targetLanguage,
          tier, // Now guaranteed to be valid
        },
        userId: auth.user.id,
      });

      return NextResponse.json({
        jobId,
        message: 'Translation job queued successfully',
        estimatedTime: tier === 'basic' ? '30s' : tier === 'standard' ? '2min' : '5min',
        tier, // Return tier for confirmation
      });

    } catch (error) {
      console.error('Translation error:', error);
      
      Sentry.captureException(error, {
        user: { id: auth.user.id },
        tags: {
          api: 'translate-async',
          tier: auth.tier,
        },
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Translation failed' },
        { status: 500 }
      );
    }
  });
}