import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import SCENARIOS from '@/lib/scenarios'

function reconstructRunState(run: {
  id: string
  scenarioId: string
  startedAt: Date
  initialRisk: number
  initialConfidence: number
  initialEq: number
  choiceEvents: Array<{
    nodeId: string
    choiceId: string
    choiceText: string
    riskAfter: number
    confidenceAfter: number
    eqAfter: number
  }>
}) {
  const scenario = SCENARIOS[run.scenarioId]
  if (!scenario) return null

  let currentNodeId = scenario.startNodeId
  let riskLevel = run.initialRisk
  let confidence = run.initialConfidence
  let eqScore = run.initialEq
  const choiceHistory: string[] = []

  for (const event of run.choiceEvents) {
    choiceHistory.push(event.choiceText)
    riskLevel = event.riskAfter
    confidence = event.confidenceAfter
    eqScore = event.eqAfter

    const node = scenario.nodes[event.nodeId]
    const choice = node?.choices.find((c) => c.id === event.choiceId)
    if (choice?.nextNodeId && scenario.nodes[choice.nextNodeId]) {
      currentNodeId = choice.nextNodeId
    }
  }

  return {
    runId: run.id,
    scenarioId: run.scenarioId,
    currentNodeId,
    riskLevel,
    confidence,
    eqScore,
    choiceHistory,
    isEnd: Boolean(scenario.nodes[currentNodeId]?.isEnd),
    elapsedSeconds: Math.max(0, Math.floor((Date.now() - run.startedAt.getTime()) / 1000)),
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ resumeAvailable: false })
    }

    const requestedRunId = req.nextUrl.searchParams.get('runId')
    const where = requestedRunId
      ? {
          id: requestedRunId,
          userId,
          status: 'IN_PROGRESS' as const,
        }
      : {
          userId,
          status: 'IN_PROGRESS' as const,
        }

    const run = await db.scenarioRun.findFirst({
      where,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        scenarioId: true,
        startedAt: true,
        initialRisk: true,
        initialConfidence: true,
        initialEq: true,
        choiceEvents: {
          orderBy: { createdAt: 'asc' },
          select: {
            nodeId: true,
            choiceId: true,
            choiceText: true,
            riskAfter: true,
            confidenceAfter: true,
            eqAfter: true,
          },
        },
      },
    })

    if (!run) {
      return NextResponse.json({ resumeAvailable: false })
    }

    const reconstructed = reconstructRunState(run)
    if (!reconstructed) {
      return NextResponse.json({ resumeAvailable: false })
    }

    return NextResponse.json({
      resumeAvailable: true,
      ...reconstructed,
    })
  } catch {
    return NextResponse.json({ resumeAvailable: false }, { status: 200 })
  }
}
