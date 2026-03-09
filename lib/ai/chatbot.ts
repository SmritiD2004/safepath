type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const SAFEPATH_TOPICS = [
  'safepath',
  'safety',
  'safe',
  'risk',
  'boundary',
  'boundaries',
  'consent',
  'harassment',
  'abuse',
  'stalking',
  'threat',
  'self defense',
  'self-defence',
  'coach',
  'scenario',
  'roleplay',
  'role-play',
  'assessment',
  'dashboard',
  'certificate',
  'panic',
  'emergency',
  'help',
  'report',
  'unsafe',
  'red flag',
]

const ALLOWED_SMALLTALK = ['hi', 'hello', 'hey', 'help', 'thanks', 'thank you']

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function isRelevantToSafePath(message: string): boolean {
  const text = normalize(message)
  if (!text) return false

  if (ALLOWED_SMALLTALK.some((term) => text === term || text.startsWith(`${term} `))) {
    return true
  }

  return SAFEPATH_TOPICS.some((topic) => text.includes(topic))
}

function buildSystemPrompt(): string {
  return `You are SafePath Assistant for the SafePath platform.

Scope:
- Only answer questions related to personal safety learning, SafePath features, scenarios, role-play, assessments, and account usage.
- If the user asks unrelated topics (coding help, entertainment, politics, shopping, random trivia), refuse briefly and guide back to SafePath topics.

Style:
- concise, practical, trauma-informed, non-judgmental
- no moralizing, no victim-blaming
- when useful, provide short, actionable steps
- if urgent danger is implied, advise contacting local emergency services immediately

Output:
- plain text only, maximum 120 words`
}

function fallbackAnswer(message: string): string {
  if (!isRelevantToSafePath(message)) {
    return 'I can only help with SafePath and personal safety guidance. Ask me about scenarios, role-play practice, risk reduction, boundaries, or using features in this app.'
  }

  return 'I can help with SafePath scenarios, role-play practice, boundary-setting language, and risk-reduction steps. Tell me your situation, and I will suggest practical next actions.'
}

async function fromAnthropic(history: ChatMessage[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const messages = history.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 250,
      temperature: 0.2,
      system: buildSystemPrompt(),
      messages,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const text = data?.content?.[0]?.text
  if (!text || typeof text !== 'string') return null
  return text.trim()
}

async function fromGroq(history: ChatMessage[]): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 250,
      temperature: 0.2,
      messages,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text || typeof text !== 'string') return null
  return text.trim()
}

export async function getChatbotReply(input: {
  message: string
  history?: ChatMessage[]
}): Promise<string> {
  const message = String(input.message ?? '').trim()
  const history = Array.isArray(input.history) ? input.history : []
  if (!message) return 'Please ask a question about SafePath or personal safety practice.'

  if (!isRelevantToSafePath(message)) {
    return fallbackAnswer(message)
  }

  const normalizedHistory = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-6)

  const provider = (process.env.AI_PROVIDER ?? process.env.NEXT_PUBLIC_AI_PROVIDER ?? 'anthropic')
    .toLowerCase()
    .trim()

  try {
    if (provider === 'groq') {
      return (await fromGroq([...normalizedHistory, { role: 'user', content: message }])) ?? fallbackAnswer(message)
    }

    return (
      (await fromAnthropic([...normalizedHistory, { role: 'user', content: message }])) ??
      (await fromGroq([...normalizedHistory, { role: 'user', content: message }])) ??
      fallbackAnswer(message)
    )
  } catch {
    return fallbackAnswer(message)
  }
}

