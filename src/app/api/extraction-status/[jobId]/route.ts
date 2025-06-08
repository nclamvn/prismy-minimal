import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    const { extractionQueue } = await import('@/lib/services/queue/extraction-queue.service');
    
    const job = await extractionQueue.getJob(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    const state = await job.getState();
    
    if (state === 'completed') {
      const result = job.returnvalue;
      return NextResponse.json({
        jobId: job.id,
        status: 'completed',
        result: {
          text: result.text,
          pageCount: result.pageCount,
          fileName: result.fileName
        }
      });
    }
    
    return NextResponse.json({
      jobId: job.id,
      status: state,
      progress: job.progress || 0
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}