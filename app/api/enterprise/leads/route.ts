import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  company: z.string().trim().min(1).max(160),
  teamSize: z.string().trim().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const { name, email, company, teamSize } = parsed.data
  const to = process.env.ENTERPRISE_LEADS_TO ?? process.env.EMAIL_FROM ?? ''

  if (to) {
    const subject = `New SafePath Enterprise demo request`
    const text = `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nTeam Size: ${teamSize ?? ''}`
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Enterprise Demo Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Team Size:</strong> ${teamSize ?? ''}</p>
      </div>
    `
    await sendEmail({ to, subject, text, html })
  }

  return NextResponse.json({ success: true })
}
