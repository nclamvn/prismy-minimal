export interface ChunkOptions {
  maxTokens: number
  overlap: number
  preserveStructure?: boolean
  generateDNA?: boolean
}

export interface Chunk {
  id: string
  index: number
  content: string
  tokens: number
  metadata: {
    startChar: number
    endChar: number
    prevChunkId?: string
    nextChunkId?: string
  }
  dna?: ChunkDNA
}

export interface ChunkDNA {
  topics: string[]
  entities: string[]
  sentiment: number
  style: 'technical' | 'narrative' | 'academic' | 'general'
  hasTable: boolean
  hasFigure: boolean
  references: string[]
}

export abstract class ChunkingStrategy {
  abstract chunk(text: string, options: ChunkOptions): Promise<Chunk[]>
}
