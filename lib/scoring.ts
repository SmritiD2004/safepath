import type { Choice } from '@/lib/scenarios'

type ScoreState = {
  risk: number
  confidence: number
  eq: number
}

function clamp100(value: number) {
  return Math.max(0, Math.min(100, value))
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function applyChoiceScoring(state: ScoreState, choice: Choice): ScoreState {
  const nextRisk = clamp100(state.risk + choice.riskImpact)

  // EQ grows/shrinks with damping and a per-choice cap to avoid unrealistic jumps.
  const eqDelta = clamp(Math.round(choice.eqImpact * 0.7), -6, 8)
  const nextEq = clamp100(state.eq + eqDelta)

  // Confidence reacts to both emotional regulation and safety quality.
  // Safe + emotionally strong choices increase confidence; risky choices can reduce it.
  // We keep changes moderate so 1-2 answers don't swing the meter too hard.
  const rawConfidenceDelta = Math.round(choice.eqImpact * 0.35 + (-choice.riskImpact) * 0.25)
  const confidenceDelta = clamp(rawConfidenceDelta, -8, 8)
  const nextConfidence = clamp100(state.confidence + confidenceDelta)

  return {
    risk: nextRisk,
    confidence: nextConfidence,
    eq: nextEq,
  }
}

export function smoothedAverage(sum: number, count: number, baseline: number, weight = 3): number {
  if (count <= 0) return baseline
  return Math.round((sum + baseline * weight) / (count + weight))
}
