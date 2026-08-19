import { NextResponse } from 'next/server'
import { runCorrelationEngine } from '@/lib/intelligence/correlationEngine'

export async function POST(request: Request) {
  try {
    const { localUserId, days } = await request.json()
    
    if (!localUserId) {
      return NextResponse.json({ error: 'Missing localUserId' }, { status: 400 })
    }

    const daysToLookBack = days || 30
    const results = await runCorrelationEngine(localUserId, daysToLookBack)

    return NextResponse.json({ 
      success: true, 
      message: `Correlation engine ran successfully for ${daysToLookBack} days.`,
      insightsGenerated: results.length,
      results 
    })
  } catch (error: any) {
    console.error('Correlation engine error:', error)
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}
