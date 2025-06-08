export type TranslationTier = 'basic' | 'standard' | 'premium';

export interface TranslationRequest {
  // For text translation
  text?: string;
  source_lang?: string;
  target_lang?: string;
  // For file translation
  file?: File;
  targetLanguage?: string;
  // Common
  tier: TranslationTier;
}

export interface TranslationResponse {
  // Queue response
  jobId?: string;
  message?: string;
  estimatedTime?: string;
  // Direct translation response
  translated_text?: string;
  translation?: string;
  processing_time?: number;
  // Common
  tier?: TranslationTier;
  error?: string;
}

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  metadata: {
    tier: TranslationTier;
    targetLanguage: string;
    processingTime: number;
    chunks?: number;
  };
}

export interface TranslationError {
  error: string;
  code?: string;
  details?: any;
}

export interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    translated_text?: string;
    text?: string;
    pageCount?: number;
  };
  error?: string;
}