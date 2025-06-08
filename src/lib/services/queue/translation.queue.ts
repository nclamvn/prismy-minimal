import { Queue } from 'bullmq';
import { TranslationJob } from './types';
import { getRedisConnection } from '@/lib/services/queue/redis';

// Create and export translation queue
export const translationQueue = new Queue<TranslationJob>('translation', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 86400, // 24 hours
    },
  },
});

// Export for use in other files
export default translationQueue;