import { BaseChunkingStrategy } from './base.strategy'
import { Chunk, ChunkOptions } from '../types'
import { encode as gptEncode } from 'gpt-3-encoder'

// ID generation với fallback
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `chunk-${timestamp}-${random}`
}

// Tokenizer interface
export type Tokenizer = (text: string) => string[]

// Extended options cho smart chunking
export interface SmartChunkOptions extends ChunkOptions {
  tokenizer?: Tokenizer
  sectionTargetTokens?: number
  enableAsyncDNA?: boolean
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

// Section detector class
export class SectionDetector {
  detect(text: string, tokenizer: Tokenizer, targetTokens: number): string[] {
    const paragraphs = text.split(/\n{2,}/)
    let currentSection = ''
    const sections: string[] = []
    
    for (const paragraph of paragraphs) {
      const trial = currentSection ? `${currentSection}\n\n${paragraph}` : paragraph
      const tokens = tokenizer(trial)
      
      if (tokens.length <= targetTokens) {
        currentSection = trial
      } else {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = paragraph
      }
    }
    
    if (currentSection) {
      sections.push(currentSection)
    }
    
    return sections
  }
}

// DNA extractor class
export class DNAExtractor {
  async extract(chunk: Chunk): Promise<void> {
    const text = chunk.content
    const dna: ChunkDNA = {
      topics: this.extractTopics(text),
      entities: this.extractEntities(text),
      sentiment: this.analyzeSentiment(text),
      style: this.detectStyle(text),
      hasTable: this.hasTable(text),
      hasFigure: this.hasFigure(text),
      hasCode: this.hasCode(text),
      references: this.extractReferences(text),
      language: this.detectLanguage(text),
      complexity: this.calculateComplexity(text)
    }
    
    chunk.metadata = chunk.metadata || {}
    chunk.metadata.dna = dna
  }

  protected extractTopics(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4)
    const freq: Record<string, number> = {}
    
    for (const word of words) {
      // Skip common words
      if (this.isCommonWord(word)) continue
      freq[word] = (freq[word] || 0) + 1
    }
    
    return Object.entries(freq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  protected extractEntities(text: string): string[] {
    const pattern = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g
    const entities = text.match(pattern) || []
    return [...new Set(entities)].slice(0, 10)
  }

  protected analyzeSentiment(text: string): number {
    const positiveWords = /\b(good|great|excellent|amazing|wonderful|fantastic|love|best)\b/gi
    const negativeWords = /\b(bad|poor|terrible|awful|worst|hate|horrible|disappointing)\b/gi
    
    const positive = (text.match(positiveWords) || []).length
    const negative = (text.match(negativeWords) || []).length
    
    if (positive + negative === 0) return 0.5
    return positive / (positive + negative)
  }

  protected detectStyle(text: string): 'technical' | 'narrative' | 'academic' | 'general' {
    if (/\b(algorithm|function|code|implementation|API|database)\b/i.test(text)) {
      return 'technical'
    }
    if (/\b(research|study|hypothesis|methodology|findings|conclusion)\b/i.test(text)) {
      return 'academic'
    }
    if (/\b(story|character|narrative|plot|dialogue|scene)\b/i.test(text)) {
      return 'narrative'
    }
    return 'general'
  }

  protected hasTable(text: string): boolean {
    return /\|.*\|/.test(text) || /\t.*\t/.test(text)
  }

  protected hasFigure(text: string): boolean {
    return /\b(figure|image|diagram|chart|graph|illustration|screenshot)\b/i.test(text)
  }

  protected hasCode(text: string): boolean {
    return /```[\s\S]*```/.test(text) || /\b(function|class|const|let|var|import|export)\b/.test(text)
  }

  protected extractReferences(text: string): string[] {
    const patterns = [
      /\[[0-9]+\]/g,  // [1], [2], etc.
      /\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*[0-9]{4}\)/g  // (Smith, 2020), (Jones et al., 2019)
    ]
    
    const refs: string[] = []
    for (const pattern of patterns) {
      const matches = text.match(pattern) || []
      refs.push(...matches)
    }
    
    return [...new Set(refs)]
  }

  protected detectLanguage(text: string): string {
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
      return 'vi'
    }
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    return 'en'
  }

  protected calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    
    if (sentences.length === 0) return 0
    
    const avgWordsPerSentence = words.length / sentences.length
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size
    const lexicalDiversity = uniqueWords / words.length
    
    // Complexity score 0-10
    const sentenceComplexity = Math.min(avgWordsPerSentence / 25, 1) * 5
    const lexicalComplexity = (1 - lexicalDiversity) * 5
    
    return Math.round(sentenceComplexity + lexicalComplexity)
  }

  protected isCommonWord(word: string): boolean {
    const common = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 
                    'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
                    'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they']
    return common.includes(word)
  }
}

// Main Smart Chunking Strategy
export class SmartChunkingStrategy extends BaseChunkingStrategy {
  private sectionDetector = new SectionDetector()
  private dnaExtractor = new DNAExtractor()
  
