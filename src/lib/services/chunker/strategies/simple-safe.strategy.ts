import { BaseChunkingStrategy } from './base.strategy'
import { Chunk, ChunkOptions } from '../types'

export class SimpleSafeChunkingStrategy extends BaseChunkingStrategy {
  private maxChunks = 10000 // Safety guard
  
  async chunk(text: string, options: ChunkOptions): Promise<Chunk[]> {
    const opts = { ...this.defaultOptions, ...options }
    
    if (!text || text.trim().length === 0) {
      return []
    }
    
    // Simple token estimation
    const estimatedTokens = Math.ceil(text.length / 4)
    
    // CRITICAL: If text fits in one chunk, return immediately
    if (estimatedTokens <= opts.maxTokens) {
      return [{
        id: `chunk-${Date.now()}-0`,
        index: 0,
        content: text.trim(),
        tokens: estimatedTokens,
        startOffset: 0,
        endOffset: text.length,
        metadata: {
          type: 'simple-safe',
          singleChunk: true
        }
      }]
    }
    
    // Adjust overlap to be safe
    const safeOverlap = Math.min(
      opts.overlap || 0, 
      Math.floor(opts.maxTokens * 0.25) // Max 25% overlap
    )
    
    // Calculate chunk parameters
    const chunkSizeChars = opts.maxTokens * 4
    const overlapChars = Math.max(0, Math.min(safeOverlap * 4, chunkSizeChars - 100))
    
    const chunks: Chunk[] = []
    let position = 0
    let index = 0
    let iterations = 0
    const maxIterations = Math.ceil(text.length / Math.max(1, chunkSizeChars - overlapChars)) + 10
    
    console.log(`[SimpleSafe] Starting chunking: textLen=${text.length}, chunkSize=${chunkSizeChars}, overlap=${overlapChars}`)
    
    while (position < text.length && iterations < maxIterations) {
      iterations++
      
      const endPos = Math.min(position + chunkSizeChars, text.length)
      const isLastChunk = endPos >= text.length
      
      // Extract chunk
      const content = text.substring(position, endPos).trim()
      
      if (content.length > 0) {
        if (chunks.length >= this.maxChunks) {
          throw new Error(`SimpleSafe: Exceeded max chunks limit (${this.maxChunks})`)
        }
        
        chunks.push({
          id: `chunk-${Date.now()}-${index}`,
          index,
          content,
          tokens: Math.ceil(content.length / 4),
          startOffset: position,
          endOffset: endPos,
          metadata: {
            type: 'simple-safe',
            iteration: iterations
          }
        })
        index++
      }
      
      // CRITICAL: Exit if last chunk
      if (isLastChunk) {
        console.log(`[SimpleSafe] Reached end at iteration ${iterations}`)
        break
      }
      
      // Calculate next position with safety
      const nextPos = endPos - overlapChars
      
      // CRITICAL: Ensure forward progress
      if (nextPos <= position) {
        console.warn(`[SimpleSafe] Forced forward progress from ${nextPos} to ${endPos}`)
        position = endPos
      } else {
        position = nextPos
      }
    }
    
    if (iterations >= maxIterations) {
      throw new Error(`SimpleSafe: Hit max iterations (${maxIterations})`)
    }
    
    console.log(`[SimpleSafe] Created ${chunks.length} chunks in ${iterations} iterations`)
    return chunks
  }
}