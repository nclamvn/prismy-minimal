// src/lib/api/translation.ts
export interface TranslationRequest {
  text: string;
  targetLang: string;
  tier?: 'basic' | 'standard' | 'premium';
  isRewrite?: boolean;
}

export interface TranslationResponse {
  success: boolean;
  translated?: string;
  error?: string;
  stats?: {
    processingTime: number;
    chunks: number;
    tokensProcessed: number;
    dna?: any;
  };
}

export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: 'Translation failed'
    };
  }
}