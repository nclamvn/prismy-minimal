#!/usr/bin/env node
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Override Redis URL for Docker environment
if (process.env.REDIS_URL) {
  process.env.REDIS_HOST = 'host.docker.internal';
  process.env.REDIS_PORT = '6379';
  console.log('🐳 Docker environment detected, using host.docker.internal:6379');
}

const workerType = process.env.WORKER_TYPE || 'all';
console.log(`🚀 Starting workers... Type: ${workerType}`);

async function startWorkers() {
  try {
    // Import translation worker
    if (workerType === 'translation' || workerType === 'all') {
      console.log('📝 Loading translation worker...');
      await import('../lib/services/queue/worker.js');
      console.log('✅ Translation worker loaded');
    }

    // Import PDF extractor worker
    if (workerType === 'pdf-extractor' || workerType === 'all') {
      console.log('🎯 Loading PDF extractor worker...');
      await import('../lib/services/queue/workers/pdf-extractor.worker.js');
      console.log('✅ PDF extractor worker loaded');
    }

    console.log('🚀 All workers started successfully');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔑 OpenAI Key:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
    console.log('🔴 Redis URL:', process.env.REDIS_URL || 'redis://localhost:6379');

  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  SIGINT received, shutting down workers...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  SIGTERM received, shutting down workers...');
  process.exit(0);
});

// Start workers
startWorkers();