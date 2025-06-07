import { DocumentAnalyzer } from '../analyzers/document.analyzer'
import { StrategySelector } from '../strategies/strategy.selector'
import { ProcessingPipeline } from './processing.pipeline'
import type { DocumentAnalysis, ProcessOptions, AIDecision } from '@/lib/types'

export class AIOrchestrator {
  private analyzer: DocumentAnalyzer
  private strategySelector: StrategySelector
  private decisions: AIDecision[] = []

  constructor() {
    this.analyzer = new DocumentAnalyzer()
    this.strategySelector = new StrategySelector()
  }

  async processDocument(file: File, options: ProcessOptions) {
    try {
      // 1. Analyze document with AI
      this.logDecision('strategy', 'Starting document analysis', 0.9)
      const analysis = await this.analyzer.analyze(file)
      
      // 2. Select optimal strategy
      this.logDecision('strategy', `Selected ${analysis.type} document strategy`, 0.95)
      const strategy = await this.strategySelector.select(analysis, options)
      
      // 3. Build and execute pipeline
      const pipeline = new ProcessingPipeline(strategy)
      const result = await pipeline.execute(file, {
        onProgress: options.onProgress,
        onDecision: (decision) => {
          this.decisions.push(decision)
          options.onDecision?.(decision)
        }
      })
      
      return {
        success: true,
        result,
        analysis,
        decisions: this.decisions
      }
    } catch (error) {
      console.error('Orchestrator error:', error)
      throw error
    }
  }

  private logDecision(type: AIDecision['type'], description: string, confidence: number) {
    const decision: AIDecision = {
      type,
      description,
      confidence,
      timestamp: new Date()
    }
    this.decisions.push(decision)
  }
}
