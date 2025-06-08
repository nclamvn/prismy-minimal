export class GoogleTranslateService {
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    // If no API key, return mock translation
    if (!this.apiKey) {
      console.warn('Google Translate API key not found, using mock translation');
      return `[Translated to ${targetLanguage}]: ${text}`;
    }

    try {
      // Google Translate API v2
      const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLanguage,
          format: 'text',
          source: 'en', // Auto-detect or specify source
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.translations[0].translatedText;
      
    } catch (error) {
      console.error('Google Translate error:', error);
      // Fallback to mock translation
      return `[Translated to ${targetLanguage}]: ${text}`;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    if (!this.apiKey) {
      return 'en'; // Default to English
    }

    try {
      const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Language detection error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.detections[0][0].language;
      
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  async translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    if (!this.apiKey) {
      return texts.map(text => `[Translated to ${targetLanguage}]: ${text}`);
    }

    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: texts,
          target: targetLanguage,
          format: 'text',
          source: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Batch translation error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.translations.map((t: any) => t.translatedText);
      
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts.map(text => `[Translated to ${targetLanguage}]: ${text}`);
    }
  }
}