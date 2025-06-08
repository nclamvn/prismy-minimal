export interface TranslationJob {
  id: string;
  fileName: string;
  fileBuffer?: Buffer;
  text?: string;
  targetLang: string;
  tier: 'basic' | 'standard' | 'premium';
  chunks?: any[];
  userId?: string;
  config?: {
    targetLanguage: string;
    tier: string;
  };
}

export interface TranslationJobResult {
  translatedText?: string;
  translatedChunks?: any[];
  processingTime: number;
  metadata?: {
    totalChunks: number;
    tier: string;
    targetLanguage: string;
  };
}

export interface QueueJobData extends TranslationJob {
  // Additional queue-specific fields
  priority?: number;
  attempts?: number;
}

export interface JobStatus {
  id: string;
  state: string;
  progress: number;
  data: TranslationJob;
  failedReason?: string;
}