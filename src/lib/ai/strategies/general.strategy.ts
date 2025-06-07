import { BaseStrategy } from './base.strategy'
import OpenAI from 'openai'
import { config } from '@/lib/config'

export class GeneralStrategy extends BaseStrategy {
  private openai: OpenAI

  constructor(config: any) {
    super(config)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })
  }

  async execute(content: string): Promise<string> {
    const processed = await this.preProcess(content)
    
    // Simple translation for MVP
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Translate to ${this.config.targetLanguage}. Maintain formatting.`
        },
        {
          role: 'user',
          content: processed
        }
      ]
    })
    
    const translated = completion.choices[0].message.content || ''
    return await this.postProcess(translated)
  }
}
