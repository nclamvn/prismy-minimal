export interface ChunkOptions {
  maxTokens: number
  overlap: number
  preserveStructure: boolean
  generateDNA: boolean
}

export interface ChunkDNA {
  language: string
  style: string
  complexity?: number
  hasCode: boolean
  hasTable: boolean
  topics?: string[]
  entities?: string[]
  references?: string[]
}

export interface Chunk {
  id: string
  index: number
  content: string
  tokens: number
  startOffset: number
  endOffset: number
  metadata?: {
    type?: string
    language?: string
    dna?: ChunkDNA
    sectionIndex?: number
    localIndex?: number
    prevChunkId?: string
    nextChunkId?: string
    singleChunk?: boolean
    iteration?: number
    [key: string]: any
  }
}

export interface ChunkingStrategy {
  chunk(text: string, options: ChunkOptions): Promise<Chunk[]>
}

export interface ChunkingResult {
  chunks: Chunk[]
  totalTokens: number
  metadata: {
    strategy: string
    processingTime: number
  }
}
