import { encode, decode } from 'gpt-3-encoder'
import { ChunkingStrategy, Chunk, ChunkOptions } from './base.strategy'

export class BasicChunker extends ChunkingStrategy {
  async chunk(text: string, options: ChunkOptions): Promise<Chunk[]> {
    const chunks: Chunk[] = []
    const sentences = this.splitIntoSentences(text)
    
    let currentChunk = ''
    let currentTokens = 0
    let chunkIndex = 0
    let startChar = 0
    
    for (const sentence of sentences) {
      const sentenceTokens = encode(sentence).length
      
      if (currentTokens + sentenceTokens > options.maxTokens && currentChunk) {
        // Save current chunk
        chunks.push(this.createChunk(
          currentChunk,
          chunkIndex++,
          startChar,
          currentTokens
        ))
        
        // Start new chunk with overlap
        if (options.overlap > 0) {
          const overlapText = this.getOverlapText(currentChunk, options.overlap)
          currentChunk = overlapText + sentence
          currentTokens = encode(currentChunk).length
        } else {
          currentChunk = sentence
          currentTokens = sentenceTokens
        }
        startChar += currentChunk.length - sentence.length
      } else {
        currentChunk += sentence
        currentTokens += sentenceTokens
      }
    }
    
    // Add last chunk
    if (currentChunk) {
      chunks.push(this.createChunk(
        currentChunk,
        chunkIndex,
        startChar,
        currentTokens
      ))
    }
    
    // Link chunks
    this.linkChunks(chunks)
    
    return chunks
  }
  
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitter - can be improved
    return text.match(/[^.!?]+[.!?]+/g) || [text]
  }
  
  private getOverlapText(text: string, overlapTokens: number): string {
    const tokens = encode(text)
    const startIndex = Math.max(0, tokens.length - overlapTokens)
    return decode(tokens.slice(startIndex))
  }
  
  private createChunk(
    content: string,
    index: number,
    startChar: number,
    tokens: number
  ): Chunk {
    return {
      id: `chunk-${index}-${Date.now()}`,
      index,
      content,
      tokens,
      metadata: {
        startChar,
        endChar: startChar + content.length
      }
    }
  }
  
  private linkChunks(chunks: Chunk[]): void {
    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) {
        chunks[i].metadata.prevChunkId = chunks[i - 1].id
      }
      if (i < chunks.length - 1) {
        chunks[i].metadata.nextChunkId = chunks[i + 1].id
      }
    }
  }
}
