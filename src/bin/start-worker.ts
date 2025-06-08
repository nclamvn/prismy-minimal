#!/usr/bin/env node
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import both workers
import '../lib/services/queue/worker';
import '../lib/services/queue/workers/pdf-extractor.worker';

console.log('🚀 All workers started');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 OpenAI Key:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');

process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down workers...');
  process.exit(0);
});