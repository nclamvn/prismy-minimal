export interface Chunk {
  id?: string
  index?: number
  content: string
  tokens: number
  startOffset?: number
  endOffset?: number
  metadata?: any
}

export interface ChunkingResult {
  chunks: Chunk[]
  totalTokens: number
  metadata: {
    strategy: string
    processingTime: number
  }
  summary?: {
    totalTokens: number
    strategy: string
  }
}

export interface ChunkOptions {
  generateDNA?: boolean
  preserveStructure?: boolean
  maxTokens: number
  overlap?: number
}

export interface ChunkingStrategy {
  chunk(text: string, options: ChunkOptions): Promise<Chunk[]>
}

export type ChunkingTier = 'simple' | 'smart' | 'production'
