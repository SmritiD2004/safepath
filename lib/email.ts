import nodemailer from 'nodemailer'

type SendEmailParams = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(params: SendEmailParams): Promise<{ delivered: boolean; previewUrl?: string }> {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM ?? 'SafePath <noreply@safepath.local>'

  if (!host || !user || !pass) {
    return { delivered: false }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const info = await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })

  const testUrl = nodemailer.getTestMessageUrl(info)
  const previewUrl = testUrl || undefined
  return { delivered: true, previewUrl }
}

export async function sendInvitationEmail(
  to: string,
  joinUrl: string,
  orgLabel: string
): Promise<{ delivered: boolean; previewUrl?: string }> {
  const subject = `You're invited to join ${orgLabel} on SafePath`
  const text = `You have been invited to join ${orgLabel} on SafePath. Use this link to join: ${joinUrl}`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2>You're invited to join ${orgLabel}</h2>
      <p>You have been invited to join ${orgLabel} on SafePath.</p>
      <p><a href="${joinUrl}" style="color: #2563eb;">Join your team</a></p>
      <p>If the button does not work, copy this link into your browser:</p>
      <p>${joinUrl}</p>
    </div>
  `

  return sendEmail({ to, subject, text, html })
}
