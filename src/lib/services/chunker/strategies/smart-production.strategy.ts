import { BaseChunkingStrategy } from './base.strategy'
import { Chunk, ChunkOptions } from '../types'
import pLimit from 'p-limit'
import { nanoid } from 'nanoid'

// Type-only import to avoid loading the module
type Tiktoken = import('@dqbd/tiktoken').Tiktoken

// Debug control
const DEBUG = process.env.DEBUG_CHUNKER === 'true'

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log(...args)
  }
}

// Lazy-loaded encoder
let encoder: Tiktoken | null = null

function getEncoder(): Tiktoken {
  if (encoder) return encoder!
  
  // Set WASM path using entry point (not package.json)
  if (!process.env.TIKTOKEN_WASM) {
    const path = require('path')
    // ✅ Resolve entry point which IS exported
    const entry = require.resolve('@dqbd/tiktoken')  // .../dist/index.js
    const pkgDir = path.dirname(entry)               // .../dist
    
    // WASM file is in same directory as index.js since v1.0.7
    process.env.TIKTOKEN_WASM = path.join(pkgDir, 'tiktoken_bg.wasm')
  }
  
  // Dynamic require AFTER setting WASM path
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { encoding_for_model } = require('@dqbd/tiktoken')
  encoder = encoding_for_model('cl100k_base')
  return encoder!
}

// Constants
const DEFAULT_MAX_TOKENS = 1000
const DEFAULT_OVERLAP = 100
const DEFAULT_SECTION_TOKENS = 1000

// Token counting with tiktoken
function countTokens(text: string): number {
  try {
    const enc = getEncoder()
    return enc.encode(text).length
  } catch (error) {
    // Fallback word-based estimation
    const words = text.split(/\s+/).filter(w => w.length > 0).length
    return Math.ceil(words * 1.3)
  }
}

// Extended options
export interface SmartChunkOptions extends ChunkOptions {
  sectionTargetTokens?: number
  concurrencyLimit?: number
  stripContentAfterDNA?: boolean
  debug?: boolean
}

// Lightweight DNA
export interface ChunkDNA {
  language: string
  style: string
  hasCode: boolean
  hasTable: boolean
  wordCount: number
  sentenceCount: number
}

