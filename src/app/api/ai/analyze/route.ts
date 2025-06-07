import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== API ANALYZE ROUTE CALLED ===')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tier = formData.get('tier') || 'standard'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // For now, simple mock response to test if route works
    const mockContent = `This is a test document. ${file.name} has been received.`
    
    return NextResponse.json({
      success: true,
      analysis: {
        type: 'general',
        language: 'en',
        complexity: 5,
        pageCount: 1,
        insights: [
          `File: ${file.name}`,
          `Size: ${(file.size / 1024).toFixed(1)} KB`,
          `Tier: ${tier}`
        ],
        estimatedTime: '1 minute',
        requirements: []
      },
      result: {
        original: mockContent,
        translated: 'Đây là tài liệu thử nghiệm. ' + file.name + ' đã được nhận.',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          processedAt: new Date()
        }
      },
      decisions: []
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
