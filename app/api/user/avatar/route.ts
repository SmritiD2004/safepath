import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const AVATARS = ['/avatars/aanya.svg', '/avatars/zoya.svg', '/avatars/meera.svg', '/avatars/kavya.svg'] as const

const schema = z.object({
  avatar: z.enum(AVATARS),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid avatar selection.' }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { image: parsed.data.avatar },
    select: { image: true },
  })

  return NextResponse.json({ success: true, image: user.image })
}
