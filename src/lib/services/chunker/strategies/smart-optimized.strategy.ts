import { BaseChunkingStrategy } from './base.strategy'
import { Chunk, ChunkOptions } from '../types'
import { encoding_for_model } from '@dqbd/tiktoken'
import pLimit from 'p-limit'
import { nanoid } from 'nanoid'

// Cache cho token counting
const tokenCountCache = new Map<string, number>()
const MAX_CACHE_SIZE = 10000

// Singleton tokenizer
let tiktoken: ReturnType<typeof encoding_for_model> | null = null
function getTokenizer() {
  if (!tiktoken) {
    tiktoken = encoding_for_model('gpt-4')
  }
  return tiktoken
}

// Tokenizer interface
export type Tokenizer = (text: string) => number

// Extended options
export interface SmartChunkOptions extends ChunkOptions {
  tokenizer?: Tokenizer
  sectionTargetTokens?: number
  enableAsyncDNA?: boolean
  concurrencyLimit?: number
  headingPattern?: RegExp
}

// Optimized DNA structure
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

// Optimized Section Detector
export class OptimizedSectionDetector {
  private headingPattern = /^#{1,6}\s+|^={3,}|^-{3,}|^\d+\.\s+/gm
  
  detect(text: string, tokenizer: Tokenizer, targetTokens: number, customHeadingPattern?: RegExp): string[] {
    const pattern = customHeadingPattern || this.headingPattern
    const sections: string[] = []
    
    // Split by double newlines first
    const paragraphs = text.split(/\n{2,}/)
    
    let currentSection = ''
    let currentTokens = 0
    
    for (const paragraph of paragraphs) {
      const paragraphTokens = tokenizer(paragraph)
      
      // Check if this is a heading
      const isHeading = pattern.test(paragraph)
      
      // If adding this paragraph exceeds target
      if (currentTokens + paragraphTokens > targetTokens && currentSection) {
        sections.push(currentSection.trim())
        currentSection = paragraph
        currentTokens = paragraphTokens
      } else if (isHeading && currentSection && currentTokens > targetTokens * 0.5) {
        // Start new section at heading if current is big enough
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

// Optimized DNA Extractor
export class OptimizedDNAExtractor {
  private limit = pLimit(8) // Concurrent limit
  
  async extractBatch(chunks: Chunk[]): Promise<void> {
    const tasks = chunks.map(chunk => 
      this.limit(() => this.extract(chunk))
    )
    await Promise.all(tasks)
  }
  
  async extract(chunk: Chunk): Promise<void> {
    const text = chunk.content
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
      complexity: this.calculateComplexity(text)
    }
    
    chunk.metadata = chunk.metadata || {}
    chunk.metadata.dna = dna
  }
  
  private extractTopics(normalizedText: string): string[] {
    const words = normalizedText.split(/\W+/).filter(w => w.length > 4)
    const freq: Record<string, number> = {}
    
    // Common words set for O(1) lookup
    const commonWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 
      'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'which', 'there'])
    
    for (const word of words) {
      if (!commonWords.has(word)) {
        freq[word] = (freq[word] || 0) + 1
      }
    }
    
    return Object.entries(freq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }
  
  private extractEntities(text: string): string[] {
    // Improved regex for various name patterns
    const patterns = [
      /\b[A-Z][a-zA-Z'ʼ']+(?:\s+[A-Z][a-zA-Z'ʼ']+)*\b/g, // English names
      /\b[A-Z]{2,}\b/g, // Acronyms like NASA, FBI
    ]
    
    const entities = new Set<string>()
    for (const pattern of patterns) {
      const matches = text.match(pattern) || []
      matches.forEach(m => entities.add(m))
    }
    
    return Array.from(entities).slice(0, 10)
  }
  
  private analyzeSentiment(normalizedText: string): number {
    // Optimized with single regex pass
    const sentimentPattern = /\b(good|great|excellent|amazing|wonderful|fantastic|love|best|bad|poor|terrible|awful|worst|hate|horrible|disappointing)\b/g
    const matches = normalizedText.match(sentimentPattern) || []
    
    if (matches.length === 0) return 0.5
    
    const positive = matches.filter(w => 
      ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best'].includes(w)
    ).length
    
    return positive / matches.length
  }
  
  private detectStyle(normalizedText: string): 'technical' | 'narrative' | 'academic' | 'general' {
    // Combined regex for efficiency
    const patterns = {
      technical: /\b(algorithm|function|code|implementation|api|database|server|client)\b/,
      academic: /\b(research|study|hypothesis|methodology|findings|conclusion|abstract)\b/,
      narrative: /\b(story|character|narrative|plot|dialogue|scene|chapter)\b/
    }
    
    for (const [style, pattern] of Object.entries(patterns)) {
      if (pattern.test(normalizedText)) {
        return style as any
      }
    }
    return 'general'
  }
  
  private hasTable(text: string): boolean {
    // More robust table detection
    const lines = text.split('\n')
    let pipeCount = 0
    let consistentPipes = 0
    
    for (let i = 0; i < lines.length; i++) {
      const pipes = (lines[i].match(/\|/g) || []).length
      if (pipes >= 2) {
        pipeCount++
        if (i > 0 && Math.abs(pipes - (lines[i-1].match(/\|/g) || []).length) <= 1) {
          consistentPipes++
        }
      }
    }
    
    return pipeCount >= 2 && consistentPipes >= 1
  }
  
  private hasFigure(normalizedText: string): boolean {
    return /\b(figure|image|diagram|chart|graph|illustration|screenshot|fig\.|img)\b/.test(normalizedText)
  }
  
  private hasCode(text: string): boolean {
    return /```[\s\S]*```/.test(text) || 
           /\b(function|class|const|let|var|import|export|def|return)\b/.test(text)
  }
  
  private extractReferences(text: string): string[] {
    const refs = new Set<string>()
    
    // Numeric references [1], [2]
    const numRefs = text.match(/\[\d+\]/g) || []
    numRefs.forEach(r => refs.add(r))
    
    // Academic citations (Author, Year)
    const acadRefs = text.match(/\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*\d{4}\)/g) || []
    acadRefs.forEach(r => refs.add(r))
    
    return Array.from(refs).slice(0, 20)
  }
  
  private detectLanguage(text: string): string {
    // Quick language detection
    const patterns = {
      vi: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
      zh: /[\u4e00-\u9fa5]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ko: /[\uac00-\ud7af]/
    }
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return lang
    }
    return 'en'
  }
  
  private calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    
    if (sentences.length === 0 || words.length === 0) return 0
    
    const avgWordsPerSentence = words.length / sentences.length
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size
    const lexicalDiversity = uniqueWords / words.length
    
    // Fixed formula: higher diversity = higher complexity
    const sentenceComplexity = Math.min(avgWordsPerSentence / 25, 1) * 5
    const lexicalComplexity = lexicalDiversity * 5
    
    return Math.min(Math.round(sentenceComplexity + lexicalComplexity), 10)
  }
}

// Main Optimized Smart Chunking Strategy
export class SmartOptimizedChunkingStrategy extends BaseChunkingStrategy {
  private sectionDetector = new OptimizedSectionDetector()
  private dnaExtractor = new OptimizedDNAExtractor()
  private tokenizerType: string = 'unknown'
  
