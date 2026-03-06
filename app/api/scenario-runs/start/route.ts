import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const startSchema = z.object({
  scenarioId: z.string().min(1),
  initialRisk: z.number().int().min(0).max(100).default(40),
  initialConfidence: z.number().int().min(0).max(100).default(50),
  initialEq: z.number().int().min(0).max(100).default(50),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = startSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const session = await auth()
    const run = await db.scenarioRun.create({
      data: {
        userId: session?.user?.id ?? null,
        scenarioId: parsed.data.scenarioId,
        initialRisk: parsed.data.initialRisk,
        initialConfidence: parsed.data.initialConfidence,
        initialEq: parsed.data.initialEq,
      },
      select: { id: true },
    })

    return NextResponse.json({ success: true, runId: run.id })
  } catch {
    return NextResponse.json({ error: 'Could not start scenario run.' }, { status: 500 })
  }
}
