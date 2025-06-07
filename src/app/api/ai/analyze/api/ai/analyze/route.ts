import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE HIT ===')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Route is working',
      fileName: file.name,
      fileSize: file.size
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
