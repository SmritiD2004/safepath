import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { deriveRunState } from '@/lib/scenario-run'
import { applyChoiceScoring } from '@/lib/scoring'

const eventSchema = z.object({
  runId: z.string().min(1),
  nodeId: z.string().min(1),
  choiceId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = eventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const session = await auth()
    const run = await db.scenarioRun.findUnique({
      where: { id: parsed.data.runId },
      select: {
        id: true,
        status: true,
        userId: true,
        scenarioId: true,
        initialRisk: true,
        initialConfidence: true,
        initialEq: true,
      },
    })
    if (!run || run.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Scenario run is not active.' }, { status: 404 })
    }
    if (run.userId && run.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Not authorized for this scenario run.' }, { status: 403 })
    }

    const existingEvents = await db.scenarioChoiceEvent.findMany({
      where: { runId: run.id },
      orderBy: { createdAt: 'asc' },
      select: { nodeId: true, choiceId: true },
    })

    const state = deriveRunState(
      {
        scenarioId: run.scenarioId,
        initialRisk: run.initialRisk,
        initialConfidence: run.initialConfidence,
        initialEq: run.initialEq,
      },
      existingEvents
    )

    if (state.error) {
      return NextResponse.json({ error: `Run state invalid: ${state.error}` }, { status: 409 })
    }
    if (state.isEnd) {
      return NextResponse.json({ error: 'Scenario already reached end node.' }, { status: 400 })
    }
    if (parsed.data.nodeId !== state.currentNodeId) {
      return NextResponse.json(
        { error: `Invalid node transition. Expected "${state.currentNodeId}".` },
        { status: 400 }
      )
    }

    const node = state.scenario.nodes[state.currentNodeId]
    const choice = node.choices.find((c) => c.id === parsed.data.choiceId)
    if (!choice) {
      return NextResponse.json({ error: 'Choice is invalid for current node.' }, { status: 400 })
    }

    const riskBefore = state.riskLevel
    const confidenceBefore = state.confidence
    const eqBefore = state.eqScore
    const next = applyChoiceScoring(
      { risk: riskBefore, confidence: confidenceBefore, eq: eqBefore },
      choice
    )
    const riskAfter = next.risk
    const confidenceAfter = next.confidence
    const eqAfter = next.eq

    await db.scenarioChoiceEvent.create({
      data: {
        runId: parsed.data.runId,
        nodeId: parsed.data.nodeId,
        choiceId: parsed.data.choiceId,
        choiceText: choice.text,
        riskImpact: choice.riskImpact,
        eqImpact: choice.eqImpact,
        riskBefore,
        riskAfter,
        confidenceBefore,
        confidenceAfter,
        eqBefore,
        eqAfter,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not track scenario event.' }, { status: 500 })
  }
}
