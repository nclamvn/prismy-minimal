import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('File received:', file.name, file.type, file.size)

    // Simple mock response for now
    const mockResponse = {
      success: true,
      analysis: {
        type: 'general',
        language: 'en',
        complexity: 5,
        pageCount: 1,
        insights: [
          `File: ${file.name}`,
          `Size: ${(file.size / 1024).toFixed(1)} KB`,
          `Type: ${file.type || 'unknown'}`
        ],
        estimatedTime: '1 minute',
        requirements: []
      },
      result: {
        original: 'Test document content',
        translated: 'Nội dung tài liệu test',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          processedAt: new Date()
        }
      },
      decisions: [{
        type: 'strategy',
        description: 'Mock translation for testing',
        confidence: 0.95,
        timestamp: new Date()
      }]
    }

    return NextResponse.json(mockResponse)
    
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Processing failed', message: error.message },
      { status: 500 }
    )
  }
}
