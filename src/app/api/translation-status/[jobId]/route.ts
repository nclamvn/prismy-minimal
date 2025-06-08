import { NextRequest, NextResponse } from 'next/server';
import { translationQueue } from '@/lib/services/queue/queue.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    const job = await translationQueue.getJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;

    return NextResponse.json({
      jobId,
      state,
      progress,
      result,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}