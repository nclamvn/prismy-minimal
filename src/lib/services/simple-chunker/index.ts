// Simple chunker without complex dependencies
export interface SimpleChunk {
  id: string
  index: number
  content: string
  tokens: number
  overlap?: string
}

export class SimpleChunkerService {
  // Estimate tokens (1 token ≈ 4 chars for English, 2 chars for Vietnamese)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 3)
  }

  // Chunk by token count with overlap
  chunkByTokens(
    text: string, 
    maxTokens: number = 1000,
    overlapTokens: number = 100
  ): SimpleChunk[] {
    const chunks: SimpleChunk[] = []
    const charPerToken = 3 // average
    const chunkSize = maxTokens * charPerToken
    const overlapSize = overlapTokens * charPerToken
    
    let position = 0
    let index = 0
    let previousChunk = ''
    
    while (position < text.length) {
      // Find chunk boundary at word break
      let end = Math.min(position + chunkSize, text.length)
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end)
        if (lastSpace > position + chunkSize * 0.8) {
          end = lastSpace
        }
      }
      
      // Get chunk content
      let content = text.slice(position, end)
      
      // Add overlap from previous chunk if not first chunk
      if (index > 0 && previousChunk) {
        const overlapStart = Math.max(0, previousChunk.length - overlapSize)
        const overlap = previousChunk.slice(overlapStart)
        content = overlap + ' [...] ' + content
      }
      
      chunks.push({
        id: `chunk-${index}`,
        index,
        content: content.trim(),
        tokens: this.estimateTokens(content),
        overlap: index > 0 ? overlapSize.toString() : undefined
      })
      
      previousChunk = text.slice(position, end)
      position = end
      index++
    }
    
    return chunks
  }

  // Chunk by paragraphs (smarter)
  chunkByParagraphs(
    text: string,
    maxTokens: number = 1000
  ): SimpleChunk[] {
    const chunks: SimpleChunk[] = []
    const paragraphs = text.split(/\n\n+/)
    
    let currentChunk = ''
    let currentTokens = 0
    let index = 0
    
    for (const paragraph of paragraphs) {
      const paragraphTokens = this.estimateTokens(paragraph)
      
      // If single paragraph exceeds limit, split it
      if (paragraphTokens > maxTokens) {
        // Save current chunk if any
        if (currentChunk) {
          chunks.push({
            id: `chunk-${index++}`,
            index: chunks.length,
            content: currentChunk.trim(),
            tokens: currentTokens
          })
          currentChunk = ''
          currentTokens = 0
        }
        
        // Split large paragraph
        const sentences = paragraph.split(/[.!?]+/)
        for (const sentence of sentences) {
          const sentenceTokens = this.estimateTokens(sentence)
          if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
            chunks.push({
              id: `chunk-${index++}`,
              index: chunks.length,
              content: currentChunk.trim(),
              tokens: currentTokens
            })
            currentChunk = sentence
            currentTokens = sentenceTokens
          } else {
            currentChunk += (currentChunk ? '. ' : '') + sentence
            currentTokens += sentenceTokens
          }
        }
      } else if (currentTokens + paragraphTokens > maxTokens) {
        // Start new chunk
        chunks.push({
          id: `chunk-${index++}`,
          index: chunks.length,
          content: currentChunk.trim(),
          tokens: currentTokens
        })
        currentChunk = paragraph
        currentTokens = paragraphTokens
      } else {
        // Add to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
        currentTokens += paragraphTokens
      }
    }
    
    // Add remaining content
    if (currentChunk) {
      chunks.push({
        id: `chunk-${index}`,
        index: chunks.length,
        content: currentChunk.trim(),
        tokens: currentTokens
      })
    }
    
    return chunks
  }
}
