import { NextRequest, NextResponse } from 'next/server'
import { parseFile, getFileInfo } from '@/lib/parsers'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB' }, { status: 400 })
    }

    // Get file info
    const fileInfo = getFileInfo(file)
    
    // Check if PDF
    if (fileInfo.type === 'PDF') {
      return NextResponse.json({ 
        error: 'PDF support is coming soon!',
        details: 'Currently we support DOCX and TXT files. You can also paste your text directly.',
        fileName: fileInfo.name,
        fileType: fileInfo.type
      }, { status: 400 })
    }
    
    // Check supported types
    const supportedTypes = ['DOCX', 'DOC', 'TXT']
    if (!supportedTypes.includes(fileInfo.type)) {
      return NextResponse.json({ 
        error: `Unsupported file type: ${fileInfo.type}`,
        details: `We currently support: ${supportedTypes.join(', ')}`,
        fileName: fileInfo.name
      }, { status: 400 })
    }

    // Parse file content
    let text = ''
    try {
      text = await parseFile(file)
      
      // Clean up text
      text = text.trim()
      
      // Check if text is empty
      if (!text) {
        return NextResponse.json({ 
          error: 'File appears to be empty',
          details: 'Could not extract any text from the file',
          fileName: fileInfo.name
        }, { status: 400 })
      }
      
      // Limit text length for demo (optional)
      const maxLength = 50000 // ~10 pages
      if (text.length > maxLength) {
        text = text.substring(0, maxLength) + '\n\n[Text truncated due to length]'
      }
      
    } catch (parseError: any) {
      console.error('Parse error:', parseError)
      return NextResponse.json({ 
        error: `Failed to parse ${fileInfo.type} file`,
        details: parseError.message,
        fileName: fileInfo.name
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      fileSizeFormatted: fileInfo.sizeFormatted,
      fileType: fileInfo.type,
      textLength: text.length,
      text: text
    })
    
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
