import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const userId = session?.user?.id

    const found = await db.rolePlaySession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            speaker: true,
            content: true,
            createdAt: true,
          },
        },
      },
    })
    if (!found) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }
    if (found.userId && found.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
    }

    return NextResponse.json({
      session: {
        id: found.id,
        scenarioId: found.scenarioId,
        status: found.status,
        currentRisk: found.currentRisk,
        currentConfidence: found.currentConfidence,
        currentEq: found.currentEq,
        startedAt: found.startedAt,
        completedAt: found.completedAt,
        outcome: found.outcome,
      },
      messages: found.messages,
    })
  } catch {
    return NextResponse.json({ error: 'Could not load role-play session.' }, { status: 500 })
  }
}
