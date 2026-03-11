import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimitAuth, rateLimitResponse } from '@/lib/middleware/rateLimit'
import { createResetToken, sendResetEmail } from '@/lib/passwordReset'

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const limit = rateLimitAuth(req)
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter)

  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase().trim()
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    })

    // Always return success to avoid account enumeration
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: true })
    }

    const token = await createResetToken(email)
    const delivery = await sendResetEmail(email, token)

    return NextResponse.json({
      success: true,
      resetUrl: delivery.delivered ? undefined : delivery.resetUrl,
    })
  } catch {
    return NextResponse.json({ error: 'Could not send reset email.' }, { status: 500 })
  }
}