  constructor() {
    super()
    // Check tokenizer type once
    try {
      getTokenizer()
      this.tokenizerType = 'tiktoken'
    } catch {
      this.tokenizerType = 'fallback'
    }
  }
  
  // Optimized tokenizer function
  private tokenizer: Tokenizer = (text: string) => {
    // Check cache first
    if (tokenCountCache.has(text)) {
      return tokenCountCache.get(text)!
    }
    
    let count: number
    try {
      const encoder = getTokenizer()
      count = encoder.encode(text).length
    } catch {
      // Fallback
      count = Math.ceil(text.length / 4)
    }
    
    // Add to cache with size limit
    if (tokenCountCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entries (simple FIFO)
      const firstKey = tokenCountCache.keys().next().value
      tokenCountCache.delete(firstKey)
    }
    tokenCountCache.set(text, count)
    
    return count
  }
  
  public countTokens(text: string): number {
    return this.tokenizer(text)
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
    
    // Validate options
    if (opts.overlap >= opts.maxTokens) {
      throw new Error('Overlap must be less than maxTokens')
    }
    
    // Detect sections
    const sections = this.sectionDetector.detect(
      text, 
      this.tokenizer, 
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
      globalCharOffset += section.length + 2 // +2 for \n\n
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
    const totalTokens = this.tokenizer(section)
    const maxTokens = opts.maxTokens
    const overlap = Math.min(opts.overlap || 0, maxTokens - 1)
    
    // If section fits in one chunk
    if (totalTokens <= maxTokens) {
      chunks.push(this.createChunk(
        section,
        sectionIdx,
        0,
        startOffset
      ))
      return chunks
    }
    
    // Detect language for better char/token ratio
    const lang = this.detectLanguage(section)
    const avgCharsPerToken = this.getCharsPerToken(lang)
    
    // Split section into chunks
    let currentPos = 0
    let localIdx = 0
    const chunkSizeChars = Math.floor(maxTokens * avgCharsPerToken)
    const overlapChars = Math.floor(overlap * avgCharsPerToken)
    
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
          startOffset + currentPos
        ))
        localIdx++
      }
      
      // Move position with overlap
      currentPos = endPos - overlapChars
      
      // Prevent infinite loop
      if (currentPos <= 0 && endPos >= section.length) break
      if (currentPos < 0) currentPos = endPos
    }
    
    return chunks
  }
  
  private createChunk(
    content: string,
    sectionIdx: number,
    localIdx: number,
    startOffset: number
  ): Chunk {
    const tokens = this.tokenizer(content)
    
    return {
      id: nanoid(12),
      index: sectionIdx * 1000 + localIdx, // Simplified index
      content: content,
      tokens: tokens,
      startOffset: startOffset,
      endOffset: startOffset + content.length,
      metadata: {
        sectionIndex: sectionIdx,
        localIndex: localIdx,
        type: 'smart-optimized',
        tokenizerType: this.tokenizerType
      }
    }
  }
  
  private detectLanguage(text: string): string {
    // Quick language detection for char/token ratio
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return 'vi'
    return 'en'
  }
  
  private getCharsPerToken(language: string): number {
    // Empirical values from testing
    const ratios = {
      en: 4.5,
      vi: 1.3,
      zh: 0.7,
      ja: 0.7,
      ko: 0.8
    }
    return ratios[language] || 4
  }
  
  private findWordBoundary(text: string, position: number): number {
    // Try to find space within 50 chars
    const searchRange = 50
    const start = Math.max(0, position - searchRange)
    const end = Math.min(text.length, position + searchRange)
    
    const substring = text.substring(start, end)
    const relativePos = position - start
    
    // Find nearest space
    let bestPos = position
    let minDistance = searchRange
    
    for (let i = 0; i < substring.length; i++) {
      if (/\s/.test(substring[i])) {
        const distance = Math.abs(i - relativePos)
        if (distance < minDistance) {
          minDistance = distance
          bestPos = start + i
        }
      }
    }
    
    return bestPos
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