import SCENARIOS from '@/lib/scenarios'

type RolePlayInput = {
  scenarioId: string
  userMessage: string
  history: Array<{ speaker: 'USER' | 'NPC'; content: string }>
  currentRisk: number
  currentConfidence: number
  currentEq: number
}

export type RolePlayOutput = {
  reply: string
  riskDelta: number
  confidenceDelta: number
  eqDelta: number
  shouldEnd: boolean
  outcome: 'safe' | 'partial' | 'learning'
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function parseJson(raw: string): RolePlayOutput | null {
  const clean = raw.replace(/```json|```/g, '').trim()
  try {
    const parsed = JSON.parse(clean)
    return {
      reply: String(parsed.reply ?? '').trim(),
      riskDelta: clamp(Number(parsed.riskDelta) || 0, -12, 12),
      confidenceDelta: clamp(Number(parsed.confidenceDelta) || 0, -8, 8),
      eqDelta: clamp(Number(parsed.eqDelta) || 0, -8, 8),
      shouldEnd: Boolean(parsed.shouldEnd),
      outcome: parsed.outcome === 'safe' || parsed.outcome === 'learning' ? parsed.outcome : 'partial',
    }
  } catch {
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      const parsed = JSON.parse(match[0])
      return {
        reply: String(parsed.reply ?? '').trim(),
        riskDelta: clamp(Number(parsed.riskDelta) || 0, -12, 12),
        confidenceDelta: clamp(Number(parsed.confidenceDelta) || 0, -8, 8),
        eqDelta: clamp(Number(parsed.eqDelta) || 0, -8, 8),
        shouldEnd: Boolean(parsed.shouldEnd),
        outcome: parsed.outcome === 'safe' || parsed.outcome === 'learning' ? parsed.outcome : 'partial',
      }
    } catch {
      return null
    }
  }
}

function fallbackOutput(input: RolePlayInput): RolePlayOutput {
  const lower = input.userMessage.toLowerCase()
  const safeSignal =
    lower.includes('stop') ||
    lower.includes('no') ||
    lower.includes('leave') ||
    lower.includes('help') ||
    lower.includes('report')

  if (safeSignal) {
    return {
      reply:
        'I hear you clearly. I will maintain distance. You handled that assertively, and the situation de-escalated.',
      riskDelta: -6,
      confidenceDelta: 4,
      eqDelta: 3,
      shouldEnd: input.history.length >= 5,
      outcome: 'safe',
    }
  }

  return {
    reply:
      'I understand. Let us slow this down. What is your next boundary statement or safety step right now?',
    riskDelta: 1,
    confidenceDelta: 1,
    eqDelta: 1,
    shouldEnd: input.history.length >= 6,
    outcome: 'partial',
  }
}

function prompt(input: RolePlayInput) {
  const scenario = SCENARIOS[input.scenarioId]
  const scenarioTitle = scenario?.title ?? input.scenarioId
  const context = scenario?.context ?? 'Role-play safety practice.'
  const transcript = input.history
    .slice(-8)
    .map((m) => `${m.speaker}: ${m.content}`)
    .join('\n')

  return `You are a role-play NPC in SafePath, a trauma-informed women's safety training app.
Your objective:
- Respond in-character with realistic but safe conversational behavior.
- Keep each reply 1-3 sentences.
- Support boundary-setting and de-escalation learning.
- Do not include slurs, explicit abuse, or sexual content.

Scenario:
- Title: ${scenarioTitle}
- Context: ${context}
- Current metrics: risk=${input.currentRisk}, confidence=${input.currentConfidence}, eq=${input.currentEq}

Recent transcript:
${transcript || '(empty)'}

Latest user message:
${input.userMessage}

Return STRICT JSON only:
{"reply":"...","riskDelta":0,"confidenceDelta":0,"eqDelta":0,"shouldEnd":false,"outcome":"partial"}

Rules:
- riskDelta between -12 and +12
- confidenceDelta between -8 and +8
- eqDelta between -8 and +8
- outcome one of "safe" | "partial" | "learning"
- set shouldEnd=true when natural role-play closure is reached (typically after 5-8 turns).`
}

async function fromAnthropic(input: RolePlayInput): Promise<RolePlayOutput | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 400,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt(input) }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const text = data?.content?.[0]?.text
  if (!text) return null
  return parseJson(text)
}

async function fromGroq(input: RolePlayInput): Promise<RolePlayOutput | null> {
  if (!process.env.GROQ_API_KEY) return null
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt(input) }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) return null
  return parseJson(text)
}

export async function generateRolePlayTurn(input: RolePlayInput): Promise<RolePlayOutput> {
  const provider = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase().trim()
  try {
    if (provider === 'groq') {
      return (await fromGroq(input)) ?? fallbackOutput(input)
    }
    return (await fromAnthropic(input)) ?? (await fromGroq(input)) ?? fallbackOutput(input)
  } catch {
    return fallbackOutput(input)
  }
}
