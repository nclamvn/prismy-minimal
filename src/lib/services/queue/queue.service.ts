import { Queue } from 'bullmq';
import Redis from 'ioredis';

let connection: any;

// Check if we have Upstash credentials
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
 // Upstash doesn't support blocking commands, so we'll use local Redis for now
 console.warn('⚠️ Upstash Redis detected but not compatible with BullMQ blocking commands.');
 console.warn('⚠️ Using local Redis instead. Please install Redis locally: brew install redis');
}

// Always use local Redis for BullMQ
connection = new Redis({
 host: 'localhost',
 port: 6379,
 maxRetriesPerRequest: null,
 enableReadyCheck: false,
});

connection.on('error', (err: any) => {
 console.error('Redis connection error:', err);
 console.error('Please make sure Redis is running: brew services start redis');
});

connection.on('connect', () => {
 console.log('✅ Redis connected successfully to localhost:6379');
});

export const translationQueue = new Queue('translation', {
 connection,
 defaultJobOptions: {
   attempts: 3,
   backoff: {
     type: 'exponential',
     delay: 2000,
   },
   removeOnComplete: {
     age: 3600, // keep completed jobs for 1 hour
     count: 100 // keep last 100 completed jobs
   },
   removeOnFail: {
     age: 24 * 3600 // keep failed jobs for 24 hours
   },
 },
});

export interface TranslationJobData {
 id: string;
 text: string;
 targetLang: string;
 tier: string;
 chunks?: string[];
 userId?: string;
}

export interface TranslationJobResult {
 translatedText: string;
 chunks?: string[];
 processingTime: number;
}