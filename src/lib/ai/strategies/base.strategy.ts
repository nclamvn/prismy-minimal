import type { DocumentAnalysis } from '@/lib/types'

export interface StrategyConfig {
  tier: 'basic' | 'standard' | 'premium'
  targetLanguage: string
  preserveFormatting?: boolean
  analysis: DocumentAnalysis
}

export abstract class BaseStrategy {
  protected config: StrategyConfig

  constructor(config: StrategyConfig) {
    this.config = config
  }

  abstract execute(content: string): Promise<string>
  
  protected async preProcess(content: string): Promise<string> {
    // Common preprocessing
    return content.trim()
  }
  
  protected async postProcess(content: string): Promise<string> {
    // Common postprocessing
    return content
  }
}
