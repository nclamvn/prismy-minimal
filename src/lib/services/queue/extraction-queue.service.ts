import { Queue } from 'bullmq';
import Redis from 'ioredis';

let connection: any;
let extractionQueue: Queue | any;

if (process.env.DISABLE_QUEUE === 'true') {
  console.log('Extraction queue disabled for production');
  
  extractionQueue = {
    add: async () => ({ 
      id: 'dummy-extraction-job',
      data: {},
    }),
    getJob: async () => null,
  };
} else {
  const Redis = require('ioredis');
  const { Queue } = require('bullmq');
  
  connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  
  extractionQueue = new Queue('pdf-extraction', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
}

export { extractionQueue };

export interface ExtractionJobData {
  fileBuffer: string; // Base64 encoded
  fileName: string;
  fileId: string;
}

export interface ExtractionJobResult {
  text: string;
  pageCount: number;
  info: any;
  metadata: any;
  fileName: string;
  fileId: string;
}