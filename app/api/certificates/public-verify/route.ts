import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
    if (!code) {
      return NextResponse.json({ found: false, error: 'Certificate code is required.' }, { status: 400 })
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
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!cert) {
      return NextResponse.json({ found: false }, { status: 200 })
    }

    return NextResponse.json(
      {
        found: true,
        certificate: cert,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ found: false, error: 'Could not verify certificate.' }, { status: 500 })
  }
}
