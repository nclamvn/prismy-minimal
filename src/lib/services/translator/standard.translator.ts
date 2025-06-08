import { OpenAITranslateService } from '../openai-translate.service';

export class StandardTranslator {
  private openAITranslate: OpenAITranslateService;

  constructor() {
    this.openAITranslate = new OpenAITranslateService();
  }

  async initialize() {
    // Standard translator initialization if needed
    console.log('StandardTranslator initialized');
  }

  async translate(
    text: string,
    targetLanguage: string,
    metadata?: any
  ): Promise<string> {
    try {
      // Use GPT-4 Mini for standard tier
      return await this.openAITranslate.translateText(text, targetLanguage, 'standard');
    } catch (error) {
      console.error('StandardTranslator error:', error);
      // Fallback to mock translation
      return `[STANDARD TRANSLATED to ${targetLanguage}]: ${text.substring(0, 100)}...`;
    }
  }
}