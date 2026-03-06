import { NextRequest, NextResponse } from 'next/server'
import { getCoachFeedback } from '@/lib/ai/coach'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      scenarioId = 'unknown',
      nodeId = 'unknown',
      choiceText = '',
      playerHistory = [],
      riskLevel = 50,
    } = body ?? {}

    const feedback = await getCoachFeedback({
      scenarioId: String(scenarioId),
      nodeId: String(nodeId),
      choiceText: String(choiceText),
      playerHistory: Array.isArray(playerHistory) ? playerHistory.map(String) : [],
      riskLevel: Number(riskLevel) || 50,
    })

    return NextResponse.json({
      success: true,
      ...feedback,
    })
  } catch {
    return NextResponse.json(
      {
        success: true,
        feedback:
          "Your instincts are developing well. In real situations, trust your body's signals and prioritize creating safety.",
        hint: 'Look for exits, allies, and opportunities to create distance.',
        riskDelta: 0,
        eqDelta: 5,
        coachMood: 'encouraging',
        nextScenarioSuggestion: null,
      },
      { status: 200 }
    )
  }
}
