import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function GET() {
  return NextResponse.json({ 
    message: "OpenAI route works",
    hasKey: !!process.env.OPENAI_API_KEY
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { text = '' } = body
  
  if (!text) {
    return NextResponse.json({ error: 'No text' }, { status: 400 })
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Translate to Vietnamese' },
        { role: 'user', content: text }
      ],
    })
    
    return NextResponse.json({
      translated: completion.choices[0]?.message?.content || ''
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
