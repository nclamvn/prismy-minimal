import { BaseChunkingStrategy } from './base.strategy'
import { Chunk, ChunkOptions } from '../types'
import { nanoid } from 'nanoid'

export class SimpleStrategy extends BaseChunkingStrategy {
  async chunk(text: string, options: ChunkOptions): Promise<Chunk[]> {
    const chunks: Chunk[] = []
    const chunkSize = (options.maxTokens ?? 1000) * 4 // Rough estimate: 1 token ≈ 4 chars
    const overlap = (options.overlap ?? 100) * 4
    
    let position = 0
    let index = 0
    
    while (position < text.length) {
      const start = Math.max(0, position - overlap)
      const end = Math.min(text.length, position + chunkSize)
      const content = text.slice(start, end)
      
      chunks.push({
        id: nanoid(12),
        index: index++,
        content,
        tokens: Math.ceil(content.length / 4),
        startOffset: start,
        endOffset: end,
        metadata: { type: 'simple' }
      })
      
      position = end
      if (end >= text.length) break
    }
    
    return chunks
  }
}

export { SimpleStrategy as SimpleChunkingStrategy }
