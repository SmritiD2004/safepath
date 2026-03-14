import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import SCENARIOS_MAP from '@/lib/scenarios'
import { smoothedAverage } from '@/lib/scoring'
import { ENTERPRISE_PACKAGES } from '@/lib/enterprise/packages'

type TrendPoint = {
  date: string
  label: string
  runs: number
  avgConfidence: number
  avgEq: number
}

type Achievement = {
  id: string
  title: string
  description: string
  unlocked: boolean
}

type PerformanceInsight = {
  name: string
  runs: number
  avgConfidence: number
  avgEq: number
  avgRisk: number
  score: number
}

type RecentRun = {
  scenarioId: string
  scenarioTitle: string
  category: string
  mode: string
  completedAt: string
  confidence: number
  eq: number
  risk: number
  outcome: string
}

type ScenarioHeatmapCell = {
  scenarioId: string
  scenarioTitle: string
  category: string
  mode: string
  runs: number
  avgConfidence: number
  avgEq: number
  avgRisk: number
  score: number
}

type ImprovementGoal = {
  id: string
  title: string
  target: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

function formatLabelFromIsoDate(isoDate: string): string {
  return isoDate.slice(5)
}

function buildDayTrend(days: number, completedRuns: Array<{
  completedAt: Date | null
  finalConfidence: number | null
  finalEq: number | null
}>): TrendPoint[] {
  const dateKeys: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    dateKeys.push(day.toISOString().slice(0, 10))
  }

  const byDate = new Map<string, { runs: number; conf: number; eq: number }>()
  for (const key of dateKeys) {
    byDate.set(key, { runs: 0, conf: 0, eq: 0 })
  }
  for (const run of completedRuns) {
    if (!run.completedAt) continue
    const key = run.completedAt.toISOString().slice(0, 10)
    const bucket = byDate.get(key)
    if (!bucket) continue
    bucket.runs += 1
    bucket.conf += run.finalConfidence ?? 0
    bucket.eq += run.finalEq ?? 0
  }
  return dateKeys.map((date) => {
    const bucket = byDate.get(date) ?? { runs: 0, conf: 0, eq: 0 }
    return {
      date,
      label: formatLabelFromIsoDate(date),
      runs: bucket.runs,
      avgConfidence: bucket.runs ? Math.round(bucket.conf / bucket.runs) : 0,
      avgEq: bucket.runs ? Math.round(bucket.eq / bucket.runs) : 0,
    }
  })
}

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({
        completedScenarioIds: [],
        done: 0,
        avgConfidence: 0,
        avgEq: 0,
        currentStreakDays: 0,
        bestStreakDays: 0,
        totalCompletedRuns: 0,
        achievements: [] as Achievement[],
        unlockedAchievements: 0,
        certificateUnlocked: false,
        certificateProgress: 0,
        practicedTipIds: [] as string[],
        avgRisk: 0,
        confidenceEqDelta: 0,
        readinessLevel: 'starting',
        modeInsights: [] as PerformanceInsight[],
        categoryInsights: [] as PerformanceInsight[],
        recentRuns: [] as RecentRun[],
        scenarioHeatmap: [] as ScenarioHeatmapCell[],
        improvementGoals: [] as ImprovementGoal[],
        trendLast7Days: [] as TrendPoint[],
        trendLast30Days: [] as TrendPoint[],
        weakestTags: [] as string[],
        strongestTags: [] as string[],
        avgDecisionSeconds: 0,
        recommendedScenarioIds: [] as string[],
        orgScenarioIds: [] as string[],
        userIndustry: null,
      })
    }

    const normalizeIndustry = (industry: string | null | undefined) => {
      if (!industry) return null
      return industry === 'CUSTOM' ? null : industry
    }

    // Attempt to fetch the user's primary organization industry and packages
    let userIndustry: string | null = null
    let orgScenarioIds: string[] = []
    try {
      const membership = await db.orgMember.findFirst({
        where: { userId },
        include: { org: true },
        orderBy: { joinedAt: 'asc' }, // Get the first org they joined as primary
      })
      if (membership?.org?.id) {
        const packages = await db.orgScenarioPackage.findMany({
          where: { orgId: membership.org.id },
          select: { packageId: true },
        })
        if (packages.length > 0) {
          const ids = new Set<string>()
          for (const pkg of packages) {
            const bundle = ENTERPRISE_PACKAGES[pkg.packageId]
            if (!bundle) continue
            for (const scenarioId of bundle.scenarioIds) ids.add(scenarioId)
          }
          orgScenarioIds = Array.from(ids)
        } else if (membership?.org?.industry) {
          userIndustry = normalizeIndustry(membership.org.industry)
        }
      }
    } catch {
      // Ignore errors if org membership fails or doesn't exist
    }

    if (!userIndustry) {
      try {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { industry: true },
        })
        if (user?.industry) {
          userIndustry = normalizeIndustry(user.industry)
        }
      } catch {
        // Ignore if fetching user fails
      }
    }

    const completedRuns = await db.scenarioRun.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        scenarioId: true,
        finalConfidence: true,
        finalEq: true,
        finalRisk: true,
        startedAt: true,
        completedAt: true,
        outcome: true,
        _count: {
          select: { choiceEvents: true },
        },
      },
    })

    const uniqueScenarioIds = Array.from(new Set(completedRuns.map((r) => r.scenarioId)))
    const sumConfidence = completedRuns.reduce((sum, r) => sum + (r.finalConfidence ?? 0), 0)
    const sumEq = completedRuns.reduce((sum, r) => sum + (r.finalEq ?? 0), 0)
    const sumRisk = completedRuns.reduce((sum, r) => sum + (r.finalRisk ?? 50), 0)
    const avgConfidence = completedRuns.length ? smoothedAverage(sumConfidence, completedRuns.length, 50, 4) : 0
    const avgEq = completedRuns.length ? smoothedAverage(sumEq, completedRuns.length, 50, 4) : 0
    const totalCompletedRuns = completedRuns.length
    const avgRisk = completedRuns.length ? smoothedAverage(sumRisk, completedRuns.length, 50, 4) : 0
    const confidenceEqDelta = avgConfidence - avgEq

    const trendLast7Days = buildDayTrend(7, completedRuns)
    const trendLast30Days = buildDayTrend(30, completedRuns)

    const completedDayKeysDesc = Array.from(
      new Set(
        completedRuns
          .map((r) => r.completedAt?.toISOString().slice(0, 10))
          .filter((d): d is string => Boolean(d))
      )
    ).sort((a, b) => (a < b ? 1 : -1))

    let currentStreakDays = 0
    if (completedDayKeysDesc.length > 0) {
      const todayKey = new Date().toISOString().slice(0, 10)
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterdayKey = yesterdayDate.toISOString().slice(0, 10)
      const firstDay = completedDayKeysDesc[0]

      if (firstDay === todayKey || firstDay === yesterdayKey) {
        currentStreakDays = 1
        for (let i = 1; i < completedDayKeysDesc.length; i += 1) {
          const prevDate = new Date(`${completedDayKeysDesc[i - 1]}T00:00:00Z`)
          const curDate = new Date(`${completedDayKeysDesc[i]}T00:00:00Z`)
          const diffDays = Math.round((prevDate.getTime() - curDate.getTime()) / (24 * 60 * 60 * 1000))
          if (diffDays === 1) currentStreakDays += 1
          else break
        }
      }
    }

    let bestStreakDays = 0
    let activeBest = 0
    for (let i = 0; i < completedDayKeysDesc.length; i += 1) {
      if (i === 0) {
        activeBest = 1
        bestStreakDays = Math.max(bestStreakDays, activeBest)
        continue
      }
      const prevDate = new Date(`${completedDayKeysDesc[i - 1]}T00:00:00Z`)
      const curDate = new Date(`${completedDayKeysDesc[i]}T00:00:00Z`)
      const diffDays = Math.round((prevDate.getTime() - curDate.getTime()) / (24 * 60 * 60 * 1000))
      if (diffDays === 1) activeBest += 1
      else activeBest = 1
      bestStreakDays = Math.max(bestStreakDays, activeBest)
    }

    const tagStats = new Map<string, { total: number; count: number }>()
    for (const run of completedRuns) {
      const scenario = SCENARIOS_MAP[run.scenarioId]
      if (!scenario) continue
      const score = Math.round(((run.finalConfidence ?? 0) + (run.finalEq ?? 0)) / 2)
      for (const tag of scenario.tags) {
        const curr = tagStats.get(tag) ?? { total: 0, count: 0 }
        curr.total += score
        curr.count += 1
        tagStats.set(tag, curr)
      }
    }

    const weakestTags = Array.from(tagStats.entries())
      .filter(([, val]) => val.count > 0)
      .sort((a, b) => a[1].total / a[1].count - b[1].total / b[1].count)
      .slice(0, 3)
      .map(([tag]) => tag)

    const strongestTags = Array.from(tagStats.entries())
      .filter(([, val]) => val.count > 0)
      .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)
      .slice(0, 3)
      .map(([tag]) => tag)

    let avgDecisionSeconds = 0
    let decisionSamples = 0
    for (const run of completedRuns) {
      if (!run.completedAt || !run.startedAt) continue
      const choices = run._count?.choiceEvents ?? 0
      if (choices <= 0) continue
      const perChoiceMs = (run.completedAt.getTime() - run.startedAt.getTime()) / choices
      if (!Number.isFinite(perChoiceMs)) continue
      avgDecisionSeconds += perChoiceMs
      decisionSamples += 1
    }
    if (decisionSamples > 0) {
      avgDecisionSeconds = Math.round((avgDecisionSeconds / decisionSamples) / 1000)
    }

    const completedSet = new Set(uniqueScenarioIds)
    const recommendedScenarioIds = Object.values(SCENARIOS_MAP)
      .filter((s) => !completedSet.has(s.id))
      .map((s, index) => {
        let score = 0
        if (weakestTags[0] && s.tags.includes(weakestTags[0])) score += 60
        if (weakestTags[1] && s.tags.includes(weakestTags[1])) score += 35
        if (weakestTags[2] && s.tags.includes(weakestTags[2])) score += 20
        score += Math.max(0, 18 - s.difficulty * 3)
        score += Math.max(0, 20 - s.estimatedMinutes)
        score += Math.max(0, 10 - index)
        return { id: s.id, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.id)

    const achievements: Achievement[] = [
      {
        id: 'first-steps',
        title: 'First Steps',
        description: 'Complete your first scenario run.',
        unlocked: totalCompletedRuns >= 1,
      },
      {
        id: 'explorer',
        title: 'Scenario Explorer',
        description: 'Complete 5 unique scenarios.',
        unlocked: uniqueScenarioIds.length >= 5,
      },
      {
        id: 'consistent-learner',
        title: 'Consistent Learner',
        description: 'Maintain a 3-day completion streak.',
        unlocked: bestStreakDays >= 3,
      },
      {
        id: 'confidence-builder',
        title: 'Confidence Builder',
        description: 'Reach 75% average confidence.',
        unlocked: avgConfidence >= 75,
      },
      {
        id: 'eq-guardian',
        title: 'EQ Guardian',
        description: 'Reach 75% average EQ score.',
        unlocked: avgEq >= 75,
      },
      {
        id: 'core-ready',
        title: 'Core Ready',
        description: 'Complete 10 unique scenarios.',
        unlocked: uniqueScenarioIds.length >= 10,
      },
    ]
    const unlockedAchievements = achievements.filter((a) => a.unlocked).length
    const certificateUnlocked =
      uniqueScenarioIds.length >= 10 && avgConfidence >= 70 && avgEq >= 70 && unlockedAchievements >= 5
    const certificateProgress = Math.round((unlockedAchievements / achievements.length) * 100)
    let practicedTipIds: string[] = []
    try {
      const tipRows = await db.userTipPractice.findMany({
        where: { userId, practiced: true },
        select: { tipId: true },
      })
      practicedTipIds = tipRows.map((r) => r.tipId)
    } catch {
      practicedTipIds = []
    }

    const modeStats = new Map<string, { runs: number; conf: number; eq: number; risk: number }>()
    const categoryStats = new Map<string, { runs: number; conf: number; eq: number; risk: number }>()
    for (const run of completedRuns) {
      const scenario = SCENARIOS_MAP[run.scenarioId]
      if (!scenario) continue

      const add = (map: Map<string, { runs: number; conf: number; eq: number; risk: number }>, key: string) => {
        const curr = map.get(key) ?? { runs: 0, conf: 0, eq: 0, risk: 0 }
        curr.runs += 1
        curr.conf += run.finalConfidence ?? 0
        curr.eq += run.finalEq ?? 0
        curr.risk += run.finalRisk ?? 50
        map.set(key, curr)
      }

      add(modeStats, scenario.mode)
      add(categoryStats, scenario.category)
    }

    const normalizeInsights = (map: Map<string, { runs: number; conf: number; eq: number; risk: number }>) =>
      Array.from(map.entries())
        .map(([name, val]) => {
          const avgConf = Math.round(val.conf / val.runs)
          const avgEqVal = Math.round(val.eq / val.runs)
          const avgRiskVal = Math.round(val.risk / val.runs)
          const score = Math.round((avgConf + avgEqVal + (100 - avgRiskVal)) / 3)
          return {
            name,
            runs: val.runs,
            avgConfidence: avgConf,
            avgEq: avgEqVal,
            avgRisk: avgRiskVal,
            score,
          }
        })
        .sort((a, b) => b.score - a.score)

    const modeInsights = normalizeInsights(modeStats)
    const categoryInsights = normalizeInsights(categoryStats)

    const recentRuns: RecentRun[] = completedRuns.slice(0, 5).map((run) => {
      const scenario = SCENARIOS_MAP[run.scenarioId]
      return {
        scenarioId: run.scenarioId,
        scenarioTitle: scenario?.title ?? run.scenarioId,
        category: scenario?.category ?? 'Unknown',
        mode: scenario?.mode ?? 'Unknown',
        completedAt: run.completedAt?.toISOString() ?? new Date().toISOString(),
        confidence: run.finalConfidence ?? 0,
        eq: run.finalEq ?? 0,
        risk: run.finalRisk ?? 50,
        outcome: run.outcome ?? 'partial',
      }
    })

    const readinessLevel =
      avgConfidence >= 80 && avgEq >= 80 && avgRisk <= 30
        ? 'advanced'
        : avgConfidence >= 65 && avgEq >= 65 && avgRisk <= 45
          ? 'developing'
          : 'starting'

    const scenarioStats = new Map<string, { runs: number; conf: number; eq: number; risk: number }>()
    for (const run of completedRuns) {
      const curr = scenarioStats.get(run.scenarioId) ?? { runs: 0, conf: 0, eq: 0, risk: 0 }
      curr.runs += 1
      curr.conf += run.finalConfidence ?? 0
      curr.eq += run.finalEq ?? 0
      curr.risk += run.finalRisk ?? 50
      scenarioStats.set(run.scenarioId, curr)
    }
    const scenarioHeatmap: ScenarioHeatmapCell[] = Array.from(scenarioStats.entries())
      .map(([scenarioId, val]) => {
        const s = SCENARIOS_MAP[scenarioId]
        const avgConf = Math.round(val.conf / val.runs)
        const avgEqVal = Math.round(val.eq / val.runs)
        const avgRiskVal = Math.round(val.risk / val.runs)
        const score = Math.round((avgConf + avgEqVal + (100 - avgRiskVal)) / 3)
        return {
          scenarioId,
          scenarioTitle: s?.title ?? scenarioId,
          category: s?.category ?? 'Unknown',
          mode: s?.mode ?? 'Unknown',
          runs: val.runs,
          avgConfidence: avgConf,
          avgEq: avgEqVal,
          avgRisk: avgRiskVal,
          score,
        }
      })
      .sort((a, b) => b.score - a.score)

    const improvementGoals: ImprovementGoal[] = []
    if (avgRisk > 45) {
      improvementGoals.push({
        id: 'reduce-risk',
        title: 'Lower average risk by 10 points',
        target: `Move from ${avgRisk}% to ${Math.max(0, avgRisk - 10)}%`,
        reason: 'Recent runs show elevated risk outcomes.',
        priority: 'high',
      })
    }
    if (avgConfidence < 75) {
      improvementGoals.push({
        id: 'raise-confidence',
        title: 'Raise confidence score',
        target: `Reach 75% (currently ${avgConfidence}%)`,
        reason: 'Confidence is below strong readiness range.',
        priority: 'high',
      })
    }
    if (avgEq < 75) {
      improvementGoals.push({
        id: 'raise-eq',
        title: 'Raise EQ score',
        target: `Reach 75% (currently ${avgEq}%)`,
        reason: 'EQ skill depth can be strengthened further.',
        priority: 'medium',
      })
    }
    if (bestStreakDays < 4) {
      improvementGoals.push({
        id: 'streak',
        title: 'Build consistency streak',
        target: 'Reach a 4-day streak',
        reason: 'Regular practice improves retention and response speed.',
        priority: 'medium',
      })
    }
    if (weakestTags[0]) {
      improvementGoals.push({
        id: 'focus-tag',
        title: `Focus on "${weakestTags[0]}" scenarios`,
        target: 'Complete 3 runs in this focus area',
        reason: 'This tag currently has your lowest performance.',
        priority: 'low',
      })
    }

    return NextResponse.json({
      completedScenarioIds: uniqueScenarioIds,
      done: uniqueScenarioIds.length,
      avgConfidence,
      avgEq,
      avgRisk,
      confidenceEqDelta,
      currentStreakDays,
      bestStreakDays,
      totalCompletedRuns,
      readinessLevel,
      achievements,
      unlockedAchievements,
      certificateUnlocked,
      certificateProgress,
      practicedTipIds,
      modeInsights,
      categoryInsights,
      recentRuns,
      scenarioHeatmap,
      userIndustry,
      improvementGoals,
      trendLast7Days,
      trendLast30Days,
      weakestTags,
      recommendedScenarioIds,
      strongestTags,
      avgDecisionSeconds,
      orgScenarioIds,
    })
  } catch {
    return NextResponse.json(
      {
        completedScenarioIds: [],
        done: 0,
        avgConfidence: 0,
        avgEq: 0,
        currentStreakDays: 0,
        bestStreakDays: 0,
        totalCompletedRuns: 0,
        achievements: [] as Achievement[],
        unlockedAchievements: 0,
        certificateUnlocked: false,
        certificateProgress: 0,
        practicedTipIds: [] as string[],
        avgRisk: 0,
        confidenceEqDelta: 0,
        readinessLevel: 'starting',
        modeInsights: [] as PerformanceInsight[],
        categoryInsights: [] as PerformanceInsight[],
        recentRuns: [] as RecentRun[],
        scenarioHeatmap: [] as ScenarioHeatmapCell[],
        userIndustry: null,
        improvementGoals: [] as ImprovementGoal[],
        trendLast7Days: [] as TrendPoint[],
        trendLast30Days: [] as TrendPoint[],
        weakestTags: [] as string[],
        strongestTags: [] as string[],
        avgDecisionSeconds: 0,
        recommendedScenarioIds: [] as string[],
        orgScenarioIds: [] as string[],
      },
      { status: 200 }
    )
  }
}
