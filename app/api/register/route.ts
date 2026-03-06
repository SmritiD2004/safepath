import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createVerificationToken, sendVerificationEmail } from '@/lib/verification'

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  avatar: z.enum(['/avatars/aanya.svg', '/avatars/zoya.svg', '/avatars/meera.svg', '/avatars/kavya.svg']).default('/avatars/aanya.svg'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email } })
    let userWasCreated = false

    if (existing?.emailVerified) {
      return NextResponse.json({ error: 'Account already exists.' }, { status: 409 })
    }

    const passwordHash = await hash(parsed.data.password, 12)

    if (!existing) {
      await db.user.create({
        data: {
          name: parsed.data.name.trim(),
          email,
          passwordHash,
          image: parsed.data.avatar,
        },
      })
      userWasCreated = true
    } else {
      await db.user.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name.trim(),
          passwordHash,
          image: parsed.data.avatar,
        },
      })
    }

    const token = await createVerificationToken(email)
    const delivery = await sendVerificationEmail(email, token)

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      emailSent: delivery.delivered,
      verifyUrl: delivery.delivered ? undefined : delivery.verifyUrl,
      userWasCreated,
    })
  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 })
  }
}
