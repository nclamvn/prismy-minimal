import OpenAI from 'openai';

export class OpenAITranslateService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async translateText(
    text: string, 
    targetLang: string,
    tier: 'basic' | 'standard' | 'premium' = 'standard'
  ): Promise<string> {
    try {
      const model = tier === 'premium' ? 'gpt-4' : 'gpt-3.5-turbo';
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${this.getLanguageName(targetLang)}. 
                     Maintain the original formatting, tone, and technical accuracy.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw error;
    }
  }

  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      'vi': 'Vietnamese',
      'en': 'English',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'fr': 'French',
      'es': 'Spanish',
      'de': 'German'
    };
    return languages[code] || code;
  }
}
