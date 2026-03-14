import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { generateOrgAccessCode } from '@/lib/orgAccessCode'

async function requireOrgAdmin(userId: string, orgId: string) {
  const membership = await db.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
  })
  const allowed = ['MANAGER', 'ORG_ADMIN', 'ADMIN'] as const
  if (!membership || !allowed.includes(membership.orgRole)) {
    return false
  }
  return true
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orgId } = await params
  const allowed = await requireOrgAdmin(session.user.id, orgId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const org = await db.organisation.findUnique({
    where: { id: orgId },
    select: { accessCodeActive: true, accessCodeIssuedAt: true, accessCodeLast4: true },
  })
  if (!org) {
    return NextResponse.json({ error: 'Organisation not found.' }, { status: 404 })
  }

  return NextResponse.json({
    active: org.accessCodeActive,
    issuedAt: org.accessCodeIssuedAt,
    last4: org.accessCodeLast4,
  })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orgId } = await params
  const allowed = await requireOrgAdmin(session.user.id, orgId)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const org = await db.organisation.findUnique({ where: { id: orgId }, select: { id: true } })
  if (!org) {
    return NextResponse.json({ error: 'Organisation not found.' }, { status: 404 })
  }

  const generated = generateOrgAccessCode()
  await db.organisation.update({
    where: { id: orgId },
    data: {
      accessCodeHash: generated.hash,
      accessCodeLast4: generated.last4,
      accessCodeIssuedAt: new Date(),
      accessCodeActive: true,
    },
  })

  return NextResponse.json({
    active: true,
    issuedAt: new Date().toISOString(),
    last4: generated.last4,
    code: generated.code,
  })
}
