import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { compare, hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { rateLimitAuth, rateLimitResponse } from '@/lib/middleware/rateLimit'
import { verifyResetToken } from '@/lib/passwordReset'

const confirmSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8).max(128),
})

export async function POST(req: NextRequest) {
  const limit = rateLimitAuth(req)
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter)

  try {
    const body = await req.json()
    const parsed = confirmSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase().trim()
    const token = parsed.data.token
    const password = parsed.data.password

    const tokenCheck = await verifyResetToken(email, token)
    if (!tokenCheck.ok) {
      return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    })
    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Password login is not enabled for this account.' }, { status: 400 })
    }

    const isSamePassword = await compare(password, user.passwordHash)
    if (isSamePassword) {
      return NextResponse.json({ error: 'New password must be different from your current password.' }, { status: 400 })
    }

    const passwordHash = await hash(password, 12)
    await db.user.update({
      where: { email },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not reset password.' }, { status: 500 })
  }
}
