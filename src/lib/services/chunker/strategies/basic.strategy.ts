import { BaseChunkingStrategy } from './base.strategy'
import { Chunk, ChunkOptions } from '../types'
import { nanoid } from 'nanoid'

export class BasicStrategy extends BaseChunkingStrategy {
  async chunk(text: string, options: ChunkOptions): Promise<Chunk[]> {
    const chunks: Chunk[] = []
    const chunkSize = options.maxTokens * 4 // Rough estimate
    
    let position = 0
    let index = 0
    
    while (position < text.length) {
      const end = Math.min(text.length, position + chunkSize)
      const content = text.slice(position, end)
      
      chunks.push({
        id: nanoid(12),
        index: index++,
        content,
        tokens: Math.ceil(content.length / 4),
        startOffset: position,
        endOffset: end,
        metadata: { type: 'basic' }
      })
      
      position = end
    }
    
    return chunks
  }
}
