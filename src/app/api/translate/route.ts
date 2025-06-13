import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, targetLang, tier } = body
    
    // Create a simple PDF with the text
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
50 750 Td
(${text.replace(/[()\\]/g, '\\$&')}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
366
%%EOF`

    // Create FormData with PDF
    const formData = new FormData()
    const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' })
    formData.append('file', pdfBlob, 'text.pdf')
    formData.append('target_lang', targetLang || 'vi')
    formData.append('source_lang', 'en')
    formData.append('tier', tier || 'standard')
    
    const response = await fetch(`${BACKEND_URL}/translate`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Translation failed' },
        { status: response.status }
      )
    }
    
    // Extract translated text
    const translatedText = data.translated_text || data.translation || data.text || 'Translation not found'
    
    return NextResponse.json({
      translatedText,
      ...data
    })
  } catch (error) {
    console.error('Translate error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
