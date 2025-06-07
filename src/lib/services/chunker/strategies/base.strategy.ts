import { ChunkingStrategy, Chunk, ChunkOptions } from '../types'

export abstract class BaseChunkingStrategy implements ChunkingStrategy {
  protected defaultOptions: ChunkOptions = {
    maxTokens: 3000,
    overlap: 200,
    preserveStructure: true,
    generateDNA: false
  }

  abstract chunk(text: string, options: ChunkOptions): Promise<Chunk[]>

  protected generateChunkId(index: number): string {
    return `chunk-${Date.now()}-${index}`
  }

  protected countTokens(text: string): number {
    // Simple approximation: ~4 chars per token
    return Math.ceil(text.length / 4)
  }

  protected generateDNA(content: string): string {
    // Simple DNA generation based on content characteristics
    const features = {
      length: content.length,
      words: content.split(/\s+/).length,
      sentences: content.split(/[.!?]+/).length,
      paragraphs: content.split(/\n\n+/).length,
      hasCode: /```|\bfunction\b|\bclass\b/.test(content),
      hasNumbers: /\d+/.test(content),
      language: this.detectLanguage(content)
    }
    return Buffer.from(JSON.stringify(features)).toString('base64').substring(0, 16)
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
}