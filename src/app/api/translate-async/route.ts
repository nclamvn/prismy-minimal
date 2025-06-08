import { NextRequest, NextResponse } from 'next/server';
import { translationQueue } from '@/lib/services/queue/queue.service';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang, tier } = body;

    if (!text || !targetLang || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const jobId = nanoid();
    
    const job = await translationQueue.add('translate', {
      id: jobId,
      text,
      targetLang,
      tier,
    });

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Translation job queued successfully',
    });
  } catch (error) {
    console.error('Queue error:', error);
    return NextResponse.json(
      { error: 'Failed to queue translation' },
      { status: 500 }
    );
  }
}