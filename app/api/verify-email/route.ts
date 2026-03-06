import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/verification'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = String(body?.token ?? '')
    const email = String(body?.email ?? '')

    if (!token || !email) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const result = await verifyEmailToken(email, token)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'expired' ? 'Verification link expired.' : 'Invalid verification link.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not verify email.' }, { status: 500 })
  }
}
