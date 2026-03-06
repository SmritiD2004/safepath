import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { deriveRunState } from '@/lib/scenario-run'

const completeSchema = z.object({
  runId: z.string().min(1),
  outcome: z.string().max(80).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = completeSchema.safeParse(body)
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
      return NextResponse.json({ error: 'Scenario run not found or already completed.' }, { status: 404 })
    }
    if (run.userId && run.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Not authorized for this scenario run.' }, { status: 403 })
    }

    const events = await db.scenarioChoiceEvent.findMany({
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
      events
    )

    if (state.error) {
      return NextResponse.json({ error: `Run state invalid: ${state.error}` }, { status: 409 })
    }
    if (!state.isEnd) {
      return NextResponse.json(
        { error: 'Cannot complete run before reaching a terminal scenario node.' },
        { status: 400 }
      )
    }

    await db.scenarioRun.update({
      where: { id: parsed.data.runId },
      data: {
        status: 'COMPLETED',
        finalRisk: state.riskLevel,
        finalConfidence: state.confidence,
        finalEq: state.eqScore,
        completedAt: new Date(),
        outcome: state.endType ?? parsed.data.outcome ?? null,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not complete scenario run.' }, { status: 500 })
  }
}
