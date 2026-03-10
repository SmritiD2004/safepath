import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getChatbotReply } from '@/lib/ai/chatbot'
import { rateLimit, rateLimitResponse } from '@/lib/middleware/rateLimit'

const schema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(1000),
      })
    )
    .max(12)
    .optional(),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 30, windowMs: 60_000, prefix: 'chatbot' })
  if (!rl.allowed) return rateLimitResponse(rl.retryAfter)

  try {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
    }

    const reply = await getChatbotReply({
      message: parsed.data.message,
      history: parsed.data.history,
    })

    return NextResponse.json({ success: true, reply })
  } catch {
    return NextResponse.json(
      {
        success: true,
        reply:
          'I can help with women\'s safety in India — helplines, legal rights, scenarios, and risk-reduction steps.',
      },
      { status: 200 }
    )
  }
}

