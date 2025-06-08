import * as Sentry from '@sentry/nextjs';

/* ----------------------------------------------------
 *  QUEUE INITIALISATION
 * --------------------------------------------------*/
let connection: any;
let translationQueue: any;

// Disable queue for Vercel deployment
if (process.env.VERCEL) {
  console.log('Running on Vercel - Queue features disabled');
  process.env.DISABLE_QUEUE = 'true';
}

// Check if queue is disabled for production
if (process.env.DISABLE_QUEUE === 'true') {
  console.log('Queue disabled for production environment');

  translationQueue = {
    add: async (name: string, data: any) => {
      Sentry.addBreadcrumb({
        message: 'Dummy job created (queue disabled)',
        level: 'info',
        data: { name, tier: data.tier || data.config?.tier }
      });
      return { 
        id: 'dummy-job-id', 
        data: {}, 
        opts: {} 
      };
    },
    getJob: async () => null,
    close: async () => {},
    getWaitingCount: async () => 0,
    getActiveCount: async () => 0,
    getCompletedCount: async () => 0,
    getFailedCount: async () => 0,
    getDelayedCount: async () => 0,
    getJobs: async () => [],
    clean: async () => [],
    on: () => {},
  };
} else {
  try {
    const { Queue } = require('bullmq');
    const Redis = require('ioredis');

    // Check if we have Upstash credentials
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      console.warn('⚠️ Upstash Redis detected but not compatible with BullMQ blocking commands.');
      console.warn('⚠️ Using local Redis instead. Please install Redis locally: brew install redis');
    }

    // Always use local Redis for BullMQ
    connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    connection.on('error', (err: any) => {
      console.error('Redis connection error:', err);
      console.error('Please make sure Redis is running: brew services start redis');
      
      Sentry.captureException(err, {
        tags: {
          component: 'redis',
          service: 'queue'
        },
        extra: {
          redisHost: process.env.REDIS_HOST || 'localhost',
          redisPort: process.env.REDIS_PORT || '6379'
        }
      });
    });

    connection.on('connect', () => {
      console.log(`✅ Redis connected successfully to ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`);
      Sentry.addBreadcrumb({
        message: 'Redis connected successfully',
        level: 'info',
        category: 'redis'
      });
    });

    translationQueue = new Queue('translation', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // 1 hour
          count: 100
        },
        removeOnFail: {
          age: 24 * 3600 // 24 hours
        },
      },
    });

    // Add queue event listeners for monitoring
    translationQueue.on('completed', (job: any) => {
      Sentry.addBreadcrumb({
        message: `Job ${job.id} completed`,
        level: 'info',
        category: 'queue',
        data: {
          jobId: job.id,
          tier: job.data?.tier || job.data?.config?.tier,
          duration: job.finishedOn - job.processedOn
        }
      });
    });

    translationQueue.on('failed', (job: any, err: Error) => {
      Sentry.captureException(err, {
        tags: {
          component: 'queue',
          jobId: job.id,
          tier: job.data?.tier || job.data?.config?.tier
        },
        extra: {
          jobData: job.data,
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize queue:', error);
    // Fallback to disabled queue
    process.env.DISABLE_QUEUE = 'true';
    translationQueue = {
      add: async () => ({ id: 'dummy-job-id', data: {}, opts: {} }),
      getJob: async () => null,
      close: async () => {},
      getWaitingCount: async () => 0,
      getActiveCount: async () => 0,
      getCompletedCount: async () => 0,
      getFailedCount: async () => 0,
      getDelayedCount: async () => 0,
      getJobs: async () => [],
      clean: async () => [],
      on: () => {},
    };
  }
}

export { translationQueue };

/* ----------------------------------------------------
 *  TYPES
 * --------------------------------------------------*/
export interface TranslationJobData {
  id: string;
  fileName: string;
  fileBuffer?: Buffer;
  text?: string;
  targetLang: string;
  tier: 'basic' | 'standard' | 'premium';
  chunks?: any[];
  userId?: string;
  // Keep config for backward compatibility
  config?: {
    targetLanguage: string;
    tier: string;
  };
}

export interface TranslationJobResult {
  translatedText?: string;
  translatedChunks?: any[];
  processingTime: number;
  metadata?: {
    totalChunks: number;
    tier: string;
    targetLanguage: string;
  };
}

/* ----------------------------------------------------
 *  HELPERS
 * --------------------------------------------------*/
export function trackJobPerformance(jobId: string, tier: string) {
  Sentry.addBreadcrumb({
    message: `Starting job ${jobId}`,
    category: 'performance',
    level: 'info',
    data: { jobId, tier }
  });
  
  const startTime = Date.now();
  
  return {
    finish: (result?: 'success' | 'failure') => {
      const duration = Date.now() - startTime;
      
      Sentry.addBreadcrumb({
        message: `Job ${jobId} completed`,
        category: 'performance',
        level: result === 'success' ? 'info' : 'error',
        data: {
          jobId,
          tier,
          result,
          duration
        }
      });
      
      console.log(`Job ${jobId} (${tier}) ${result} in ${duration}ms`);
    }
  };
}

/* ----------------------------------------------------
 *  QUEUE SERVICE CLASS
 * --------------------------------------------------*/
export class QueueService {
  async addTranslationJob(data: {
    fileName: string;
    fileBuffer: Buffer;
    config: {
      targetLanguage: string;
      tier: string;
    };
    userId?: string;
  }): Promise<string> {
    const performance = trackJobPerformance(data.fileName, data.config.tier);
    
    try {
      // Extract text from buffer for text files
      let text = '';
      
      if (data.fileName.endsWith('.txt')) {
        try {
          text = data.fileBuffer.toString('utf-8');
          console.log(`📄 Text file detected: ${data.fileName}`);
          console.log(`📝 Extracted ${text.length} characters`);
        } catch (error) {
          console.error('Failed to extract text from buffer:', error);
        }
      } else if (data.fileName.endsWith('.pdf')) {
        console.log(`📑 PDF file detected: ${data.fileName} - will be extracted by PDF worker`);
      } else if (data.fileName.endsWith('.docx') || data.fileName.endsWith('.doc')) {
        console.log(`📋 Word file detected: ${data.fileName} - will be extracted by DOCX worker`);
      } else {
        console.log(`📎 Unknown file type: ${data.fileName}`);
      }
      
      // Create job data with tier at top level for worker compatibility
      const jobData: TranslationJobData = {
        id: Date.now().toString(),
        fileName: data.fileName,
        fileBuffer: data.fileBuffer,
        text: text, // Include extracted text for .txt files
        targetLang: data.config.targetLanguage || 'vi',
        tier: (data.config.tier || 'basic') as 'basic' | 'standard' | 'premium',
        userId: data.userId,
        chunks: [], // Will be populated by chunker
        // Keep config for backward compatibility
        config: {
          targetLanguage: data.config.targetLanguage || 'vi',
          tier: data.config.tier || 'basic',
        }
      };
      
      console.log('Adding translation job:', {
        id: jobData.id,
        fileName: jobData.fileName,
        tier: jobData.tier,
        targetLang: jobData.targetLang,
        hasText: !!jobData.text,
        textLength: jobData.text?.length || 0,
        fileSize: data.fileBuffer.length
      });
      
      const job = await translationQueue.add('translate', jobData);
      
      performance.finish('success');
      return job.id || 'no-id';
    } catch (error) {
      performance.finish('failure');
      Sentry.captureException(error, {
        tags: { service: 'queue', action: 'addJob' },
        extra: data
      });
      throw error;
    }
  }

  async getJobStatus(jobId: string) {
    try {
      if (!translationQueue.getJob) {
        return null;
      }
      
      const job = await translationQueue.getJob(jobId);
      if (!job) return null;
      
      const state = await job.getState();
      const progress = job.progress;
      
      return {
        id: job.id,
        state,
        progress,
        data: job.data,
        failedReason: job.failedReason,
      };
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  // Additional utility methods
  async retryJob(jobId: string): Promise<boolean> {
    try {
      if (!translationQueue.getJob) {
        return false;
      }
      
      const job = await translationQueue.getJob(jobId);
      if (!job) return false;
      
      await job.retry();
      console.log(`🔄 Retrying job ${jobId}`);
      return true;
    } catch (error) {
      Sentry.captureException(error);
      return false;
    }
  }

  async cleanFailedJobs(): Promise<number> {
    try {
      if (!translationQueue.clean) {
        return 0;
      }
      
      const failed = await translationQueue.clean(0, 'failed');
      console.log(`🧹 Cleaned ${failed.length} failed jobs`);
      return failed.length;
    } catch (error) {
      Sentry.captureException(error);
      return 0;
    }
  }

  async getQueueStats() {
    try {
      if (!translationQueue.getWaitingCount) {
        return {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          total: 0
        };
      }
      
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        translationQueue.getWaitingCount(),
        translationQueue.getActiveCount(),
        translationQueue.getCompletedCount(),
        translationQueue.getFailedCount(),
        translationQueue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed
      };
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();