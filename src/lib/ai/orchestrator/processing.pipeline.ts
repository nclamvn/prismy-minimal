import type { BaseStrategy } from '../strategies/base.strategy'

interface ExecuteOptions {
  onProgress?: (progress: number) => void
  onDecision?: (decision: any) => void
}

export class ProcessingPipeline {
  constructor(private strategy: BaseStrategy) {}

  async execute(file: File, options: ExecuteOptions) {
    try {
      // Report progress
      options.onProgress?.(10)
      
      // Extract content (simple for now)
      const content = await file.text()
      options.onProgress?.(30)
      
      // Execute strategy
      const result = await this.strategy.execute(content)
      options.onProgress?.(90)
      
      // Complete
      options.onProgress?.(100)
      
      return {
        original: content,
        translated: result,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date()
        }
      }
    } catch (error) {
      console.error('Pipeline error:', error)
      throw error
    }
  }
}
