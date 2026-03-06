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
