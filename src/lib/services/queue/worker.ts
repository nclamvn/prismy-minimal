import * as dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { TranslationJobData, TranslationJobResult } from './queue.service';
import { ChunkerService } from '../chunker/chunker.service';
import { OpenAITranslateService } from '../openai-translate.service';

let connection: any;

// Check if we have Upstash credentials
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  // Upstash doesn't support blocking commands, so we'll use local Redis for now
  console.warn('⚠️ Upstash Redis detected but not compatible with BullMQ blocking commands.');
  console.warn('⚠️ Using local Redis instead. Please install Redis locally: brew install redis');
}

// Determine Redis host based on environment
const redisHost = process.env.REDIS_URL?.includes('host.docker.internal') 
  ? 'host.docker.internal' 
  : (process.env.REDIS_HOST || 'localhost');

// Always use local Redis for BullMQ
connection = new Redis({
  host: redisHost,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('error', (err: any) => {
  console.error('Worker Redis error:', err);
  console.error(`Please make sure Redis is running on ${redisHost}:6379`);
});

connection.on('connect', () => {
  console.log(`✅ Worker Redis connected successfully to ${redisHost}:6379`);
});

export const translationWorker = new Worker<TranslationJobData, TranslationJobResult>(
  'translation',
  async (job) => {
    try {
      console.log(`⚙️ Processing job ${job.id} with data:`, job.data);
      
      const startTime = Date.now();
      const { text, targetLang, tier } = job.data;

      // Validate required fields
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('No text content provided for translation');
      }

      if (!targetLang) {
        throw new Error('No target language specified');
      }

      const validTier = tier || 'basic';

      const chunker = new ChunkerService();
      const translator = new OpenAITranslateService();

      const chunkResult = await chunker.chunkDocument(text, validTier as any);
      console.log('Chunk result type:', typeof chunkResult);
      console.log('Chunk result:', chunkResult);

      // Check if it returns chunks array or object with chunks property
      const chunks = Array.isArray(chunkResult) ? chunkResult : chunkResult.chunks || [{ text }];

      console.log(`📝 Chunked into ${chunks.length} parts`);

      const translatedChunks = await Promise.all(
        chunks.map(async (chunk: any, index: number) => {
          // Update progress before translating
          const progress = Math.round((index / chunks.length) * 100);
          await job.updateProgress(progress);
          
          console.log(`🔄 Translating chunk ${index + 1}/${chunks.length} - Progress: ${progress}%`);
          const chunkText = typeof chunk === 'string' ? chunk : chunk.content || chunk.text || chunk;
          
          // Skip empty chunks
          if (!chunkText || chunkText.trim() === '') {
            console.log(`⏭️ Skipping empty chunk ${index + 1}`);
            return '';
          }

          const translated = await translator.translateText(
            chunkText, 
            targetLang, 
            validTier as 'basic' | 'standard' | 'premium'
          );
          
          // Update progress after translating
          const newProgress = Math.round(((index + 1) / chunks.length) * 100);
          await job.updateProgress(newProgress);
          
          return translated;
        })
      );

      const result = {
        translatedText: translatedChunks.filter(t => t).join(' '), // Filter out empty translations
        chunks: translatedChunks,
        processingTime: Date.now() - startTime,
      };

      console.log(`✅ Job ${job.id} completed in ${result.processingTime}ms`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error in job ${job.id}:`, error);
      throw error;
    }
  },
  { connection }
);

translationWorker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

translationWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
  console.error('Stack trace:', err.stack);
});

translationWorker.on('active', (job) => {
  console.log(`🚀 Job ${job.id} started processing`);
});

console.log('🎯 Translation worker initialized and listening for jobs...');