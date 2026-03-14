import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

type RunSummary = {
  userId: string | null
  finalConfidence: number | null
  finalEq: number | null
  finalRisk: number | null
}

function avg(nums: number[], fallback = 0): number {
  if (!nums.length) return fallback
  const sum = nums.reduce((a, b) => a + b, 0)
  return Math.round(sum / nums.length)
}

export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await db.orgMember.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
  })
  const allowed = ['MANAGER', 'ORG_ADMIN', 'ADMIN'] as const
  if (!membership || !allowed.includes(membership.orgRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await db.orgMember.findMany({
    where: { orgId },
    select: {
      userId: true,
      jobRole: true,
      dept: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  })

  const userIds = members.map((m) => m.userId)
  if (!userIds.length) {
    return NextResponse.json({
      totalMembers: 0,
      completionRate: 0,
      avgOrgConfidence: 0,
      avgOrgEq: 0,
      avgOrgRisk: 0,
      memberStats: [],
    })
  }

  const scenarioRuns: RunSummary[] = await db.scenarioRun.findMany({
    where: { userId: { in: userIds }, status: 'COMPLETED' },
    select: {
      userId: true,
      finalConfidence: true,
      finalEq: true,
      finalRisk: true,
    },
  })

  const rolePlayRuns: RunSummary[] = await db.rolePlaySession.findMany({
    where: { userId: { in: userIds }, status: 'COMPLETED' },
    select: {
      userId: true,
      finalConfidence: true,
      finalEq: true,
      finalRisk: true,
    },
  })

  const allRuns = [...scenarioRuns, ...rolePlayRuns]

  const memberStats = members.map((member) => {
    const userRuns = allRuns.filter((r) => r.userId === member.userId)
    const avgConfidence = avg(userRuns.map((r) => r.finalConfidence ?? 50))
    const avgEq = avg(userRuns.map((r) => r.finalEq ?? 50))
    const avgRisk = avg(userRuns.map((r) => r.finalRisk ?? 40))

    return {
      userId: member.userId,
      name: member.user?.name ?? '',
      email: member.user?.email ?? '',
      jobRole: member.jobRole ?? '',
      department: member.dept?.name ?? 'Unassigned',
      completedScenarios: userRuns.length,
      avgConfidence,
      avgEq,
      avgRisk,
    }
  })

  const totalMembers = members.length
  const completedMembers = memberStats.filter((u) => u.completedScenarios > 0).length
  const completionRate = totalMembers ? Math.round((completedMembers / totalMembers) * 100) : 0
  const avgOrgConfidence = avg(memberStats.map((u) => u.avgConfidence))
  const avgOrgEq = avg(memberStats.map((u) => u.avgEq))
  const avgOrgRisk = avg(memberStats.map((u) => u.avgRisk))

  return NextResponse.json({
    totalMembers,
    completionRate,
    avgOrgConfidence,
    avgOrgEq,
    avgOrgRisk,
    memberStats,
  })
}
