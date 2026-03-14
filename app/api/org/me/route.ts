import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await db.orgMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: 'asc' },
    select: { orgId: true, orgRole: true },
  })

  if (!membership) {
    return NextResponse.json({ orgId: null, orgRole: null })
  }

  return NextResponse.json({ orgId: membership.orgId, orgRole: membership.orgRole })
}
