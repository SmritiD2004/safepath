const FALLBACKS: Record<string, { feedback: string; hint: string }> = {
  default: {
    feedback:
      "Your instincts are developing well. In real situations, trust your body's signals. The choice you made reflects a common response pattern. Let's explore what options were available.",
    hint:
      'Consider what resources or people were immediately available in this scenario. Bystander support and assertive boundary setting are often underused tools.',
  },
  safe: {
    feedback:
      'Excellent situational awareness. You prioritized safety and created distance, which is one of the most effective strategies. This is a high confidence decision.',
    hint: 'Practice identifying safe exits in new environments before you need them.',
  },
  confront: {
    feedback:
      'Direct confrontation can work, but it carries risk. Public, firm, and clear language can be effective. Context matters because isolation changes what is safest.',
    hint: "Try a firm, calm voice with clear boundaries: 'I want you to stop.'",
  },
  ignore: {
    feedback:
      'Ignoring can be a valid coping response, but it rarely stops behavior. It may leave the burden on you. There are options that increase safety without direct confrontation.',
    hint: 'Involve a third party like a conductor, security staff, or colleague when possible.',
  },
}

type CoachRequest = {
  scenarioId: string
  nodeId: string
  choiceText: string
  playerHistory?: string[]
  riskLevel?: number
  systemPromptOverride?: string
}

type CoachResponse = {
  feedback: string
  hint: string
  riskDelta: number
  eqDelta: number
  coachMood: 'encouraging' | 'concerned' | 'proud' | 'neutral'
  nextScenarioSuggestion: string | null
}

function getFallback(choiceText: string): CoachResponse {
  const lower = choiceText.toLowerCase()
  const base =
    lower.includes('leave') || lower.includes('exit') || lower.includes('move') || lower.includes('shift')
      ? FALLBACKS.safe
      : lower.includes('confront') || lower.includes('tell') || lower.includes('say') || lower.includes('speak')
        ? FALLBACKS.confront
        : lower.includes('ignore') || lower.includes('continue') || lower.includes('stay')
          ? FALLBACKS.ignore
          : FALLBACKS.default

  return {
    feedback: base.feedback,
    hint: base.hint,
    riskDelta: Math.floor(Math.random() * 20) - 10,
    eqDelta: Math.floor(Math.random() * 8) + 2,
    coachMood: 'encouraging',
    nextScenarioSuggestion: null,
  }
}

function systemPrompt(input: CoachRequest): string {
  return `You are the SafePath AI Safety Coach, a warm trauma-informed personal safety trainer for women.

Your role:
- Provide constructive, empowering feedback on safety decisions
- Never blame, shame, or judge the user
- Acknowledge emotional reality while building practical skills
- Reference real safety frameworks like situational awareness and de-escalation
- Keep response concise because user is in a live scenario

Context:
- Scenario: ${input.scenarioId}
- Node: ${input.nodeId}
- Choice made: "${input.choiceText}"
- Risk level: ${input.riskLevel ?? 50}/100
- Choices made this session: ${input.playerHistory?.length ?? 0}

Respond with ONLY a valid JSON object, exactly:
{"feedback":"string","hint":"string","riskDelta":0,"eqDelta":5,"coachMood":"encouraging","nextScenarioSuggestion":null}

Rules:
- riskDelta integer -20 to +20 (negative means safer choice)
- eqDelta integer 0 to 15
- coachMood one of "encouraging" | "concerned" | "proud" | "neutral"
- nextScenarioSuggestion null or short scenario type name`
}

function parseCoachJson(raw: string): CoachResponse | null {
  const clean = raw.replace(/```json|```/g, '').trim()
  const direct = (() => {
    try {
      return JSON.parse(clean)
    } catch {
      return null
    }
  })()
  const parsed = direct ?? (() => {
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  })()

  if (!parsed || typeof parsed !== 'object') return null

  return {
    feedback: String(parsed.feedback ?? FALLBACKS.default.feedback),
    hint: String(parsed.hint ?? FALLBACKS.default.hint),
    riskDelta: Number(parsed.riskDelta) || 0,
    eqDelta: Number(parsed.eqDelta) || 5,
    coachMood: (parsed.coachMood as CoachResponse['coachMood']) ?? 'encouraging',
    nextScenarioSuggestion: parsed.nextScenarioSuggestion ? String(parsed.nextScenarioSuggestion) : null,
  }
}

async function fromAnthropic(input: CoachRequest): Promise<CoachResponse | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const system = input.systemPromptOverride ?? systemPrompt(input)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 500,
      temperature: 0.3,
      system,
      messages: [{ role: 'user', content: 'Return the JSON coach response.' }],
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const text = data?.content?.[0]?.text
  if (!text) return null
  return parseCoachJson(text)
}

async function fromGroq(input: CoachRequest): Promise<CoachResponse | null> {
  if (!process.env.GROQ_API_KEY) return null

  const system = input.systemPromptOverride ?? systemPrompt(input)
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: 'Return the JSON coach response.' },
      ],
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) return null
  return parseCoachJson(text)
}

export async function getCoachFeedback(input: CoachRequest): Promise<CoachResponse> {
  const provider = (process.env.AI_PROVIDER ?? process.env.NEXT_PUBLIC_AI_PROVIDER ?? 'anthropic')
    .toLowerCase()
    .trim()

  try {
    if (provider === 'groq') {
      return (await fromGroq(input)) ?? getFallback(input.choiceText)
    }

    return (await fromAnthropic(input)) ?? (await fromGroq(input)) ?? getFallback(input.choiceText)
  } catch {
    return getFallback(input.choiceText)
  }
}
