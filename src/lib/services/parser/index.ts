import { DocumentParser, DocxParser, TextParser, ParsedDocument } from './parsers'
import { PDFParser } from './parsers/pdf.parser'

export class ParserService {
  private parsers = new Map<string, DocumentParser>()

  constructor() {
    this.registerParsers()
  }

  private registerParsers() {
    const pdfParser = new PDFParser()
    this.parsers.set('application/pdf', pdfParser)
    
    const docxParser = new DocxParser()
    this.parsers.set('application/vnd.openxmlformats-officedocument.wordprocessingml.document', docxParser)
    
    const textParser = new TextParser()
    this.parsers.set('text/plain', textParser)
    this.parsers.set('text/markdown', textParser)
  }

  async parse(file: File): Promise<ParsedDocument> {
    const parser = this.parsers.get(file.type)
    if (!parser) {
      const textParser = new TextParser()
      return textParser.parse(file)
    }
    return parser.parse(file)
  }
}

// Use 'export type' for TypeScript isolated modules
export type { ParsedDocument }
