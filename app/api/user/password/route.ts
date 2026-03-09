import { NextRequest, NextResponse } from 'next/server'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user?.passwordHash) {
    return NextResponse.json({ error: 'Password login is not enabled for this account.' }, { status: 400 })
  }

  const ok = await compare(parsed.data.currentPassword, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
  }

  const isSamePassword = await compare(parsed.data.newPassword, user.passwordHash)
  if (isSamePassword) {
    return NextResponse.json({ error: 'New password must be different from your current password.' }, { status: 400 })
  }

  const nextHash = await hash(parsed.data.newPassword, 12)
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: nextHash },
  })

  return NextResponse.json({ success: true })
}
