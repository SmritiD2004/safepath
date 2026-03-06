import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { calculateCertificationMetrics, generateCertificateCode } from '@/lib/certificate'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const [user, runs] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      db.scenarioRun.findMany({
        where: { userId, status: 'COMPLETED' },
        select: {
          scenarioId: true,
          finalConfidence: true,
          finalEq: true,
          finalRisk: true,
        },
      }),
    ])
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const metrics = calculateCertificationMetrics(runs)
    if (!metrics.certificateUnlocked) {
      return NextResponse.json(
        {
          eligible: false,
          metrics,
        },
        { status: 200 }
      )
    }

    let cert = await db.userCertificate.findUnique({
      where: { userId },
      select: {
        id: true,
        code: true,
        issuedAt: true,
        issuedBy: true,
        avgConfidence: true,
        avgEq: true,
        avgRisk: true,
        completedScenarios: true,
        totalRuns: true,
        readinessLevel: true,
      },
    })

    if (!cert) {
      cert = await db.userCertificate.create({
        data: {
          userId,
          code: generateCertificateCode(),
          avgConfidence: metrics.avgConfidence,
          avgEq: metrics.avgEq,
          avgRisk: metrics.avgRisk,
          completedScenarios: metrics.done,
          totalRuns: metrics.totalRuns,
          readinessLevel: metrics.readinessLevel,
        },
        select: {
          id: true,
          code: true,
          issuedAt: true,
          issuedBy: true,
          avgConfidence: true,
          avgEq: true,
          avgRisk: true,
          completedScenarios: true,
          totalRuns: true,
          readinessLevel: true,
        },
      })
    }

    return NextResponse.json({
      eligible: true,
      certificate: cert,
      user: {
        name: user.name,
        email: user.email,
      },
      metrics,
    })
  } catch {
    return NextResponse.json({ error: 'Could not load certificate.' }, { status: 500 })
  }
}
