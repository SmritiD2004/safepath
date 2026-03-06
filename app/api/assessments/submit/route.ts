import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const submitSchema = z.object({
  type: z.enum(['PRE', 'POST']),
  score: z.number().int().min(0).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const saved = await db.assessment.create({
      data: {
        userId,
        type: parsed.data.type,
        score: parsed.data.score,
      },
      select: {
        id: true,
        type: true,
        score: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, assessment: saved })
  } catch {
    return NextResponse.json({ error: 'Could not save assessment.' }, { status: 500 })
  }
}
