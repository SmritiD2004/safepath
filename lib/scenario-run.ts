import SCENARIOS, { type Scenario } from '@/lib/scenarios'
import { applyChoiceScoring } from '@/lib/scoring'

type ExistingEvent = {
  nodeId: string
  choiceId: string
}

type RunInit = {
  scenarioId: string
  initialRisk: number
  initialConfidence: number
  initialEq: number
}

export type DerivedRunState = {
  scenario: Scenario
  currentNodeId: string
  riskLevel: number
  confidence: number
  eqScore: number
  isEnd: boolean
  endType: 'safe' | 'partial' | 'learning' | null
  error?: string
}

export function deriveRunState(run: RunInit, events: ExistingEvent[]): DerivedRunState {
  const scenario = SCENARIOS[run.scenarioId]
  if (!scenario) {
    return {
      scenario: undefined as unknown as Scenario,
      currentNodeId: '',
      riskLevel: run.initialRisk,
      confidence: run.initialConfidence,
      eqScore: run.initialEq,
      isEnd: false,
      endType: null,
      error: `Scenario "${run.scenarioId}" not found.`,
    }
  }

  let currentNodeId = scenario.startNodeId
  let riskLevel = run.initialRisk
  let confidence = run.initialConfidence
  let eqScore = run.initialEq

  for (const event of events) {
    if (event.nodeId !== currentNodeId) {
      return {
        scenario,
        currentNodeId,
        riskLevel,
        confidence,
        eqScore,
        isEnd: Boolean(scenario.nodes[currentNodeId]?.isEnd),
        endType: scenario.nodes[currentNodeId]?.endType ?? null,
        error: `Event chain mismatch at node "${event.nodeId}". Expected "${currentNodeId}".`,
      }
    }

    const node = scenario.nodes[currentNodeId]
    const choice = node?.choices.find((c) => c.id === event.choiceId)
    if (!choice) {
      return {
        scenario,
        currentNodeId,
        riskLevel,
        confidence,
        eqScore,
        isEnd: Boolean(node?.isEnd),
        endType: node?.endType ?? null,
        error: `Invalid choice "${event.choiceId}" at node "${currentNodeId}".`,
      }
    }

    const next = applyChoiceScoring(
      { risk: riskLevel, confidence, eq: eqScore },
      choice
    )
    riskLevel = next.risk
    confidence = next.confidence
    eqScore = next.eq

    if (!choice.nextNodeId || !scenario.nodes[choice.nextNodeId]) {
      return {
        scenario,
        currentNodeId,
        riskLevel,
        confidence,
        eqScore,
        isEnd: true,
        endType: node?.endType ?? null,
        error: `Choice "${choice.id}" has invalid next node "${choice.nextNodeId}".`,
      }
    }

    currentNodeId = choice.nextNodeId
  }

  const currentNode = scenario.nodes[currentNodeId]
  return {
    scenario,
    currentNodeId,
    riskLevel,
    confidence,
    eqScore,
    isEnd: Boolean(currentNode?.isEnd),
    endType: currentNode?.endType ?? null,
  }
}
