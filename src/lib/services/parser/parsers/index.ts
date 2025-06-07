// Define ParsedDocument interface
export interface ParsedDocument {
  content: string
  metadata: any
}

// Base parser class
export abstract class DocumentParser {
  abstract parse(file: File): Promise<ParsedDocument>
}

// Text parser
export class TextParser extends DocumentParser {
  async parse(file: File): Promise<ParsedDocument> {
    const content = await file.text()
    return {
      content,
      metadata: { type: 'txt' }
    }
  }
}

// Docx parser placeholder
export class DocxParser extends DocumentParser {
  async parse(file: File): Promise<ParsedDocument> {
    return {
      content: 'DOCX content placeholder',
      metadata: { type: 'docx' }
    }
  }
}
