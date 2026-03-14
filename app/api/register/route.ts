import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { Industry } from '@prisma/client'
import { db } from '@/lib/db'
import { createVerificationToken, sendVerificationEmail } from '@/lib/verification'
import { hashAccessCode, normalizeAccessCode } from '@/lib/orgAccessCode'
import { isTestEmail } from '@/lib/testAccounts'

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  avatar: z.enum(['/avatars/aanya.svg', '/avatars/zoya.svg', '/avatars/meera.svg', '/avatars/kavya.svg']).default('/avatars/aanya.svg'),
  industry: z.enum(['CORPORATE_IT', 'HEALTHCARE', 'MANUFACTURING', 'EDUCATION', 'RETAIL', 'BANKING_FINANCE', 'CUSTOM']).optional(),
  orgCode: z.string().trim().min(4).max(40).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase().trim()
    const isTest = isTestEmail(email)
    const now = new Date()
    const existing = await db.user.findUnique({ where: { email } })
    let userWasCreated = false

    if (existing?.emailVerified) {
      return NextResponse.json({ error: 'Account already exists.' }, { status: 409 })
    }

    let orgForCode: { id: string; industry: Industry; expiresAt: Date | null; accessCodeActive: boolean } | null = null
    if (parsed.data.orgCode) {
      const normalized = normalizeAccessCode(parsed.data.orgCode)
      const hash = hashAccessCode(normalized)
      orgForCode = await db.organisation.findUnique({
        where: { accessCodeHash: hash },
        select: { id: true, industry: true, expiresAt: true, accessCodeActive: true },
      })

      if (!orgForCode || !orgForCode.accessCodeActive) {
        return NextResponse.json({ error: 'Invalid organization access code.' }, { status: 400 })
      }
      if (orgForCode.expiresAt && orgForCode.expiresAt < now) {
        return NextResponse.json({ error: 'Organization access has expired.' }, { status: 403 })
      }
    }

    const passwordHash = await hash(parsed.data.password, 12)
    const industryToSet: Industry | undefined = orgForCode?.industry ?? (parsed.data.industry as Industry | undefined)

    if (!existing) {
      const created = await db.user.create({
        data: {
          name: parsed.data.name.trim(),
          email,
          passwordHash,
          image: parsed.data.avatar,
          industry: industryToSet,
          emailVerified: isTest ? now : undefined,
        },
      })
      if (orgForCode) {
        await db.orgMember.create({
          data: {
            userId: created.id,
            orgId: orgForCode.id,
            orgRole: 'USER',
          },
        })
      }
      userWasCreated = true
    } else {
      const updated = await db.user.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name.trim(),
          passwordHash,
          image: parsed.data.avatar,
          industry: industryToSet,
          emailVerified: existing.emailVerified ?? (isTest ? now : undefined),
        },
      })
      if (orgForCode) {
        await db.orgMember.upsert({
          where: { userId_orgId: { userId: updated.id, orgId: orgForCode.id } },
          update: {},
          create: {
            userId: updated.id,
            orgId: orgForCode.id,
            orgRole: 'USER',
          },
        })
      }
    }

    if (isTest) {
      return NextResponse.json({
        success: true,
        requiresVerification: false,
        emailSent: false,
        userWasCreated,
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
