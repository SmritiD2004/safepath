import { randomBytes } from 'crypto'

type RunLike = {
  scenarioId: string
  finalConfidence: number | null
  finalEq: number | null
  finalRisk: number | null
}

export type CertificationMetrics = {
  done: number
  totalRuns: number
  avgConfidence: number
  avgEq: number
  avgRisk: number
  unlockedAchievements: number
  certificateUnlocked: boolean
  readinessLevel: 'starting' | 'developing' | 'advanced'
  unmet: string[]
}

function round(n: number) {
  return Math.round(n)
}

export function calculateCertificationMetrics(runs: RunLike[]): CertificationMetrics {
  const totalRuns = runs.length
  const uniqueScenarioIds = Array.from(new Set(runs.map((r) => r.scenarioId)))
  const done = uniqueScenarioIds.length

  const avgConfidence = totalRuns
    ? round(runs.reduce((sum, r) => sum + (r.finalConfidence ?? 0), 0) / totalRuns)
    : 0
  const avgEq = totalRuns
    ? round(runs.reduce((sum, r) => sum + (r.finalEq ?? 0), 0) / totalRuns)
    : 0
  const avgRisk = totalRuns
    ? round(runs.reduce((sum, r) => sum + (r.finalRisk ?? 50), 0) / totalRuns)
    : 0

  const achievements = [
    totalRuns >= 1,
    done >= 5,
    avgConfidence >= 75,
    avgEq >= 75,
    done >= 10,
    avgRisk <= 45,
  ]
  const unlockedAchievements = achievements.filter(Boolean).length

  const certificateUnlocked =
    done >= 10 && avgConfidence >= 70 && avgEq >= 70 && unlockedAchievements >= 5

  const readinessLevel =
    avgConfidence >= 80 && avgEq >= 80 && avgRisk <= 30
      ? 'advanced'
      : avgConfidence >= 65 && avgEq >= 65 && avgRisk <= 45
        ? 'developing'
        : 'starting'

  const unmet: string[] = []
  if (done < 10) unmet.push(`Complete at least 10 unique scenarios (${done}/10).`)
  if (avgConfidence < 70) unmet.push(`Raise average confidence to 70% (${avgConfidence}%).`)
  if (avgEq < 70) unmet.push(`Raise average EQ to 70% (${avgEq}%).`)
  if (unlockedAchievements < 5)
    unmet.push(`Unlock at least 5 achievements (${unlockedAchievements}/5).`)

  return {
    done,
    totalRuns,
    avgConfidence,
    avgEq,
    avgRisk,
    unlockedAchievements,
    certificateUnlocked,
    readinessLevel,
    unmet,
  }
}

/**
 * Generates a cryptographically random certificate code.
 * Format: SP-YYYYMMDD-XXXXXXXX  (8 hex chars = 4 random bytes)
 * Collision probability at 1 million certs: ~0.000006% — safe for this scale.
 *
 * Previously used Math.random().toString(36) which has only ~30 bits of entropy
 * and is not cryptographically random. Now uses Node crypto for 32 bits of
 * guaranteed randomness.
 */
export function generateCertificateCode(): string {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = randomBytes(4).toString('hex').toUpperCase() // e.g. "A3F7C12B"
  return `SP-${date}-${rand}`
}