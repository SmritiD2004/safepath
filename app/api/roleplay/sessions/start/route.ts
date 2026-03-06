import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import SCENARIOS from '@/lib/scenarios'

const schema = z.object({
  scenarioId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }
    if (!SCENARIOS[parsed.data.scenarioId]) {
      return NextResponse.json({ error: 'Scenario not found.' }, { status: 404 })
    }

    const session = await auth()
    const created = await db.rolePlaySession.create({
      data: {
        userId: session?.user?.id ?? null,
        scenarioId: parsed.data.scenarioId,
        initialRisk: 40,
        initialConfidence: 50,
        initialEq: 50,
        currentRisk: 40,
        currentConfidence: 50,
        currentEq: 50,
      },
      select: {
        id: true,
        scenarioId: true,
        currentRisk: true,
        currentConfidence: true,
        currentEq: true,
        status: true,
      },
    })

    return NextResponse.json({ success: true, session: created })
  } catch {
    return NextResponse.json({ error: 'Could not start role-play session.' }, { status: 500 })
  }
}
