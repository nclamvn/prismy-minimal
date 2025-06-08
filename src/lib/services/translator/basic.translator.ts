import { GoogleTranslateService } from '../google-translate.service';

export class BasicTranslator {
  private googleTranslate: GoogleTranslateService;

  constructor() {
    this.googleTranslate = new GoogleTranslateService();
  }

  async initialize() {
    // Basic translator doesn't need initialization
    console.log('BasicTranslator initialized');
  }

  async translate(
    text: string,
    targetLanguage: string,
    metadata?: any
  ): Promise<string> {
    try {
      // Use Google Translate for basic tier
      return await this.googleTranslate.translateText(text, targetLanguage);
    } catch (error) {
      console.error('BasicTranslator error:', error);
      // Fallback to mock translation
      return `[BASIC TRANSLATED to ${targetLanguage}]: ${text.substring(0, 100)}...`;
    }
  }
}