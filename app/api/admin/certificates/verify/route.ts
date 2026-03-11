import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role ?? 'USER'
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin only.' }, { status: 403 })
    }

    const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
    if (!code) {
      return NextResponse.json({ error: 'Certificate code is required.' }, { status: 400 })
    }

    const cert = await db.userCertificate.findUnique({
      where: { code },
      select: {
        code: true,
        issuedAt: true,
        issuedBy: true,
        avgConfidence: true,
        avgEq: true,
        avgRisk: true,
        completedScenarios: true,
        totalRuns: true,
        readinessLevel: true,
        // ── Admin approval fields ──────────────────────────────
        adminApproved: true,
        adminReviewedAt: true,
        adminNote: true,
        // ──────────────────────────────────────────────────────
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!cert) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      certificate: cert,
    })
  } catch {
    return NextResponse.json({ error: 'Could not verify certificate.' }, { status: 500 })
  }
}