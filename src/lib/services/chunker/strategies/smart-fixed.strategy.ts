import { BaseChunkingStrategy } from './base.strategy'
import { Chunk, ChunkOptions } from '../types'
import { encode as gptEncode } from 'gpt-3-encoder'
import pLimit from 'p-limit'
import { nanoid } from 'nanoid'

// Cache for token counting only
const tokenCountCache = new Map<string, number>()
const MAX_CACHE_SIZE = 10000

// Count tokens without creating arrays
function countTokens(text: string): number {
  // Check cache first
  if (tokenCountCache.has(text)) {
    return tokenCountCache.get(text)!
  }
  
  let count: number
  try {
    // Just get length, don't create array
    count = gptEncode(text).length
  } catch {
    // Fallback estimation
    count = Math.ceil(text.length / 4)
  }
  
  // Add to cache with size limit
  if (tokenCountCache.size >= MAX_CACHE_SIZE) {
    const firstKey = tokenCountCache.keys().next().value
    tokenCountCache.delete(firstKey)
  }
  tokenCountCache.set(text, count)
  
  return count
}

// Extended options
export interface SmartChunkOptions extends ChunkOptions {
  sectionTargetTokens?: number
  enableAsyncDNA?: boolean
  concurrencyLimit?: number
  headingPattern?: RegExp
}

// DNA structure
export interface ChunkDNA {
  topics: string[]
  entities: string[]
  sentiment: number
  style: 'technical' | 'narrative' | 'academic' | 'general'
  hasTable: boolean
  hasFigure: boolean
  hasCode: boolean
  references: string[]
  language: string
  complexity: number
}

// Fixed Section Detector - uses countTokens instead of tokenizer
export class FixedSectionDetector {
  private headingPattern = /^#{1,6}\s+|^={3,}|^-{3,}|^\d+\.\s+/gm
  
  detect(text: string, targetTokens: number, customHeadingPattern?: RegExp): string[] {
    const pattern = customHeadingPattern || this.headingPattern
    const sections: string[] = []
    
    // Split by double newlines
    const paragraphs = text.split(/\n{2,}/)
    
    let currentSection = ''
    let currentTokens = 0
    
    for (const paragraph of paragraphs) {
      // Use countTokens instead of tokenizer
      const paragraphTokens = countTokens(paragraph)
      
      // Check if this is a heading
      const isHeading = pattern.test(paragraph)
      
      // If adding this paragraph exceeds target
      if (currentTokens + paragraphTokens > targetTokens && currentSection) {
        sections.push(currentSection.trim())
        currentSection = paragraph
        currentTokens = paragraphTokens
      } else if (isHeading && currentSection && currentTokens > targetTokens * 0.5) {
        // Start new section at heading
        sections.push(currentSection.trim())
        currentSection = paragraph
        currentTokens = paragraphTokens
      } else {
        // Add to current section
        currentSection = currentSection ? `${currentSection}\n\n${paragraph}` : paragraph
        currentTokens += paragraphTokens
      }
    }
    
    if (currentSection) {
      sections.push(currentSection.trim())
    }
    
    return sections
  }
}

