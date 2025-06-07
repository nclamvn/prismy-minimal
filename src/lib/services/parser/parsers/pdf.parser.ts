import { DocumentParser, ParsedDocument } from './index'

export class PDFParser extends DocumentParser {
  async parse(file: File): Promise<ParsedDocument> {
    return {
      content: `[PDF: ${file.name}]`,
      metadata: { type: 'pdf' }
    }
  }
}
