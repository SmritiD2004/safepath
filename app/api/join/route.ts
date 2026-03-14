import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const joinSchema = z.object({
  token: z.string().trim().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 400 })
  }

  const invite = await db.orgInvitation.findUnique({
    where: { token: parsed.data.token },
  })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invite expired or invalid.' }, { status: 400 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ requiresLogin: true }, { status: 401 })
  }

  if (session.user.email && session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json({ error: 'Invite email mismatch.' }, { status: 403 })
  }

  await db.orgMember.upsert({
    where: { userId_orgId: { userId: session.user.id, orgId: invite.orgId } },
    create: {
      userId: session.user.id,
      orgId: invite.orgId,
      deptId: invite.deptId,
      jobRole: invite.jobRole,
      orgRole: 'USER',
    },
    update: {
      deptId: invite.deptId,
      jobRole: invite.jobRole,
    },
  })

  await db.orgInvitation.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  })

  return NextResponse.json({ success: true, orgId: invite.orgId })
}
