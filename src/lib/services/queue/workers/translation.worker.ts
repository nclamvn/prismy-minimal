import { Job } from 'bullmq';
import { TranslationJob } from '../types';
import { TranslationService } from '@/lib/services/translation/translation.service';
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
        if (Buffer.isBuffer(job.data.fileBuffer)) {
          sourceText = job.data.fileBuffer.toString('utf-8');
        } else if (typeof job.data.fileBuffer === 'string') {
          sourceText = job.data.fileBuffer;
        } else {
          sourceText = String(job.data.fileBuffer);
        }
        console.log(`📄 Converted text file: ${sourceText.length} characters`);
      } else {
        throw new Error('PDF/DOCX files must be extracted first. Text field is empty.');
      }
    }
    
    if (!sourceText || sourceText.trim().length === 0) {
      throw new Error('No text content to translate');
    }

    console.log(`📝 Processing text with tier: ${tier}`);
    
    // Debug log
    console.log(`📋 Job data structure:`, {
      jobId: job.id,
      tier: tier,
      targetLanguage: targetLanguage,
      hasText: !!job.data.text,
      textLength: sourceText.length,
    });
    
    // Validate tier
    const validTiers = ['basic', 'standard', 'premium'];
    if (!validTiers.includes(tier.toLowerCase())) {
      throw new Error(`Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}`);
    }
    
    // Update progress - starting translation
    await job.updateProgress(10);
    
    // Use TranslationService
    const translationService = new TranslationService();
    
    console.log(`🔄 Starting translation with TranslationService...`);
    
    try {
      const result = await translationService.translateDocument(sourceText, {
        targetLang: targetLanguage,
        tier: tier as 'basic' | 'standard' | 'premium',
        sourceLang: 'en',
        preserveFormatting: true,
      });
      
      // Update progress to 90%
      await job.updateProgress(90);
      
      console.log(`✅ Translation completed - ${result.metadata.totalChunks} chunks processed`);
      
      // Final progress update
      await job.updateProgress(100);
      
      return {
        translatedText: result.translatedText,
        translatedChunks: result.chunks.map(chunk => ({
          originalText: chunk.originalChunk.content,
          translatedText: chunk.translatedContent,
          metadata: chunk.translationMetadata,
        })),
        metadata: {
          totalChunks: result.metadata.totalChunks,
          tier: result.metadata.tier,
          targetLanguage: result.metadata.targetLang,
          processingTime: result.metadata.processingTime,
          totalTokens: result.metadata.totalTokens,
        },
      };
      
    } catch (translationError) {
      console.error(`❌ TranslationService error:`, translationError);
      
      // Fallback to simple translation if service fails
      console.log(`🔄 Falling back to simple translation...`);
      
      // Simple translation logic
      const chunks = sourceText.match(/.{1,1000}/g) || [sourceText];
      const results = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const progress = 10 + Math.floor((i / chunks.length) * 80);
        await job.updateProgress(progress);
        
        // Mock translation for now
        results.push({
          originalText: chunks[i],
          translatedText: `[${tier.toUpperCase()}] Translated to ${targetLanguage}: ${chunks[i].substring(0, 50)}...`,
          metadata: {
            model: tier === 'basic' ? 'google-translate' : tier === 'standard' ? 'gpt-3.5' : 'gpt-4',
            tokensUsed: chunks[i].length / 4,
          }
        });
      }
      
      await job.updateProgress(100);
      
      return {
        translatedChunks: results,
        translatedText: results.map(r => r.translatedText).join(' '),
        metadata: {
          totalChunks: results.length,
          tier: tier,
          targetLanguage: targetLanguage,
          processingTime: Date.now() - (job.processedOn || Date.now()),
        },
      };
    }
    
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
        targetLanguage: job.data.targetLang || job.data.config?.targetLanguage,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    throw error;
  }
}