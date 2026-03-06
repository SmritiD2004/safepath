import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createVerificationToken, sendVerificationEmail } from '@/lib/verification'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Missing email.' }, { status: 400 })

    const user = await db.user.findUnique({
      where: { email },
      select: { emailVerified: true, id: true },
    })

    if (!user) return NextResponse.json({ success: true })
    if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true })

    const token = await createVerificationToken(email)
    const delivery = await sendVerificationEmail(email, token)

    return NextResponse.json({
      success: true,
      emailSent: delivery.delivered,
      verifyUrl: delivery.delivered ? undefined : delivery.verifyUrl,
    })
  } catch {
    return NextResponse.json({ error: 'Could not resend verification.' }, { status: 500 })
  }
}
