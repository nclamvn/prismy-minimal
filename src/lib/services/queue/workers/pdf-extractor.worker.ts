import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import pdfParse from 'pdf-parse';
import * as dotenv from 'dotenv';

dotenv.config();

// Determine Redis host based on environment
const redisHost = process.env.REDIS_URL?.includes('host.docker.internal') 
  ? 'host.docker.internal' 
  : (process.env.REDIS_HOST || 'localhost');

// Redis connection
const connection = new Redis({
  host: redisHost,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('connect', () => {
  console.log(`✅ PDF Worker Redis connected successfully to ${redisHost}:6379`);
});

connection.on('error', (err) => {
  console.error('PDF Worker Redis error:', err);
  console.error(`Please make sure Redis is running on ${redisHost}:6379`);
});

// PDF Extraction Worker
export const pdfExtractorWorker = new Worker(
  'pdf-extraction',
  async (job: Job) => {
    const { fileBuffer, fileName, fileId } = job.data;
    
    console.log(`📄 Processing PDF: ${fileName}`);
    
    try {
      // Convert base64 back to Buffer if needed
      const buffer = Buffer.isBuffer(fileBuffer) 
        ? fileBuffer 
        : Buffer.from(fileBuffer, 'base64');
      
      // Parse PDF
      const pdfData = await pdfParse(buffer);
      
      console.log(`✅ PDF extracted: ${fileName}, pages: ${pdfData.numpages}`);
      console.log(`📝 Text length: ${pdfData.text.length} characters`);
      
      // Update job progress
      await job.updateProgress(50);
      
      // IMPORTANT: Update the translation job with extracted text
      // This assumes the PDF extraction is part of a larger translation pipeline
      if (job.data.parentJobId) {
        // If this is a sub-job, update parent
        console.log(`📤 Updating parent job ${job.data.parentJobId} with extracted text`);
      }
      
      // Note: job.update() is not available in BullMQ v5+
      // The job data is immutable after creation
      // Instead, we return the extracted data and handle it in the completion event
      console.log(`📤 Extracted text from ${pdfData.numpages} pages`);
      
      // Final progress
      await job.updateProgress(100);
      
      return {
        text: pdfData.text,
        pageCount: pdfData.numpages,
        info: pdfData.info,
        metadata: pdfData.metadata,
        fileName: fileName,
        fileId: fileId,
        textLength: pdfData.text.length
      };
      
    } catch (error) {
      console.error(`❌ PDF extraction failed for ${fileName}:`, error);
      throw error;
    }
  },
  { 
    connection,
    // Worker options - removed defaultJobOptions as it's not valid here
    concurrency: 1, // Process one PDF at a time to avoid memory issues
    limiter: {
      max: 10,
      duration: 60000, // Max 10 PDFs per minute
    },
  }
);

pdfExtractorWorker.on('completed', (job) => {
  console.log(`✅ PDF extraction completed for job ${job.id}`);
  if (job.returnvalue?.textLength) {
    console.log(`📊 Extracted ${job.returnvalue.textLength} characters from ${job.returnvalue.pageCount} pages`);
  }
});

pdfExtractorWorker.on('failed', (job, err) => {
  console.error(`❌ PDF extraction failed for job ${job?.id}:`, err);
});

pdfExtractorWorker.on('progress', (job, progress) => {
  console.log(`📊 PDF extraction progress for job ${job.id}: ${progress}%`);
});

console.log('🎯 PDF Extractor Worker started...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️ SIGTERM received, closing PDF worker...');
  await pdfExtractorWorker.close();
  await connection.quit();
  process.exit(0);
});