import { parseDOCX } from './docx'

export async function parseFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = file.name.toLowerCase()
  
  if (fileName.endsWith('.pdf')) {
    try {
      const pdf = (await import('pdf-parse')).default;
      const data = await pdf(buffer);
      return data.text || 'No text found in PDF';
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return parseDOCX(buffer)
  } else if (fileName.endsWith('.txt')) {
    return buffer.toString('utf-8')
  } else {
    throw new Error('Unsupported file type. Supported: PDF, DOCX, TXT')
  }
}

export function getFileInfo(file: File) {
  const fileName = file.name.toLowerCase()
  let type = 'unknown'
  
  if (fileName.endsWith('.pdf')) type = 'PDF'
  else if (fileName.endsWith('.docx')) type = 'DOCX'
  else if (fileName.endsWith('.doc')) type = 'DOC'
  else if (fileName.endsWith('.txt')) type = 'TXT'
  
  return {
    name: file.name,
    size: file.size,
    type,
    sizeFormatted: formatFileSize(file.size)
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}