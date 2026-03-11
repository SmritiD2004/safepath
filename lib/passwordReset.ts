import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

const TOKEN_TTL_MS = 1000 * 60 * 30 // 30 minutes

function appBaseUrl() {
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
}

function resetIdentifier(email: string) {
  return `reset:${email.toLowerCase().trim()}`
}

function buildResetUrl(token: string, email: string) {
  const base = appBaseUrl()
  const params = new URLSearchParams({ token, email })
  return `${base}/reset-password?${params.toString()}`
}

export async function createResetToken(email: string) {
  const token = randomBytes(32).toString('hex')
  const identifier = resetIdentifier(email)

  await db.verificationToken.deleteMany({
    where: { identifier },
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

export async function sendResetEmail(email: string, token: string) {
  const resetUrl = buildResetUrl(token, email)
  const result = await sendEmail({
    to: email,
    subject: 'Reset your SafePath password',
    text: `Reset your password: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Reset your SafePath password</h2>
        <p>Click the button below to set a new password.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#7b1d3a;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;display:inline-block;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, copy this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 30 minutes.</p>
      </div>
    `,
  })

  return { ...result, resetUrl }
}

export async function verifyResetToken(email: string, token: string) {
  const identifier = resetIdentifier(email)
  const record = await db.verificationToken.findFirst({
    where: { identifier, token },
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

  await db.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: record.identifier,
        token: record.token,
      },
    },
  })

  return { ok: true as const }
}