  // Default tokenizer - GPT-3 tokenizer với fallback
  private defaultTokenizer: Tokenizer = (text: string) => {
    try {
      // Use GPT-3 tokenizer for accurate token counting
      const tokens = gptEncode(text)
      // IMPORTANT: Return empty array for token count only
      // Don't convert all tokens to strings - causes memory issue
      return Array(tokens.length).fill('')
    } catch (error) {
      console.warn('[SmartChunker] GPT-3 tokenizer failed, using fallback:', error)
      // Fallback to simple whitespace tokenizer
      return text.split(/\s+/).filter(token => token.length > 0)
    }
  }

  // Utility method to count tokens in text
  public countTokens(text: string): number {
    try {
      return gptEncode(text).length
    } catch {
      // Fallback approximation
      return Math.ceil(text.length / 4)
    }
  }
  
  // Get tokenizer type
  public getTokenizerType(): string {
    try {
      gptEncode('test')
      return 'gpt-3-encoder'
    } catch {
      return 'whitespace'
    }
  }

  // Main chunking method
  async chunk(text: string, options: ChunkOptions): Promise<Chunk[]> {
    const opts: SmartChunkOptions = {
      ...this.defaultOptions,
      ...options,
      tokenizer: this.defaultTokenizer,
      sectionTargetTokens: 1000,
      enableAsyncDNA: true
    }

    const tokenizer = opts.tokenizer!
    const sections = this.sectionDetector.detect(
      text, 
      tokenizer, 
      opts.sectionTargetTokens!
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
        tokenizer,
        opts
      )
      chunks.push(...sectionChunks)
      globalCharOffset += section.length + 2 // +2 for \n\n
    }
    
    // Extract DNA
    if (opts.generateDNA) {
      if (opts.enableAsyncDNA) {
        // Async extraction for better performance
        await Promise.all(chunks.map(chunk => this.dnaExtractor.extract(chunk)))
      } else {
        // Sequential extraction
        for (const chunk of chunks) {
          await this.dnaExtractor.extract(chunk)
        }
      }
    }
    
    // Link chunks
    this.linkChunks(chunks)
    
    return chunks
  }

  protected chunkSection(
    section: string,
    sectionIdx: number,
    startOffset: number,
    tokenizer: Tokenizer,
    opts: SmartChunkOptions
  ): Chunk[] {
    const chunks: Chunk[] = []
    
    // Use countTokens for accurate count instead of tokenizer
    const totalTokens = this.countTokens(section)
    const maxTokens = opts.maxTokens
    const overlap = opts.overlap || 0
    
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
    
    // Split section into chunks based on character positions
    let currentPos = 0
    let localIdx = 0
    const avgCharsPerToken = section.length / totalTokens
    
    while (currentPos < section.length) {
      // Calculate chunk size in characters
      const chunkSizeChars = Math.floor(maxTokens * avgCharsPerToken)
      let endPos = currentPos + chunkSizeChars
      
      // Don't exceed section length
      if (endPos > section.length) {
        endPos = section.length
      }
      
      // Find nearest word boundary
      if (endPos < section.length) {
        const nextSpace = section.indexOf(' ', endPos)
        const prevSpace = section.lastIndexOf(' ', endPos)
        
        if (nextSpace !== -1 && nextSpace - endPos < 20) {
          endPos = nextSpace
        } else if (prevSpace !== -1 && endPos - prevSpace < 20) {
          endPos = prevSpace
        }
      }
      
      const chunkText = section.substring(currentPos, endPos).trim()
      
      if (chunkText.length > 0) {
        chunks.push(this.createChunk(
          chunkText,
          sectionIdx,
          localIdx,
          startOffset + currentPos,
          this.countTokens(chunkText)
        ))
        localIdx++
      }
      
      // Move position with overlap
      const overlapChars = Math.floor(overlap * avgCharsPerToken)
      currentPos = endPos - overlapChars
      
      if (currentPos >= section.length) break
    }
    
    return chunks
  }

  protected createChunk(
    content: string,
    sectionIdx: number,
    localIdx: number,
    startOffset: number,
    tokenCount: number
  ): Chunk {
    // Recalculate token count for accuracy
    const actualTokenCount = this.countTokens(content)
    
    return {
      id: generateId(),
      index: sectionIdx * 1000000 + localIdx,
      content: content.trim(),
      tokens: actualTokenCount, // Use actual count
      startOffset: startOffset,
      endOffset: startOffset + content.length,
      metadata: {
        sectionIndex: sectionIdx,
        localIndex: localIdx,
        type: 'smart',
        tokenizerType: this.getTokenizerType()
      }
    }
  }

  protected calculateCharOffset(
    tokenPosition: number,
    totalTokens: number,
    textLength: number
  ): number {
    if (totalTokens === 0) return 0
    const ratio = tokenPosition / totalTokens
    return Math.floor(textLength * ratio)
  }

  protected linkChunks(chunks: Chunk[]): void {
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