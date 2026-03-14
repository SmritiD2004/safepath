import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sendInvitationEmail } from '@/lib/email'

const inviteSchema = z.object({
  email: z.string().trim().email(),
  deptId: z.string().trim().optional(),
  jobRole: z.string().trim().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orgId } = await params
  const membership = await db.orgMember.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
  })
  const allowed = ['MANAGER', 'ORG_ADMIN', 'ADMIN'] as const
  if (!membership || !allowed.includes(membership.orgRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const org = await db.organisation.findUnique({ where: { id: orgId }, select: { name: true } })
  if (!org) {
    return NextResponse.json({ error: 'Organisation not found.' }, { status: 404 })
  }

  const invite = await db.orgInvitation.create({
    data: {
      orgId,
      email: parsed.data.email.toLowerCase(),
      deptId: parsed.data.deptId || null,
      jobRole: parsed.data.jobRole || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? req.nextUrl.origin
  const joinUrl = `${baseUrl}/join?token=${invite.token}`

  const delivery = await sendInvitationEmail(parsed.data.email, joinUrl, org.name)

  return NextResponse.json({
    success: true,
    inviteId: invite.id,
    emailSent: delivery.delivered,
    previewUrl: delivery.previewUrl,
  })
}
