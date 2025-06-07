import { ChunkingStrategy, Chunk, ChunkOptions, ChunkDNA } from './base.strategy'
import { encode as defaultEncode } from 'gpt-3-encoder'

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
  ? crypto.randomUUID()
  : `ck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export type Tokenizer = (text: string) => number[]

export interface SmartChunkOptions extends ChunkOptions {
  tokenizer?: Tokenizer
  sectionTargetTokens?: number
  dnaExtractor?: DNAExtractor
  sectionDetector?: SectionDetector
}

export interface DNAExtractor {
  extract(chunk: Chunk): Promise<void>
}

export interface SectionDetector {
  detect(text: string, tokenizer: Tokenizer, targetTokens: number): string[]
}

export class DefaultSectionDetector implements SectionDetector {
  detect(text: string, tokenizer: Tokenizer, targetTokens: number): string[] {
    const rawParas = text.split(/\n{2,}/)
    let section = ''
    const out: string[] = []
    
    for (const p of rawParas) {
      const trial = section ? section + '\n\n' + p : p
      if (tokenizer(trial).length <= targetTokens) {
        section = trial
      } else {
        if (section) out.push(section)
        section = p
      }
    }
    if (section) out.push(section)
    return out
  }
}

export class SimpleDNAExtractor implements DNAExtractor {
  async extract(chunk: Chunk) {
    const text = chunk.content
    chunk.dna = {
      topics: this.extractTopics(text),
      entities: this.extractEntities(text),
      sentiment: this.analyzeSentiment(text),
      style: this.detectStyle(text),
      hasTable: /\||\t/.test(text),
      hasFigure: /figure|image|diagram|chart/i.test(text),
      references: this.extractReferences(text)
    }
  }

  private extractTopics(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/)
    const freq: Record<string, number> = {}
    for (const word of words) {
      if (word.length > 4) freq[word] = (freq[word] || 0) + 1
    }
    return Object.entries(freq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  private extractEntities(text: string): string[] {
    const entities = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || []
    return [...new Set(entities)].slice(0, 10)
  }

  private analyzeSentiment(text: string): number {
    const positive = (text.match(/good|great|excellent/gi) || []).length
    const negative = (text.match(/bad|poor|terrible/gi) || []).length
    return positive / (positive + negative + 1)
  }

  private detectStyle(text: string): 'technical' | 'narrative' | 'academic' | 'general' {
    if (/algorithm|function|code/i.test(text)) return 'technical'
    if (/research|study|hypothesis/i.test(text)) return 'academic'
    if (/story|character|narrative/i.test(text)) return 'narrative'
    return 'general'
  }

  private extractReferences(text: string): string[] {
    const refs = text.match(/\[[0-9]+\]|\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s*[0-9]{4}\)/g) || []
    return [...new Set(refs)]
  }
}

export class SmartChunker extends ChunkingStrategy {
  async chunk(text: string, opts: SmartChunkOptions): Promise<Chunk[]> {
    const tokenizer = opts.tokenizer ?? defaultEncode
    const sectionDetector = opts.sectionDetector ?? new DefaultSectionDetector()
    const dnaExtractor = opts.dnaExtractor ?? new SimpleDNAExtractor()
    const targetSection = opts.sectionTargetTokens ?? 1000

    const sections = sectionDetector.detect(text, tokenizer, targetSection)
    const chunks: Chunk[] = []
    let charPtr = 0

    for (const [secIdx, section] of sections.entries()) {
      for (const chunk of this.yieldChunks(section, secIdx, charPtr, tokenizer, opts)) {
        chunks.push(chunk)
      }
      charPtr += section.length + 2
    }

    if (opts.generateDNA) {
      await Promise.all(chunks.map(c => dnaExtractor.extract(c)))
    }
    
    this.linkChunks(chunks)
    return chunks
  }

  private *yieldChunks(
    section: string,
    secIdx: number,
    startOffset: number,
    tokenizer: Tokenizer,
    opts: ChunkOptions
  ): Generator<Chunk> {
    const max = opts.maxTokens
    const overlap = opts.overlap ?? 0
    const tokens = tokenizer(section)
    
    if (tokens.length <= max) {
      yield this.makeChunk(section, secIdx, 0, startOffset, tokenizer)
      return
    }

    let pos = 0
    let idx = 0
    while (pos < tokens.length) {
      const end = Math.min(pos + max, tokens.length)
      const sliceTokens = tokens.slice(pos, end)
      const content = this.decodeTokens(sliceTokens)
      yield this.makeChunk(
        content,
        secIdx,
        idx++,
        startOffset + this.getCharOffset(tokens.slice(0, pos), section),
        tokenizer
      )
      pos = end - overlap
    }
  }

  private makeChunk(
    content: string,
    secIdx: number,
    localIdx: number,
    startChar: number,
    tokenizer: Tokenizer
  ): Chunk {
    return {
      id: newId(),
      index: secIdx * 1000000 + localIdx,
      content: content.trim(),
      tokens: tokenizer(content).length,
      metadata: {
        startChar,
        endChar: startChar + content.length
      }
    }
  }

  private getCharOffset(tokens: number[], section: string): number {
    const fullTokens = defaultEncode(section)
    return Math.floor(section.length * (tokens.length / fullTokens.length))
  }

  private decodeTokens(tokens: number[]): string {
    // Placeholder - in production use proper decoder
    return tokens.map(String).join(' ')
  }

  private linkChunks(chunks: Chunk[]): void {
    for (let i = 0; i < chunks.length; i++) {
      chunks[i].metadata.prevChunkId = chunks[i - 1]?.id
      chunks[i].metadata.nextChunkId = chunks[i + 1]?.id
    }
  }
}
