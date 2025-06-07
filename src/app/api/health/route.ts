export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PRISMY Translation API'
  })
}

export async function HEAD() { 
  return new Response(null, { status: 200 }) 
}
