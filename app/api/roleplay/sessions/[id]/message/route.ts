import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { generateRolePlayTurn } from '@/lib/ai/roleplay'

const schema = z.object({
  message: z.string().min(1).max(1200),
})

function clamp100(value: number) {
  return Math.max(0, Math.min(100, value))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id
    const found = await db.rolePlaySession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { speaker: true, content: true },
        },
      },
    })
    if (!found) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }
    if (found.userId && found.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
    }
    if (found.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Session already closed.' }, { status: 400 })
    }

    const userText = parsed.data.message.trim()
    await db.rolePlayMessage.create({
      data: {
        sessionId: found.id,
        speaker: 'USER',
        content: userText,
      },
    })

    const npc = await generateRolePlayTurn({
      scenarioId: found.scenarioId,
      userMessage: userText,
      history: found.messages
        .filter((m) => m.speaker === 'USER' || m.speaker === 'NPC')
        .map((m) => ({ speaker: m.speaker as 'USER' | 'NPC', content: m.content })),
      currentRisk: found.currentRisk,
      currentConfidence: found.currentConfidence,
      currentEq: found.currentEq,
    })

    const nextRisk = clamp100(found.currentRisk + npc.riskDelta)
    const nextConfidence = clamp100(found.currentConfidence + npc.confidenceDelta)
    const nextEq = clamp100(found.currentEq + npc.eqDelta)

    await db.rolePlayMessage.create({
      data: {
        sessionId: found.id,
        speaker: 'NPC',
        content: npc.reply,
        riskImpact: npc.riskDelta,
        confidenceImpact: npc.confidenceDelta,
        eqImpact: npc.eqDelta,
      },
    })

    const totalTurns = found.messages.length + 1
    const shouldEnd = npc.shouldEnd || totalTurns >= 12
    const updated = await db.rolePlaySession.update({
      where: { id: found.id },
      data: shouldEnd
        ? {
            status: 'COMPLETED',
            currentRisk: nextRisk,
            currentConfidence: nextConfidence,
            currentEq: nextEq,
            finalRisk: nextRisk,
            finalConfidence: nextConfidence,
            finalEq: nextEq,
            completedAt: new Date(),
            outcome: npc.outcome,
          }
        : {
            currentRisk: nextRisk,
            currentConfidence: nextConfidence,
            currentEq: nextEq,
          },
      select: {
        id: true,
        status: true,
        currentRisk: true,
        currentConfidence: true,
        currentEq: true,
        finalRisk: true,
        finalConfidence: true,
        finalEq: true,
        completedAt: true,
        outcome: true,
      },
    })

    return NextResponse.json({
      success: true,
      reply: npc.reply,
      deltas: {
        risk: npc.riskDelta,
        confidence: npc.confidenceDelta,
        eq: npc.eqDelta,
      },
      session: updated,
    })
  } catch {
    return NextResponse.json({ error: 'Could not process role-play message.' }, { status: 500 })
  }
}
