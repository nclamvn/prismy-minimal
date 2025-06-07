import OpenAI from 'openai'
import type { DocumentAnalysis } from '@/lib/types'
import { config } from '@/lib/config'

export class DocumentAnalyzer {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openai.apiKey
    })
  }

  async analyze(file: File): Promise<DocumentAnalysis> {
    // Extract text preview (simple version for now)
    const text = await this.extractPreview(file)
    
    // Use GPT-4 to analyze
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze this document and respond in JSON format with:
            - type: one of [technical, legal, literature, business, academic, general]
            - language: ISO code (en, vi, etc.)
            - complexity: 1-10 scale
            - pageCount: estimated pages
            - insights: array of key observations
            - estimatedTime: like "5 minutes" or "2 hours"
            - requirements: special translation needs`
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')
    
    return {
      type: analysis.type || 'general',
      language: analysis.language || 'en',
      complexity: analysis.complexity || 5,
      pageCount: analysis.pageCount || 1,
      insights: analysis.insights || [],
      estimatedTime: analysis.estimatedTime || '10 minutes',
      requirements: analysis.requirements || []
    }
  }

  private async extractPreview(file: File): Promise<string> {
    // Simple text extraction for MVP
    // TODO: Implement proper PDF extraction
    const text = await file.text()
    return text.slice(0, 3000) // First 3000 chars
  }
}
