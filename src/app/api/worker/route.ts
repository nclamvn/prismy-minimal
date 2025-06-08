import { NextRequest, NextResponse } from 'next/server';
import { translationWorker } from '@/lib/services/queue/worker';

let workerStarted = false;

export async function GET(request: NextRequest) {
  if (!workerStarted) {
    translationWorker.run();
    workerStarted = true;
    
    return NextResponse.json({
      status: 'Worker started',
      message: 'Translation worker is now running'
    });
  }

  return NextResponse.json({
    status: 'Worker already running',
    message: 'Translation worker is already active'
  });
}