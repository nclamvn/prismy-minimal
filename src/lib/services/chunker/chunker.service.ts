import { BaseChunkingStrategy } from './strategies/base.strategy'
import { SimpleStrategy } from './strategies/simple.strategy'
import { SmartProductionStrategy } from './strategies/smart-production.strategy'
import { Chunk, ChunkOptions, ChunkingResult } from './types'

export type ChunkingTier = 'basic' | 'standard' | 'premium'

export class ChunkerService {
  private strategies: Map<ChunkingTier, BaseChunkingStrategy>
  
  constructor() {
    this.strategies = new Map()
    this.strategies.set('basic', new SimpleStrategy())
    this.strategies.set('standard', new SmartProductionStrategy())
    this.strategies.set('premium', new SmartProductionStrategy())
  }
  
  async chunkDocument(
    text: string,
    tier: ChunkingTier,
    options?: Partial<ChunkOptions>
  ): Promise<ChunkingResult> {
    const startTime = Date.now()
    
    const strategy = this.strategies.get(tier)
    if (!strategy) {
      throw new Error(`Invalid tier: ${tier}`)
    }
    
    const defaultOptions: ChunkOptions = {
      maxTokens: tier === 'basic' ? 500 : tier === 'standard' ? 1000 : 1500,
      overlap: tier === 'basic' ? 50 : 100,
      preserveStructure: tier !== 'basic',
      generateDNA: tier === 'premium',
      ...options
    }
    
    const chunks = await strategy.chunk(text, defaultOptions)
    
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0)
    
    return {
      chunks,
      totalTokens,
      metadata: {
        strategy: tier,
        processingTime: Date.now() - startTime
      }
    }
  }
  
  async analyzeDocument(text: string) {
    // Simple analysis
    const estimatedTokens = Math.ceil(text.length / 4)
    const recommendedTier: ChunkingTier = 
      estimatedTokens < 1000 ? 'basic' :
      estimatedTokens < 5000 ? 'standard' : 'premium'
    
    return {
      estimatedTokens,
      recommendedTier,
      documentLength: text.length
    }
  }
}
