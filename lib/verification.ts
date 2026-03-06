import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24

function appBaseUrl() {
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
}

function buildVerifyUrl(token: string, email: string) {
  const base = appBaseUrl()
  const params = new URLSearchParams({ token, email })
  return `${base}/verify-email?${params.toString()}`
}

export async function createVerificationToken(email: string) {
  const token = randomBytes(32).toString('hex')
  const identifier = email.toLowerCase().trim()

  await db.verificationToken.deleteMany({
    where: {
      identifier,
    },
  })

  await db.verificationToken.create({
    data: {
      identifier,
      token,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })

  return token
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = buildVerifyUrl(token, email)
  const result = await sendEmail({
    to: email,
    subject: 'Verify your SafePath account',
    text: `Verify your email to activate your account: ${verifyUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Verify your SafePath account</h2>
        <p>Click the button below to verify your email and activate your account.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background:#7b1d3a;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;display:inline-block;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, copy this link:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  })

  return { ...result, verifyUrl }
}

export async function verifyEmailToken(email: string, token: string) {
  const identifier = email.toLowerCase().trim()
  const record = await db.verificationToken.findFirst({
    where: {
      identifier,
      token,
    },
  })

  if (!record) return { ok: false as const, reason: 'invalid' as const }
  if (record.expires < new Date()) {
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    })
    return { ok: false as const, reason: 'expired' as const }
  }

  await db.$transaction([
    db.user.update({
      where: { email: identifier },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    }),
  ])

  return { ok: true as const }
}