// Section Detector - uses countTokens ONLY
export class ProductionSectionDetector {
  detect(text: string, targetTokens: number, debug?: boolean): string[] {
    const sections: string[] = []
    const paragraphs = text.split(/\n{2,}/)
    
    let currentSection = ''
    let currentTokens = 0
    
    for (const paragraph of paragraphs) {
      const paragraphTokens = countTokens(paragraph)
      
      debugLog(`[SectionDetector] Paragraph tokens: ${paragraphTokens}`)
      
      if (currentTokens + paragraphTokens > targetTokens && currentSection) {
        sections.push(currentSection.trim())
        currentSection = paragraph
        currentTokens = paragraphTokens
      } else {
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

// Lightweight DNA Extractor
export class ProductionDNAExtractor {
  private limit = pLimit(8)
  
  async extractBatch(chunks: Chunk[], stripContent?: boolean): Promise<void> {
    const tasks = chunks.map(chunk => 
      this.limit(async () => {
        await this.extract(chunk)
        if (stripContent) {
          // Free memory after DNA extraction
          delete (chunk as any).content
        }
      })
    )
    await Promise.all(tasks)
  }
  
  async extract(chunk: Chunk): Promise<void> {
    debugLog(`[DNA] Extracting DNA for chunk ${chunk.id}, content length: ${chunk.content.length}`)
    
    const content = chunk.content
    const normalized = content.toLowerCase()
    
    // Lightweight DNA
    const dna: ChunkDNA = {
      language: this.detectLanguage(content),
      style: this.detectStyle(normalized),
      hasCode: /```|function|class|const|let|var/.test(content),
      hasTable: this.hasTable(content),
      wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
      sentenceCount: (content.match(/[.!?]+/g) || []).length
    }
    
    chunk.metadata = chunk.metadata || {}
    chunk.metadata.dna = dna
  }
  
  protected detectLanguage(text: string): string {
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễ]/i.test(text)) return 'vi'
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    return 'en'
  }
  
  protected detectStyle(normalized: string): string {
    if (/\b(function|class|api|code|debug)\b/.test(normalized)) return 'technical'
    if (/\b(research|study|hypothesis|findings)\b/.test(normalized)) return 'academic'
    if (/\b(story|character|plot|dialogue)\b/.test(normalized)) return 'narrative'
    return 'general'
  }
  
  protected hasTable(text: string): boolean {
    const lines = text.split('\n')
    let pipeLines = 0
    for (const line of lines) {
      if ((line.match(/\|/g) || []).length >= 2) {
        pipeLines++
        if (pipeLines >= 2) return true
      }
    }
    return false
  }
}

// Main Production Strategy
export class SmartProductionStrategy extends BaseChunkingStrategy {
  private sectionDetector = new ProductionSectionDetector()
  private dnaExtractor = new ProductionDNAExtractor()
  
  async chunk(text: string, options: ChunkOptions): Promise<Chunk[]> {
    const opts: SmartChunkOptions = {
      maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
      overlap: options.overlap ?? DEFAULT_OVERLAP,
      preserveStructure: options.preserveStructure ?? true,
      generateDNA: options.generateDNA ?? false,
      sectionTargetTokens: DEFAULT_SECTION_TOKENS,
      concurrencyLimit: 8,
      stripContentAfterDNA: false,
      debug: false,
    }
    
    // Critical validation
    if (!text || text.trim().length === 0) {
      return []
    }
    
    if (!opts.maxTokens || Number.isNaN(opts.maxTokens) || opts.maxTokens <= 0) {
      throw new Error(`[SmartChunker] maxTokens must be > 0, got ${opts.maxTokens}`)
    }
    
    if (opts.overlap && opts.overlap >= opts.maxTokens) {
      throw new Error(`[SmartChunker] overlap (${opts.overlap}) must be < maxTokens (${opts.maxTokens})`)
    }
    
    // Log memory at start
    this.logMemory('Start chunking')
    
    // Detect sections
    const sections = this.sectionDetector.detect(
      text, 
      opts.sectionTargetTokens!,
      opts.debug
    )
    
    debugLog(`[SmartChunker] Detected ${sections.length} sections`)
    this.logMemory('After section detection')
    
    const chunks: Chunk[] = []
    let globalCharOffset = 0
    
    // Process each section
    for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
      const section = sections[sectionIdx]
      debugLog(`[SmartChunker] Processing section ${sectionIdx}, length: ${section.length}`)
      
      const sectionChunks = this.chunkSection(
        section,
        sectionIdx,
        globalCharOffset,
        opts
      )
      chunks.push(...sectionChunks)
      globalCharOffset += section.length + 2
    }
    
    this.logMemory('After chunk processing')
    
    // Extract DNA with concurrency control
    if (opts.generateDNA) {
      debugLog(`[SmartChunker] Starting DNA extraction for ${chunks.length} chunks`)
      await this.dnaExtractor.extractBatch(chunks, opts.stripContentAfterDNA)
      this.logMemory('After DNA extraction')
    }
    
    // Link chunks
    this.linkChunks(chunks)
    
    return chunks
  }
  
  protected chunkSection(
    section: string,
    sectionIdx: number,
    startOffset: number,
    opts: SmartChunkOptions
  ): Chunk[] {
    const chunks: Chunk[] = []
    const totalTokens = countTokens(section)
    const maxTokens = opts.maxTokens
    
    debugLog(`[chunkSection] Section ${sectionIdx}: section.length=${section.length}, totalTokens=${totalTokens}, maxTokens=${maxTokens}`)
    
    // Validate and adjust overlap
    let overlap = opts.overlap || 0
    if (overlap >= maxTokens * 0.8) {
      console.warn(`[chunkSection] Overlap (${overlap}) too large, reducing to 50% of maxTokens`)
      overlap = Math.floor(maxTokens * 0.5)
    }
    
    // CRITICAL: EARLY RETURN FOR SMALL SECTIONS
    if (totalTokens <= maxTokens) {
      debugLog(`[chunkSection] Section fits in one chunk, returning immediately`)
      chunks.push(this.createChunk(
        section,
        sectionIdx,
        0,
        startOffset,
        totalTokens
      ))
      return chunks
    }
    
    // Calculate chunk parameters
    const avgCharsPerToken = section.length / totalTokens
    const chunkSizeChars = Math.floor(maxTokens * avgCharsPerToken)
    const overlapChars = Math.floor(overlap * avgCharsPerToken)
    
    debugLog(`[chunkSection] Chunk params: avgCharsPerToken=${avgCharsPerToken.toFixed(2)}, chunkSizeChars=${chunkSizeChars}, overlapChars=${overlapChars}`)
    
    // CRITICAL FIX: If chunk size >= section length, return single chunk
    if (chunkSizeChars >= section.length) {
      debugLog(`[chunkSection] chunkSizeChars (${chunkSizeChars}) >= section.length (${section.length}), returning single chunk`)
      chunks.push(this.createChunk(
        section,
        sectionIdx,
        0,
        startOffset,
        totalTokens
      ))
      return chunks
    }
    
    let currentPos = 0
    let localIdx = 0
    let previousPos = -1
    let iterations = 0
    const maxIterations = Math.ceil(section.length / Math.max(1, chunkSizeChars - overlapChars)) + 10
    
    while (currentPos < section.length && iterations < maxIterations) {
      iterations++
      
      // Debug trong loop - chỉ log nếu DEBUG
      if (DEBUG && (iterations % 100 === 0 || iterations <= 5)) {
        debugLog(`[chunkSection] Iteration ${iterations}: currentPos=${currentPos}, section.length=${section.length}`)
      }
      
      // Calculate end position
      let endPos = Math.min(currentPos + chunkSizeChars, section.length)
      const isLastChunk = endPos >= section.length
      
      // Find word boundary (only if not last chunk)
      if (!isLastChunk && endPos < section.length) {
        const spacePos = section.lastIndexOf(' ', endPos)
        if (spacePos > currentPos && endPos - spacePos < 50) {
          endPos = spacePos
        }
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
      
      // CRITICAL: Exit if this was the last chunk
      if (isLastChunk) {
        debugLog(`[chunkSection] Reached last chunk at iteration ${iterations}`)
        break
      }
      
      // Calculate next position with safety checks
      const nextPos = endPos - overlapChars
      
      // Debug position changes
      if (DEBUG && iterations <= 10) {
        debugLog(`[chunkSection] Iteration ${iterations}: pos ${currentPos} -> ${nextPos}, chunk length: ${chunkText.length}`)
      }
      
      // CRITICAL: Ensure forward progress
      if (nextPos <= previousPos || nextPos <= currentPos) {
        currentPos = endPos // Force forward progress
        console.warn(`[chunkSection] Forced forward progress from ${nextPos} to ${endPos}`)
      } else {
        currentPos = nextPos
      }
      
      previousPos = currentPos
    }
    
    if (iterations >= maxIterations) {
      console.error(`[chunkSection] Hit max iterations (${maxIterations}) - infinite loop prevented`)
      throw new Error('Chunking failed: possible infinite loop detected')
    }
    
    debugLog(`[chunkSection] Section ${sectionIdx} completed: ${chunks.length} chunks in ${iterations} iterations`)
    
    return chunks
  }
  
  protected createChunk(
    content: string,
    sectionIdx: number,
    localIdx: number,
    startOffset: number,
    tokenCount: number
  ): Chunk {
    return {
      id: nanoid(12),
      index: sectionIdx * 1000 + localIdx,
      content,
      tokens: tokenCount,
      startOffset,
      endOffset: startOffset + content.length,
      metadata: {
        sectionIndex: sectionIdx,
        localIndex: localIdx,
        type: 'smart-production'
      }
    }
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
  
  protected logMemory(label: string): void {
    if (DEBUG) {
      const mem = process.memoryUsage()
      console.log(`[Memory] ${label}: Heap ${Math.round(mem.heapUsed / 1024 / 1024)}MB, RSS ${Math.round(mem.rss / 1024 / 1024)}MB`)
    }
  }
  
  // Public utilities
  public countTokens(text: string): number {
    return countTokens(text)
  }
  
  public getTokenizerType(): string {
    return 'tiktoken-cl100k_base'
  }
}

// Clean up encoder on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (encoder) {
      encoder.free()
      encoder = null
    }
  })
}