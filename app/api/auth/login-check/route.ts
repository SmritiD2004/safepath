import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Missing email.' }, { status: 400 })

    const user = await db.user.findUnique({
      where: { email },
      select: { emailVerified: true, id: true },
    })

    if (!user) return NextResponse.json({ exists: false, verified: false })
    return NextResponse.json({ exists: true, verified: Boolean(user.emailVerified) })
  } catch {
    return NextResponse.json({ error: 'Could not check user.' }, { status: 500 })
  }
}
