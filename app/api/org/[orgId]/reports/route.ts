import { NextRequest, NextResponse } from 'next/server'
import { stringify } from 'csv-stringify/sync'
import { writeFile } from 'fs/promises'
import path from 'path'
import { auth } from '@/auth'
import { db } from '@/lib/db'

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
  const period = String(body?.period ?? 'custom')

  const members = await db.orgMember.findMany({
    where: { orgId },
    include: {
      user: { select: { name: true, email: true } },
      dept: { select: { name: true } },
    },
  })

  const rows = await Promise.all(
    members.map(async (member) => {
      const cert = await db.userCertificate.findUnique({
        where: { userId: member.userId },
      })
      const runs = await db.scenarioRun.count({
        where: { userId: member.userId, status: 'COMPLETED' },
      })
      return {
        Name: member.user?.name ?? 'Unknown',
        Email: member.user?.email ?? '',
        Department: member.dept?.name ?? 'Unassigned',
        Role: member.jobRole ?? '',
        'Scenarios Completed': runs,
        'Certificate Issued': cert ? 'Yes' : 'No',
        'Certificate Date': cert?.issuedAt?.toISOString().split('T')[0] ?? '',
        'Cert Code': cert?.code ?? '',
      }
    })
  )

  const csv = stringify(rows, { header: true })
  const filename = `compliance-${orgId}-${period}-${Date.now()}.csv`
  const filepath = path.join(process.cwd(), 'public', 'reports', filename)
  await writeFile(filepath, csv)

  await db.complianceReport.create({
    data: { orgId, period, csvUrl: `/reports/${filename}` },
  })

  return NextResponse.json({ csvUrl: `/reports/${filename}` })
}
