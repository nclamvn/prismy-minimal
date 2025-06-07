import { BasicChunker } from './strategies/basic.strategy'
import { SmartChunker } from './strategies/smart.strategy'
import { ChunkOptions, Chunk } from './strategies/base.strategy'

export type ChunkingTier = 'basic' | 'standard' | 'premium'

export class ChunkerService {
  private strategies = {
    basic: new BasicChunker(),
    standard: new SmartChunker(),
    premium: new SmartChunker() // Will enhance later
  }

  async chunkDocument(
    text: string,
    tier: ChunkingTier = 'standard',
    customOptions?: Partial<ChunkOptions>
  ): Promise<Chunk[]> {
    const defaultOptions = this.getDefaultOptions(tier)
    const options = { ...defaultOptions, ...customOptions }
    
    const strategy = this.strategies[tier]
    return strategy.chunk(text, options)
  }

  private getDefaultOptions(tier: ChunkingTier): ChunkOptions {
    switch (tier) {
      case 'basic':
        return {
          maxTokens: 8000,
          overlap: 200,
          preserveStructure: false,
          generateDNA: false
        }
      case 'standard':
        return {
          maxTokens: 4000,
          overlap: 500,
          preserveStructure: true,
          generateDNA: false
        }
      case 'premium':
        return {
          maxTokens: 2000,
          overlap: 800,
          preserveStructure: true,
          generateDNA: true
        }
    }
  }
}

export * from './strategies/base.strategy'
