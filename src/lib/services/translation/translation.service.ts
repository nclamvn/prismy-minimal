// Thêm ở đầu file nếu chưa có
import fetch from 'node-fetch'
// hoặc nếu dùng Node 18+, fetch đã có sẵn
import { ChunkerService, ChunkingTier } from '../chunker'
import { Chunk } from '../chunker/types'

// Translation tier types
export type TranslationTier = 'basic' | 'standard' | 'premium'

// Translation options
export interface TranslationOptions {
  sourceLang?: string
  targetLang: string
  tier: TranslationTier
  preserveFormatting?: boolean
  useGlossary?: boolean
}

// Translation result
export interface TranslationResult {
  translatedText: string
  chunks: TranslatedChunk[]
  metadata: {
    totalChunks: number
    totalTokens: number
    processingTime: number
    tier: TranslationTier
    targetLang: string
  }
}

// Translated chunk
export interface TranslatedChunk {
  originalChunk: Chunk
  translatedContent: string
  translationMetadata?: {
    model: string
    tokensUsed: number
    confidence?: number
  }
}

export class TranslationService {
  private chunkerService: ChunkerService
  
  constructor() {
    this.chunkerService = new ChunkerService()
  }
  
  /**
   * Translate a document with automatic chunking
   */
  async translateDocument(
    text: string,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    const startTime = Date.now()
    
    try {
      // Step 1: Analyze document
      const analysis = await this.chunkerService.analyzeDocument(text)
      console.log('[TranslationService] Document analysis:', {
        estimatedTokens: analysis.estimatedTokens,
        recommendedTier: analysis.recommendedTier
      })
      
      // Step 2: Determine chunking tier based on translation tier
      const chunkingTier = this.getChunkingTier(options.tier)
      
      // Step 3: Chunk the document
      const chunkingResult = await this.chunkerService.chunkDocument(
        text,
        chunkingTier,
        {
          generateDNA: options.tier === 'premium' // DNA for premium tier
        }
      )
      
      console.log(`[TranslationService] Created ${chunkingResult.chunks.length} chunks`)
      
      // Step 4: Translate each chunk
      const translatedChunks = await this.translateChunks(
        chunkingResult.chunks,
        options
      )
      
      // Step 5: Reassemble translated text
      const translatedText = this.reassembleTranslation(translatedChunks)
      
      // Step 6: Return result
      return {
        translatedText,
        chunks: translatedChunks,
        metadata: {
          totalChunks: chunkingResult.chunks.length,
          totalTokens: chunkingResult.totalTokens,
          processingTime: Date.now() - startTime,
          tier: options.tier,
          targetLang: options.targetLang
        }
      }
      
    } catch (error) {
      console.error('[TranslationService] Translation failed:', error)
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Map translation tier to chunking tier
   */
  private getChunkingTier(translationTier: TranslationTier): ChunkingTier {
    // Direct mapping for now
    return translationTier as ChunkingTier
  }
  
  /**
   * Translate multiple chunks
   */
  private async translateChunks(
    chunks: Chunk[],
    options: TranslationOptions
  ): Promise<TranslatedChunk[]> {
    // Determine concurrency based on tier
    const concurrency = options.tier === 'basic' ? 3 : 
                       options.tier === 'standard' ? 2 : 1
    
    const results: TranslatedChunk[] = []
    
    // Process in batches for rate limiting
    for (let i = 0; i < chunks.length; i += concurrency) {
      const batch = chunks.slice(i, i + concurrency)
      
      const batchResults = await Promise.all(
        batch.map(chunk => this.translateSingleChunk(chunk, options))
      )
      
      results.push(...batchResults)
      
      // Add delay between batches to avoid rate limits
      if (i + concurrency < chunks.length) {
        await this.delay(options.tier === 'basic' ? 100 : 200)
      }
    }
    
    return results
  }
  
  /**
   * Translate a single chunk
   */
  private async translateSingleChunk(
    chunk: Chunk,
    options: TranslationOptions
  ): Promise<TranslatedChunk> {
    console.log(`[TranslationService] Translating chunk ${chunk.index} (${chunk.tokens} tokens)`)
    
    // Get translation based on tier
    let translatedContent: string
    let model: string
    let tokensUsed: number
    
    switch (options.tier) {
      case 'basic':
        // Use Google Translate or simple API
        const basicResult = await this.basicTranslation(chunk.content, options)
        translatedContent = basicResult.text
        model = 'google-translate'
        tokensUsed = chunk.tokens
        break
        
      case 'standard':
        // Use GPT-4-mini or similar
        const standardResult = await this.standardTranslation(chunk, options)
        translatedContent = standardResult.text
        model = standardResult.model
        tokensUsed = standardResult.tokens
        break
        
      case 'premium':
        // Use GPT-4 or Claude with context
        const premiumResult = await this.premiumTranslation(chunk, options)
        translatedContent = premiumResult.text
        model = premiumResult.model
        tokensUsed = premiumResult.tokens
        break
        
      default:
        throw new Error(`Unknown tier: ${options.tier}`)
    }
    
    return {
      originalChunk: chunk,
      translatedContent,
      translationMetadata: {
        model,
        tokensUsed,
        confidence: options.tier === 'premium' ? 0.95 : 
                    options.tier === 'standard' ? 0.85 : 0.75
      }
    }
  }
  
  /**
   * Basic translation (Google Translate or similar)
   */
  private async basicTranslation(
  text: string,
  options: TranslationOptions
): Promise<{ text: string }> {
  // Call your existing API
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      targetLang: options.targetLang,
      tier: 'basic'
    })
  })
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Translation failed')
  }
  
  return {
    text: data.translated
  }
}
  
  /**
   * Standard translation (GPT-4-mini)
   */
  private async standardTranslation(
  chunk: Chunk,
  options: TranslationOptions
): Promise<{ text: string; model: string; tokens: number }> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: chunk.content,
      targetLang: options.targetLang,
      tier: 'standard'
    })
  })
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Translation failed')
  }
  
  return {
    text: data.translated,
    model: data.model || 'gpt-3.5-turbo',
    tokens: chunk.tokens * 2
  }
}
  
  /**
   * Premium translation (GPT-4 or Claude)
   */
  private async premiumTranslation(
  chunk: Chunk,
  options: TranslationOptions
): Promise<{ text: string; model: string; tokens: number }> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: chunk.content,
      targetLang: options.targetLang,
      tier: 'premium'
    })
  })
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Translation failed')
  }
  
  return {
    text: data.translated,
    model: data.model || 'gpt-4',
    tokens: chunk.tokens * 2.5
  }
}
  
  /**
   * Reassemble translated chunks into final text
   */
  private reassembleTranslation(chunks: TranslatedChunk[]): string {
    // Sort by index to ensure correct order
    const sorted = chunks.sort((a, b) => a.originalChunk.index - b.originalChunk.index)
    
    // Join with appropriate spacing
    return sorted
      .map(chunk => chunk.translatedContent)
      .join('\n\n')
  }
  
  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}