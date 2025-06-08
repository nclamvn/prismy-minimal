import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Import queue dynamically
    const { translationQueue } = await import('@/lib/services/queue/queue.service');
    
    const job = await translationQueue.getJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    const state = await job.getState();
    const progress = job.progress;
    
    // Get result if completed
    if (state === 'completed') {
      const result = job.returnvalue;
      return NextResponse.json({
        jobId: job.id,
        status: state,
        progress: 100,
        result: result,
        completedAt: job.finishedOn
      });
    }
    
    // Get error if failed
    if (state === 'failed') {
      return NextResponse.json({
        jobId: job.id,
        status: state,
        progress: progress || 0,
        error: job.failedReason,
        failedAt: job.finishedOn
      });
    }
    
    // Return current status
    return NextResponse.json({
      jobId: job.id,
      status: state,
      progress: progress || 0,
      data: job.data
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}