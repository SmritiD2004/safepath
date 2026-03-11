// app/api/admin/certificates/route.ts
//
// GET  — list all certificates (filterable by status: pending | approved | rejected | all)
// POST — approve or reject a certificate by id

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// ── Auth guard helper ────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  return user?.role === 'ADMIN' ? session : null
}

// ── GET /api/admin/certificates?status=pending|approved|rejected|all ─────────
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'

  // Build the where filter
  const where =
    status === 'pending'
      ? { adminApproved: null }
      : status === 'approved'
        ? { adminApproved: true }
        : status === 'rejected'
          ? { adminApproved: false }
          : {} // 'all'

  const certs = await db.userCertificate.findMany({
    where,
    orderBy: { issuedAt: 'desc' },
    select: {
      id: true,
      code: true,
      issuedAt: true,
      readinessLevel: true,
      avgConfidence: true,
      avgEq: true,
      avgRisk: true,
      completedScenarios: true,
      totalRuns: true,
      adminApproved: true,
      adminReviewedAt: true,
      adminNote: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json({ certificates: certs })
}

// ── POST /api/admin/certificates ─────────────────────────────────────────────
// Body: { id: string; action: 'approve' | 'reject'; note?: string }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  let body: { id?: string; action?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { id, action, note } = body
  if (!id || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json(
      { error: 'Required: id (string), action ("approve" | "reject").' },
      { status: 400 }
    )
  }

  const existing = await db.userCertificate.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 })
  }

  const updated = await db.userCertificate.update({
    where: { id },
    data: {
      adminApproved: action === 'approve',
      adminReviewedAt: new Date(),
      adminNote: note ?? null,
    },
    select: {
      id: true,
      code: true,
      adminApproved: true,
      adminReviewedAt: true,
      adminNote: true,
    },
  })

  return NextResponse.json({ success: true, certificate: updated })
}