// Optimized DNA Extractor with concurrency limit
export class FixedDNAExtractor {
  private limit = pLimit(8) // Max 8 concurrent extractions
  private commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 
    'at', 'this', 'but', 'his', 'by', 'from', 'they', 'which', 'there'
  ])
  
  async extractBatch(chunks: Chunk[]): Promise<void> {
    // Process in batches with concurrency limit
    const tasks = chunks.map(chunk => 
      this.limit(() => this.extract(chunk))
    )
    await Promise.all(tasks)
  }
  
  async extract(chunk: Chunk): Promise<void> {
    const text = chunk.content
    
    // Normalize once
    const normalizedText = text.toLowerCase()
    
    const dna: ChunkDNA = {
      topics: this.extractTopics(normalizedText),
      entities: this.extractEntities(text),
      sentiment: this.analyzeSentiment(normalizedText),
      style: this.detectStyle(normalizedText),
      hasTable: this.hasTable(text),
      hasFigure: this.hasFigure(normalizedText),
      hasCode: this.hasCode(text),
      references: this.extractReferences(text),
      language: this.detectLanguage(text),
      complexity: this.calculateComplexity(text, normalizedText)
    }
    
    chunk.metadata = chunk.metadata || {}
    chunk.metadata.dna = dna
  }
  
  private extractTopics(normalizedText: string): string[] {
    const words = normalizedText.split(/\W+/).filter(w => w.length > 4)
    const freq: Record<string, number> = {}
    
    for (const word of words) {
      if (!this.commonWords.has(word)) {
        freq[word] = (freq[word] || 0) + 1
      }
    }
    
    return Object.entries(freq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }
  
  private extractEntities(text: string): string[] {
    // Single regex pass
    const entityPattern = /\b([A-Z][a-zA-Z'ʼ']+(?:\s+[A-Z][a-zA-Z'ʼ']+)*|[A-Z]{2,})\b/g
    const matches = text.match(entityPattern) || []
    
    // Deduplicate
    const entities = [...new Set(matches)]
    return entities.slice(0, 10)
  }
  
  private analyzeSentiment(normalizedText: string): number {
    // Single regex for all sentiment words
    const sentimentWords = normalizedText.match(
      /\b(good|great|excellent|amazing|wonderful|fantastic|love|best|bad|poor|terrible|awful|worst|hate|horrible|disappointing)\b/g
    ) || []
    
    if (sentimentWords.length === 0) return 0.5
    
    const positiveWords = new Set(['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best'])
    const positive = sentimentWords.filter(w => positiveWords.has(w)).length
    
    return positive / sentimentWords.length
  }
  
  private detectStyle(normalizedText: string): 'technical' | 'narrative' | 'academic' | 'general' {
    // Check patterns in order of specificity
    if (/\b(algorithm|function|code|implementation|api|database|server|client|debug|compile)\b/.test(normalizedText)) {
      return 'technical'
    }
    if (/\b(research|study|hypothesis|methodology|findings|conclusion|abstract|analysis)\b/.test(normalizedText)) {
      return 'academic'
    }
    if (/\b(story|character|narrative|plot|dialogue|scene|chapter|protagonist)\b/.test(normalizedText)) {
      return 'narrative'
    }
    return 'general'
  }
  
  private hasTable(text: string): boolean {
    const lines = text.split('\n')
    let tableLineCount = 0
    
    for (const line of lines) {
      if ((line.match(/\|/g) || []).length >= 2) {
        tableLineCount++
        if (tableLineCount >= 2) return true
      }
    }
    
    return false
  }
  
  private hasFigure(normalizedText: string): boolean {
    return /\b(figure|image|diagram|chart|graph|illustration|screenshot|fig\.|img)\b/.test(normalizedText)
  }
  
  private hasCode(text: string): boolean {
    return /```[\s\S]*```/.test(text) || 
           /\b(function|class|const|let|var|import|export|def|return)\s*[({=]/.test(text)
  }
  
  private extractReferences(text: string): string[] {
    const refs = new Set<string>()
    
    // Extract all reference patterns
    const patterns = [
      /\[\d+\]/g, // [1], [2]
      /\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*\d{4}\)/g // (Author, Year)
    ]
    
    for (const pattern of patterns) {
      const matches = text.match(pattern) || []
      matches.forEach(m => refs.add(m))
    }
    
    return Array.from(refs).slice(0, 20)
  }
  
  private detectLanguage(text: string): string {
    // Quick checks for common languages
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return 'vi'
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    return 'en'
  }
  
  private calculateComplexity(text: string, normalizedText: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = normalizedText.split(/\s+/).filter(w => w.length > 0)
    
    if (sentences.length === 0 || words.length === 0) return 0
    
    const avgWordsPerSentence = words.length / sentences.length
    const uniqueWords = new Set(words).size
    const lexicalDiversity = uniqueWords / words.length
    
    // Balanced formula
    const sentenceComplexity = Math.min(avgWordsPerSentence / 25, 1) * 5
    const lexicalComplexity = lexicalDiversity * 5
    
    return Math.min(Math.round(sentenceComplexity + lexicalComplexity), 10)
  }
}

// Main Fixed Smart Chunking Strategy
export class SmartFixedChunkingStrategy extends BaseChunkingStrategy {
  private sectionDetector = new FixedSectionDetector()
  private dnaExtractor = new FixedDNAExtractor()
  private tokenizerType: string = 'gpt-3-encoder'
  
  // Public method to count tokens
  public countTokens(text: string): number {
    return countTokens(text)
  }
  
  public getTokenizerType(): string {
    return this.tokenizerType
  }
  
  async chunk(text: string, options: ChunkOptions): Promise<Chunk[]> {
    const opts: SmartChunkOptions = {
      ...this.defaultOptions,
      ...options,
      sectionTargetTokens: 1000,
      enableAsyncDNA: true,
      concurrencyLimit: 8
    }
    
    // Validate
    if (!text || text.trim().length === 0) {
      return []
    }
    
    if (opts.overlap >= opts.maxTokens) {
      throw new Error('Overlap must be less than maxTokens')
    }
    
    // Detect sections without creating token arrays
    const sections = this.sectionDetector.detect(
      text, 
      opts.sectionTargetTokens!,
      opts.headingPattern
    )
    
    const chunks: Chunk[] = []
    let globalCharOffset = 0
    
    // Process each section
    for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
      const section = sections[sectionIdx]
      const sectionChunks = this.chunkSection(
        section,
        sectionIdx,
        globalCharOffset,
        opts
      )
      chunks.push(...sectionChunks)
      globalCharOffset += section.length + 2
    }
    
    // Extract DNA with concurrency control
    if (opts.generateDNA) {
      await this.dnaExtractor.extractBatch(chunks)
    }
    
    // Link chunks
    this.linkChunks(chunks)
    
    return chunks
  }
  
  private chunkSection(
    section: string,
    sectionIdx: number,
    startOffset: number,
    opts: SmartChunkOptions
  ): Chunk[] {
    const chunks: Chunk[] = []
    const totalTokens = countTokens(section)
    const maxTokens = opts.maxTokens
    const overlap = Math.min(opts.overlap || 0, Math.floor(maxTokens * 0.5))
    
    // If section fits in one chunk
    if (totalTokens <= maxTokens) {
      chunks.push(this.createChunk(
        section,
        sectionIdx,
        0,
        startOffset,
        totalTokens
      ))
      return chunks
    }
    
    // Detect language for better estimation
    const lang = this.detectLanguage(section)
    const avgCharsPerToken = this.getCharsPerToken(lang)
    
    // Calculate chunk parameters
    const chunkSizeChars = Math.floor(maxTokens * avgCharsPerToken)
    const overlapChars = Math.floor(overlap * avgCharsPerToken)
    
    let currentPos = 0
    let localIdx = 0
    
    while (currentPos < section.length) {
      let endPos = Math.min(currentPos + chunkSizeChars, section.length)
      
      // Find word boundary
      if (endPos < section.length) {
        endPos = this.findWordBoundary(section, endPos)
      }
      
      const chunkText = section.substring(currentPos, endPos).trim()
      
      if (chunkText.length > 0) {
        chunks.push(this.createChunk(
          chunkText,
          sectionIdx,
          localIdx,
          startOffset + currentPos,
          countTokens(chunkText)
        ))
        localIdx++
      }
      
      // Move position with overlap
      currentPos = endPos - overlapChars
      
      // Prevent infinite loop
      if (currentPos >= section.length - 10) break
      if (currentPos <= 0) currentPos = endPos
    }
    
    return chunks
  }
  
  private createChunk(
    content: string,
    sectionIdx: number,
    localIdx: number,
    startOffset: number,
    tokenCount: number
  ): Chunk {
    return {
      id: nanoid(12),
      index: sectionIdx * 1000 + localIdx,
      content: content,
      tokens: tokenCount,
      startOffset: startOffset,
      endOffset: startOffset + content.length,
      metadata: {
        sectionIndex: sectionIdx,
        localIndex: localIdx,
        type: 'smart-fixed',
        tokenizerType: this.tokenizerType
      }
    }
  }
  
  private detectLanguage(text: string): string {
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return 'vi'
    return 'en'
  }
  
  private getCharsPerToken(language: string): number {
    const ratios: Record<string, number> = {
      en: 4.5,
      vi: 1.3,
      zh: 0.7,
      ja: 0.7,
      ko: 0.8
    }
    return ratios[language] || 4
  }
  
  private findWordBoundary(text: string, position: number): number {
    // Look for space within 50 chars
    for (let offset = 0; offset < 50; offset++) {
      // Check forward
      if (position + offset < text.length && /\s/.test(text[position + offset])) {
        return position + offset
      }
      // Check backward
      if (position - offset >= 0 && /\s/.test(text[position - offset])) {
        return position - offset + 1
      }
    }
    return position
  }
  
  private linkChunks(chunks: Chunk[]): void {
    for (let i = 0; i < chunks.length; i++) {
      chunks[i].metadata = chunks[i].metadata || {}
      
      if (i > 0) {
        chunks[i].metadata.prevChunkId = chunks[i - 1].id
      }
      if (i < chunks.length - 1) {
        chunks[i].metadata.nextChunkId = chunks[i + 1].id
      }
    }
  }
}