import { NextRequest, NextResponse } from 'next/server';
import { translationQueue } from '@/lib/services/queue/translation.queue';

export async function GET(request: NextRequest) {
  try {
    // Get all job counts
    const counts = await translationQueue.getJobCounts();
    
    // Get all jobs
    const allJobs = await translationQueue.getJobs();
    
    // Clean up old failed jobs
    const failedJobs = await translationQueue.getFailed();
    for (const job of failedJobs) {
      await job.remove();
    }
    
    // Get updated counts
    const updatedCounts = await translationQueue.getJobCounts();
    
    return NextResponse.json({
      before: counts,
      after: updatedCounts,
      removedJobs: failedJobs.length,
      currentJobs: allJobs.length
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}