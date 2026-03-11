// app/api/certificate/route.ts
//
// Changes from original:
//  1. Certificate creation now sets adminApproved: null (pending review)
//  2. Response includes adminApproved status so the UI can show "pending" state
//  3. select blocks updated to include new admin fields

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { calculateCertificationMetrics, generateCertificateCode } from '@/lib/certificate'

const CERT_SELECT = {
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
  adminApproved: true,
  adminReviewedAt: true,
  adminNote: true,
} as const

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
      return NextResponse.json({ eligible: false, metrics }, { status: 200 })
    }

    // Fetch or create the certificate record
    const cert =
      (await db.userCertificate.findUnique({
        where: { userId },
        select: CERT_SELECT,
      })) ??
      (await db.userCertificate.create({
        data: {
          userId,
          code: generateCertificateCode(),
          avgConfidence: metrics.avgConfidence,
          avgEq: metrics.avgEq,
          avgRisk: metrics.avgRisk,
          completedScenarios: metrics.done,
          totalRuns: metrics.totalRuns,
          readinessLevel: metrics.readinessLevel,
          adminApproved: null, // pending admin review
        },
        select: CERT_SELECT,
      }))

    // If admin has rejected, treat as ineligible with a reason
    if (cert.adminApproved === false) {
      return NextResponse.json(
        {
          eligible: false,
          adminRejected: true,
          adminNote: cert.adminNote ?? null,
          metrics,
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      eligible: true,
      // adminApproved: null = pending, true = fully approved
      adminApproved: cert.adminApproved ?? null,
      certificate: cert,
      user: { name: user.name, email: user.email },
      metrics,
    })
  } catch {
    return NextResponse.json({ error: 'Could not load certificate.' }, { status: 500 })
  }
}
