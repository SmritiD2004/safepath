import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { deriveRunState } from '@/lib/scenario-run'

const ABANDON_AFTER_MS = 6 * 60 * 60 * 1000 // 6 hours

export async function POST() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const inProgressRuns = await db.scenarioRun.findMany({
      where: { userId, status: 'IN_PROGRESS' },
      select: {
        id: true,
        scenarioId: true,
        startedAt: true,
        initialRisk: true,
        initialConfidence: true,
        initialEq: true,
      },
    })

    let completed = 0
    let abandoned = 0

    for (const run of inProgressRuns) {
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

      if (state.isEnd && !state.error) {
        await db.scenarioRun.update({
          where: { id: run.id },
          data: {
            status: 'COMPLETED',
            finalRisk: state.riskLevel,
            finalConfidence: state.confidence,
            finalEq: state.eqScore,
            completedAt: new Date(),
            outcome: state.endType ?? null,
          },
        })
        completed += 1
        continue
      }

      const ageMs = Date.now() - run.startedAt.getTime()
      if (ageMs >= ABANDON_AFTER_MS) {
        await db.scenarioRun.update({
          where: { id: run.id },
          data: {
            status: 'ABANDONED',
            finalRisk: state.riskLevel,
            finalConfidence: state.confidence,
            finalEq: state.eqScore,
            completedAt: new Date(),
            outcome: 'abandoned',
          },
        })
        abandoned += 1
      }
    }

    return NextResponse.json({ success: true, completed, abandoned })
  } catch {
    return NextResponse.json({ error: 'Cleanup failed.' }, { status: 500 })
  }
}
