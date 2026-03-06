import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const tipUpdateSchema = z.object({
  tipId: z.string().min(1).max(80),
  practiced: z.boolean(),
})

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ practicedTipIds: [] as string[] }, { status: 200 })
    }

    const rows = await db.userTipPractice.findMany({
      where: { userId, practiced: true },
      select: { tipId: true },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({
      practicedTipIds: rows.map((r) => r.tipId),
    })
  } catch {
    return NextResponse.json({ practicedTipIds: [] as string[] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = tipUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    await db.userTipPractice.upsert({
      where: { userId_tipId: { userId, tipId: parsed.data.tipId } },
      update: { practiced: parsed.data.practiced },
      create: {
        userId,
        tipId: parsed.data.tipId,
        practiced: parsed.data.practiced,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not update tip practice.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    await db.userTipPractice.updateMany({
      where: { userId, practiced: true },
      data: { practiced: false },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not reset tip practice.' }, { status: 500 })
  }
}
