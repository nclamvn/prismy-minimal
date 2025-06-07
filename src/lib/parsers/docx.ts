import mammoth from 'mammoth'

export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('DOCX parse error:', error)
    throw new Error('Failed to parse DOCX file')
  }
}
