import { Job } from 'bullmq';
import { TranslationJob } from '../types';
import { BasicTranslator } from '@/lib/services/translator/basic.translator';
import { StandardTranslator } from '@/lib/services/translator/standard.translator';
import { PremiumTranslator } from '@/lib/services/translator/premium.translator';
import * as Sentry from '@sentry/node';

// Initialize Sentry for worker
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export async function processTranslation(job: Job<TranslationJob>) {
  console.log(`🌍 Starting translation job ${job.id} - ${job.data.fileName}`);
  
  try {
    // Extract tier and language
    const tier = job.data.tier || job.data.config?.tier || 'basic';
    const targetLanguage = job.data.targetLang || job.data.config?.targetLanguage || 'vi';
    
    // Get text from multiple possible sources
    let sourceText = '';
    
    // Priority 1: Direct text field
    if (job.data.text && job.data.text.trim()) {
      sourceText = job.data.text;
      console.log(`📝 Using direct text: ${sourceText.length} characters`);
    }
    // Priority 2: Convert fileBuffer if text extraction didn't happen
    else if (job.data.fileBuffer) {
      // For text files, convert buffer to string
      if (job.data.fileName?.endsWith('.txt')) {
        sourceText = Buffer.isBuffer(job.data.fileBuffer) 
          ? job.data.fileBuffer.toString('utf-8')
          : job.data.fileBuffer.toString();
        console.log(`📄 Converted text file: ${sourceText.length} characters`);
      } else {
        throw new Error('PDF/DOCX files must be extracted first. Text field is empty.');
      }
    }
    
    if (!sourceText || sourceText.trim().length === 0) {
      throw new Error('No text content to translate');
    }
    
    // If we already have chunks, use them; otherwise chunk the text
    let chunks = job.data.chunks;
    
    if (!chunks || chunks.length === 0) {
      console.log(`🔪 Chunking text (${sourceText.length} chars) with tier: ${tier}`);
      
      // Import chunker dynamically to avoid circular dependencies
      const { ChunkerService } = await import('@/lib/services/chunker');
      const chunker = new ChunkerService();
      
      const chunkResult = await chunker.chunkDocument(sourceText, tier);
      chunks = chunkResult.chunks;
      
      console.log(`📦 Created ${chunks.length} chunks, total tokens: ${chunkResult.totalTokens}`);
      
      // Update progress after chunking
      await job.updateProgress(10);
    }
    
    // Validate chunks
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      throw new Error('No chunks to process');
    }

    console.log(`📝 Processing ${chunks.length} chunks with tier: ${tier}`);
    
    // Debug log
    console.log(`📋 Job data structure:`, {
      jobId: job.id,
      tier: tier,
      targetLanguage: targetLanguage,
      hasText: !!job.data.text,
      textLength: sourceText.length,
      chunksCount: chunks.length
    });
    
    // Validate tier
    const validTiers = ['basic', 'standard', 'premium'];
    if (!validTiers.includes(tier.toLowerCase())) {
      throw new Error(`Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}`);
    }
    
    // Select translator based on tier (case-insensitive)
    let translator;
    switch (tier.toLowerCase()) {
      case 'basic':
        translator = new BasicTranslator();
        break;
      case 'standard':
        translator = new StandardTranslator();
        break;
      case 'premium':
        translator = new PremiumTranslator();
        break;
      default:
        // This shouldn't happen due to validation above
        console.warn(`Unknown tier: ${tier}, defaulting to basic`);
        translator = new BasicTranslator();
    }

    // Initialize translator if needed
    if (translator.initialize) {
      await translator.initialize();
    }

    // Process each chunk with progress updates
    const results = [];
    const totalChunks = chunks.length;
    
    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i];
      
      // Update progress (10-90% for translation, keeping some for final assembly)
      const progress = 10 + Math.floor((i / totalChunks) * 80);
      await job.updateProgress(progress);
      
      console.log(`🔄 Translating chunk ${i + 1}/${totalChunks} - Progress: ${progress}%`);
      
      try {
        // Handle different chunk formats
        let chunkText = '';
        let chunkData: any = {};
        
        if (typeof chunk === 'string') {
          chunkText = chunk;
          chunkData = { text: chunk, metadata: {} };
        } else if (chunk && typeof chunk === 'object') {
          chunkText = chunk.text || chunk.content || '';
          chunkData = chunk;
        }

        // Skip empty chunks
        if (!chunkText || chunkText.trim() === '') {
          console.log(`⏭️ Skipping empty chunk ${i + 1}`);
          results.push({
            ...chunkData,
            translatedText: '',
          });
          continue;
        }

        // Call translate method
        const translated = await translator.translate(
          chunkText,
          targetLanguage,
          chunkData.metadata || {}
        );
        
        results.push({
          ...chunkData,
          text: chunkText,
          translatedText: translated,
        });
      } catch (error) {
        console.error(`❌ Error translating chunk ${i + 1}:`, error);
        
        // Capture chunk-specific errors
        Sentry.captureException(error, {
          tags: {
            jobId: job.id,
            chunkIndex: i,
            tier: tier
          },
          extra: {
            chunkText: chunk,
            chunkIndex: i,
            totalChunks: totalChunks
          }
        });
        
        throw error;
      }
    }

    // Final progress update
    await job.updateProgress(100);
    console.log(`✅ Translation completed for job ${job.id} - ${totalChunks} chunks processed`);
    
    return {
      translatedChunks: results,
      metadata: {
        totalChunks: results.length,
        tier: tier,
        targetLanguage: targetLanguage,
        processingTime: Date.now() - job.processedOn!,
      },
    };
  } catch (error) {
    console.error(`❌ Translation job ${job.id} failed:`, error);
    
    // Send to Sentry with full context
    Sentry.captureException(error, {
      tags: {
        jobId: job.id,
        tier: job.data.tier || job.data.config?.tier || 'unknown',
        component: 'translation-worker'
      },
      extra: {
        fileName: job.data.fileName,
        hasText: !!job.data.text,
        hasFileBuffer: !!job.data.fileBuffer,
        chunksCount: job.data.chunks?.length,
        targetLanguage: job.data.targetLang || job.data.config?.targetLanguage,
      },
    });
    
    throw error;
  }
}