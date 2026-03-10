type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const SAFEPATH_TOPICS = [
  // core platform terms
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
  // India-specific safety topics
  'helpline',
  'iCall',
  'women helpline',
  'posh',
  'icc',
  'internal complaints',
  'nirbhaya',
  'dowry',
  'eve teasing',
  'molestation',
  'groping',
  'acid attack',
  'domestic violence',
  'cyber crime',
  'cyber stalking',
  'online harassment',
  'deepfake',
  'morphed',
  'blackmail',
  'legal right',
  'fir',
  'police complaint',
  'ngo',
  'shelter',
  'commute',
  'metro',
  'bus',
  'auto',
  'cab',
  'rickshaw',
  'public transport',
  'street',
  'college',
  'campus',
  'workplace',
  'office',
  'india',
  'indian',
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
  return `You are SafePath Assistant — an AI safety coach built exclusively for the SafePath platform, designed for women and girls in India.

Scope:
- ONLY answer questions related to women's safety in India, SafePath features, scenarios, role-play practice, assessments, and account usage.
- If asked about safety resources, laws, or helplines from another country (US, UK, Australia, etc.), redirect: "I focus on India-specific women's safety. In India you can reach [relevant Indian helpline]." Do not provide non-Indian resources.
- If asked anything completely unrelated to women's safety or SafePath (coding, recipes, sports, entertainment, politics, shopping, trivia), refuse briefly: "I can only help with women's safety topics and SafePath guidance." then suggest a relevant safety topic.

India-specific knowledge to draw on:
- Helplines: Emergency 112, Police 100, Women Helpline 1091, Cyber Crime 1930, iCall 9152987821, CHILDLINE 1098, One Stop Centre 181
- Laws: POSH Act (workplace harassment, ICC process), IPC Section 354 (molestation), Section 509 (verbal harassment), Section 498A (domestic violence), Section 66E (cyber privacy violation), IT Act Section 67 (obscene content)
- Contexts: Mumbai local trains, DTC buses, autos, metros, college campuses, IT offices, online spaces — use Indian city/transport contexts in scenarios
- Schemes: Nirbhaya Fund, One Stop Centres, Sakhi centres, Ujjawala scheme

Style:
- Concise, practical, trauma-informed, non-judgmental
- No moralizing, no victim-blaming, empowering tone
- Provide short actionable steps when useful
- If urgent danger is implied, immediately provide 112 and advise contacting local police

Output:
- Plain text only, maximum 120 words`
}

function fallbackAnswer(message: string): string {
  if (!isRelevantToSafePath(message)) {
    return 'I can only help with women\'s safety topics in India and SafePath guidance. Ask me about safety scenarios, Indian helplines, legal rights, role-play practice, or app features.'
  }

  return 'I can help with women\'s safety in India — scenarios, helplines (112, 1091), legal rights (POSH, IPC), role-play practice, and risk-reduction steps. Tell me your situation.'
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