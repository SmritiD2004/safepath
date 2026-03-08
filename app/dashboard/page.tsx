'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import SCENARIOS_MAP from '@/lib/scenarios'
import DecryptedText from '../components/DecryptedText'
import Avatar from '../components/Avatar'
import { modeToSlug } from '@/lib/mode'

const TIPS = [
  {
    id: 'scan-entry',
    icon: 'EYE',
    title: '30-Second Scan',
    category: 'Awareness',
    tip: 'When entering a new place, identify exits, lighting, and nearest support points in the first 30 seconds.',
    action: 'Practice this once today while entering any building.',
  },
  {
    id: 'boundary-voice',
    icon: 'VOICE',
    title: 'Boundary Script',
    category: 'Communication',
    tip: 'Use one direct boundary statement: "No, I am not comfortable with that." Avoid over-explaining.',
    action: 'Rehearse this line out loud three times.',
  },
  {
    id: 'safety-contacts',
    icon: 'PHONE',
    title: 'Fast Contact Setup',
    category: 'Preparedness',
    tip: 'Pin emergency contacts and keep location sharing shortcuts ready before travel.',
    action: 'Check your quick-dial and emergency sharing settings.',
  },
  {
    id: 'digital-hygiene',
    icon: 'LOCK',
    title: 'Digital Check',
    category: 'Online Safety',
    tip: 'Use unique passwords and 2FA for social, email, and finance apps. Avoid signing in on public Wi-Fi.',
    action: 'Enable 2FA on one account today.',
  },
]

type Tab = 'scenarios' | 'progress' | 'tips'
type ModeFilter = 'All' | 'Simulation' | 'Puzzle' | 'Role-Play' | 'Strategy' | 'Story'
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

type ScenarioCardItem = {
  id: string
  title: string
  category: string
  icon: string
  difficulty: number
  duration: string
  estimatedMinutes: number
  tags: string[]
  intensity: 'low' | 'medium' | 'high'
  desc: string
  color: string
  backgroundMood: string
  locked: boolean
  mode: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const [tab, setTab] = useState<Tab>('scenarios')
  const [completedScenarioIds, setCompletedScenarioIds] = useState<string[]>([])
  const [done, setDone] = useState(0)
  const [conf, setConf] = useState(0)
  const [eq, setEq] = useState(0)
  const [avgRisk, setAvgRisk] = useState(0)
  const [confidenceEqDelta, setConfidenceEqDelta] = useState(0)
  const [readinessLevel, setReadinessLevel] = useState<'starting' | 'developing' | 'advanced'>('starting')
  const [trendLast7Days, setTrendLast7Days] = useState<TrendPoint[]>([])
  const [trendLast30Days, setTrendLast30Days] = useState<TrendPoint[]>([])
  const [modeInsights, setModeInsights] = useState<PerformanceInsight[]>([])
  const [categoryInsights, setCategoryInsights] = useState<PerformanceInsight[]>([])
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([])
  const [scenarioHeatmap, setScenarioHeatmap] = useState<ScenarioHeatmapCell[]>([])
  const [improvementGoals, setImprovementGoals] = useState<ImprovementGoal[]>([])
  const [weakestTags, setWeakestTags] = useState<string[]>([])
  const [recommendedScenarioIds, setRecommendedScenarioIds] = useState<string[]>([])
  const [currentStreakDays, setCurrentStreakDays] = useState(0)
  const [bestStreakDays, setBestStreakDays] = useState(0)
  const [totalCompletedRuns, setTotalCompletedRuns] = useState(0)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState(0)
  const [certificateUnlocked, setCertificateUnlocked] = useState(false)
  const [certificateProgress, setCertificateProgress] = useState(0)
  const [resumeRun, setResumeRun] = useState<null | { runId: string; scenarioId: string }>(null)
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [activeMode, setActiveMode] = useState<ModeFilter>('All')
  const [selectedIntensity, setSelectedIntensity] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [maxMinutes, setMaxMinutes] = useState<number>(20)
  const [metricView, setMetricView] = useState<'confidence' | 'eq'>('confidence')
  const [trendRange, setTrendRange] = useState<'7d' | '30d'>('7d')
  const [practicedTips, setPracticedTips] = useState<string[]>([])
  const [tipExpandedId, setTipExpandedId] = useState<string | null>(null)
  const [tipSaving, setTipSaving] = useState(false)

  const isGuest = authStatus === 'unauthenticated'
  const isAdmin = session?.user?.role === 'ADMIN'
  const first = session?.user?.name?.split(' ')[0] ?? 'Guest'

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    if (isAdmin) router.replace('/admin/users')
  }, [authStatus, isAdmin, router])

  useEffect(() => {
    if (isGuest) return
    let ignore = false
    fetch('/api/scenario-runs/summary')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return
        setCompletedScenarioIds(Array.isArray(data.completedScenarioIds) ? data.completedScenarioIds : [])
        setDone(Number(data.done) || 0)
        setConf(Number(data.avgConfidence) || 0)
        setEq(Number(data.avgEq) || 0)
        setAvgRisk(Number(data.avgRisk) || 0)
        setConfidenceEqDelta(Number(data.confidenceEqDelta) || 0)
        setReadinessLevel(
          data.readinessLevel === 'advanced' || data.readinessLevel === 'developing' ? data.readinessLevel : 'starting'
        )
        setTrendLast7Days(Array.isArray(data.trendLast7Days) ? data.trendLast7Days : [])
        setTrendLast30Days(Array.isArray(data.trendLast30Days) ? data.trendLast30Days : [])
        setModeInsights(Array.isArray(data.modeInsights) ? data.modeInsights : [])
        setCategoryInsights(Array.isArray(data.categoryInsights) ? data.categoryInsights : [])
        setRecentRuns(Array.isArray(data.recentRuns) ? data.recentRuns : [])
        setScenarioHeatmap(Array.isArray(data.scenarioHeatmap) ? data.scenarioHeatmap : [])
        setImprovementGoals(Array.isArray(data.improvementGoals) ? data.improvementGoals : [])
        setWeakestTags(Array.isArray(data.weakestTags) ? data.weakestTags : [])
        setRecommendedScenarioIds(Array.isArray(data.recommendedScenarioIds) ? data.recommendedScenarioIds : [])
        setCurrentStreakDays(Number(data.currentStreakDays) || 0)
        setBestStreakDays(Number(data.bestStreakDays) || 0)
        setTotalCompletedRuns(Number(data.totalCompletedRuns) || 0)
        setAchievements(Array.isArray(data.achievements) ? data.achievements : [])
        setUnlockedAchievements(Number(data.unlockedAchievements) || 0)
        setCertificateUnlocked(Boolean(data.certificateUnlocked))
        setCertificateProgress(Number(data.certificateProgress) || 0)
        setPracticedTips(Array.isArray(data.practicedTipIds) ? data.practicedTipIds : [])
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [isGuest])

  useEffect(() => {
    if (isGuest) return
    let ignore = false
    fetch('/api/scenario-runs/resume')
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return
        if (data?.resumeAvailable && data?.runId && data?.scenarioId) {
          setResumeRun({ runId: String(data.runId), scenarioId: String(data.scenarioId) })
        } else {
          setResumeRun(null)
        }
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [isGuest])

  const scenarios: ScenarioCardItem[] = useMemo(() => {
    const all = Object.values(SCENARIOS_MAP)
    return all.map((s, index) => {
      const previousId = index > 0 ? all[index - 1].id : null
      const unlocked = index === 0 || isGuest || (previousId ? completedScenarioIds.includes(previousId) : true)
      return {
        id: s.id,
        title: s.title,
        category: s.category,
        icon: s.icon,
        difficulty: s.difficulty,
        duration: s.duration,
        estimatedMinutes: s.estimatedMinutes,
        tags: s.tags,
        intensity: s.intensity,
        desc: s.context,
        color: s.color,
        backgroundMood: s.backgroundMood,
        locked: !unlocked,
        mode: s.mode,
      }
    })
  }, [completedScenarioIds, isGuest])

  const availableTags = useMemo(() => {
    const allTags = new Set<string>()
    for (const s of scenarios) {
      for (const t of s.tags) allTags.add(t)
    }
    return ['all', ...Array.from(allTags).sort()]
  }, [scenarios])

  const modeFilteredScenarios = useMemo(() => {
    if (activeMode === 'All') return scenarios
    return scenarios.filter((s) => s.mode === activeMode)
  }, [activeMode, scenarios])

  const filteredScenarios = useMemo(() => {
    return modeFilteredScenarios.filter((s) => {
      if (selectedIntensity !== 'all' && s.intensity !== selectedIntensity) return false
      if (selectedTag !== 'all' && !s.tags.includes(selectedTag)) return false
      if (s.estimatedMinutes > maxMinutes) return false
      return true
    })
  }, [modeFilteredScenarios, selectedIntensity, selectedTag, maxMinutes])

  const recommendedScenarios = useMemo(() => {
    return recommendedScenarioIds
      .map((id) => scenarios.find((s) => s.id === id))
      .filter((s): s is ScenarioCardItem => Boolean(s))
      .filter((s) => !s.locked)
  }, [recommendedScenarioIds, scenarios])

  async function updateTipPractice(tipId: string, practiced: boolean) {
    const previous = practicedTips
    setPracticedTips((prev) =>
      practiced ? (prev.includes(tipId) ? prev : [...prev, tipId]) : prev.filter((x) => x !== tipId)
    )
    if (isGuest) return
    setTipSaving(true)
    try {
      const res = await fetch('/api/user/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipId, practiced }),
      })
      if (!res.ok) throw new Error('save-failed')
    } catch {
      setPracticedTips(previous)
    } finally {
      setTipSaving(false)
    }
  }

  async function resetTipPractice() {
    const previous = practicedTips
    setPracticedTips([])
    if (isGuest) return
    setTipSaving(true)
    try {
      const res = await fetch('/api/user/tips', { method: 'DELETE' })
      if (!res.ok) throw new Error('reset-failed')
    } catch {
      setPracticedTips(previous)
    } finally {
      setTipSaving(false)
    }
  }

  if (authStatus === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Loading...</span>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Redirecting to admin...</span>
      </div>
    )
  }

  function scenarioModeHref(scenarioId: string) {
    const scenario = SCENARIOS_MAP[scenarioId]
    if (!scenario) return `/scenario/${scenarioId}`
    return `/mode/${modeToSlug(scenario.mode)}/${scenarioId}`
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.5rem',
          height: 64,
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--wine)' }}>
            Safe<span style={{ color: 'var(--wine-light)' }}>Path</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Hi, <strong style={{ color: 'var(--text)' }}>{first}</strong>
          </span>
          {!isGuest && (
            <Link
              href="/settings"
              title="Open profile settings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <Avatar src={session?.user?.image} alt={`${first} avatar`} size={38} fallbackText={first.slice(0, 1).toUpperCase()} />
            </Link>
          )}
          {isGuest ? (
            <Link href="/login" className="btn-ghost" style={{ fontSize: 13, padding: '7px 16px' }}>
              Log In
            </Link>
          ) : (
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-ghost" style={{ fontSize: 13, padding: '7px 16px' }}>
              Log Out
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2.5rem' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--wine)', marginBottom: 10 }}>
            <DecryptedText text="Your Training Hub" animateOn="view" sequential speed={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, color: 'var(--text)', marginBottom: 10 }}>
            <DecryptedText
              text={`Ready to train, ${first}?`}
              animateOn="view"
              sequential
              speed={24}
              className=""
              encryptedClassName=""
            />
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Each scenario builds real cognitive preparedness.</p>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setTab('scenarios')} className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
              Explore Scenarios
            </button>
            <button onClick={() => setTab('progress')} className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
              View Progress
            </button>
            <button onClick={() => setTab('tips')} className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
              Daily Tips
            </button>
            <Link href="/role-play" className="btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
              Role-Play Mode
            </Link>
          </div>
        </div>

        {resumeRun && (
          <div
            className="card"
            style={{
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                In Progress
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)' }}>
                Resume your last unfinished scenario
              </div>
            </div>
            <Link
              href={`${scenarioModeHref(resumeRun.scenarioId)}?runId=${resumeRun.runId}`}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              Resume Session
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1rem', marginBottom: 40 }}>
          {[
            { label: 'Scenarios Done', value: done, max: scenarios.length || 1, unit: `/ ${scenarios.length}`, color: '#7b1d3a' },
            { label: 'Confidence Score', value: conf, max: 100, unit: '%', color: '#9b3060' },
            { label: 'EQ Score', value: eq, max: 100, unit: '%', color: '#c4537a' },
            { label: 'Current Streak', value: currentStreakDays, max: Math.max(1, bestStreakDays), unit: ' days', color: '#8a3a5e' },
          ].map((m, i) => (
            <div key={i} className="card" style={{ padding: '24px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>
                <DecryptedText text={m.label} animateOn="view" sequential speed={30} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, color: m.color, lineHeight: 1 }}>
                {m.value}
                <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>{m.unit}</span>
              </div>
              <div style={{ marginTop: 14, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(m.value / m.max) * 100}%`, background: m.color, borderRadius: 2, transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', marginBottom: 32 }}>
          {(['scenarios', 'progress', 'tips'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 22px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2.5px solid ${tab === t ? 'var(--wine)' : 'transparent'}`,
                color: tab === t ? 'var(--wine)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: -2,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'scenarios' && (
          <>
            {!isGuest && recommendedScenarios.length > 0 && (
              <div className="card" style={{ padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Recommended Next
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {recommendedScenarios.slice(0, 3).map((s) => (
                    <Link key={s.id} href={scenarioModeHref(s.id)} className="btn-ghost" style={{ fontSize: 12 }}>
                      {s.icon} {s.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="card" style={{ padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['All', 'Simulation', 'Puzzle', 'Role-Play', 'Strategy', 'Story'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveMode(mode)}
                    className={activeMode === mode ? 'btn-primary' : 'btn-ghost'}
                    style={{ fontSize: 11, padding: '7px 12px' }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 16, marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Intensity
                <select
                  value={selectedIntensity}
                  onChange={(e) => setSelectedIntensity(e.target.value as 'all' | 'low' | 'medium' | 'high')}
                  style={{ marginLeft: 8 }}
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Tag
                <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} style={{ marginLeft: 8 }}>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Max Minutes
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={maxMinutes}
                  onChange={(e) => setMaxMinutes(Math.max(5, Math.min(60, Number(e.target.value) || 20)))}
                  style={{ marginLeft: 8, width: 70 }}
                />
              </label>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {filteredScenarios.length} / {modeFilteredScenarios.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1.25rem' }}>
              {filteredScenarios.map((s) => (
                <ScenarioCard key={s.id} s={s} href={scenarioModeHref(s.id)} />
              ))}
            </div>
          </>
        )}

        {tab === 'progress' && (
          <ProgressExperience
            done={done}
            totalScenarios={scenarios.length}
            totalCompletedRuns={totalCompletedRuns}
            currentStreakDays={currentStreakDays}
            bestStreakDays={bestStreakDays}
            conf={conf}
            eq={eq}
            avgRisk={avgRisk}
            confidenceEqDelta={confidenceEqDelta}
            readinessLevel={readinessLevel}
            weakestTags={weakestTags}
            trendLast7Days={trendLast7Days}
            trendLast30Days={trendLast30Days}
            trendRange={trendRange}
            setTrendRange={setTrendRange}
            modeInsights={modeInsights}
            categoryInsights={categoryInsights}
            recentRuns={recentRuns}
            scenarioHeatmap={scenarioHeatmap}
            improvementGoals={improvementGoals}
            achievements={achievements}
            unlockedAchievements={unlockedAchievements}
            certificateUnlocked={certificateUnlocked}
            certificateProgress={certificateProgress}
            metricView={metricView}
            setMetricView={setMetricView}
          />
        )}

        {tab === 'tips' && (
          <TipsExperience
            practicedTips={practicedTips}
            tipExpandedId={tipExpandedId}
            setTipExpandedId={setTipExpandedId}
            onTogglePractice={updateTipPractice}
            onResetPractice={resetTipPractice}
            saving={tipSaving}
          />
        )}
      </div>
    </div>
  )
}

function ScenarioCard({ s, href }: { s: ScenarioCardItem; href: string }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => !s.locked && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: 28,
        borderRadius: 16,
        border: `1.5px solid ${hov ? s.color : 'var(--border)'}`,
        background: hov ? 'rgba(123,29,58,0.08)' : 'var(--bg-card)',
        boxShadow: hov ? '0 8px 32px rgba(123,29,58,0.1)' : '0 2px 12px rgba(0,0,0,0.04)',
        transition: 'all 0.25s',
        opacity: s.locked ? 0.55 : 1,
        cursor: s.locked ? 'not-allowed' : 'pointer',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      <div
        style={{
          margin: '-28px -28px 14px',
          height: 88,
          borderRadius: '16px 16px 0 0',
          background: `${s.backgroundMood}, radial-gradient(circle at 80% 20%, ${s.color}66, transparent 45%)`,
          borderBottom: `1px solid ${s.color}33`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: 10,
            fontSize: 28,
            opacity: 0.85,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
          }}
        >
          {s.icon}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: 0 }}>{''}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: s.color, background: `${s.color}15`, padding: '3px 8px', borderRadius: 4 }}>
            {s.mode}
          </span>
          {s.locked && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Complete previous first</span>}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>{s.category}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 8 }}>{s.title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
        {s.desc.slice(0, 100)}...
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: '#f3e8ee', color: '#7b1d3a' }}>
          {s.intensity}
        </span>
        {s.tags.slice(0, 2).map((t) => (
          <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: '#f3f4f6', color: '#374151' }}>
            {t}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.estimatedMinutes} min</span>
        {!s.locked && (
          <Link
            href={href}
            className="btn-primary"
            style={{
              fontSize: 12,
              padding: '8px 18px',
              background: hov ? `linear-gradient(135deg, ${s.color}, #c4537a)` : 'var(--grad-hero)',
            }}
          >
            Begin
          </Link>
        )}
      </div>
    </div>
  )
}

function ProgressExperience(props: {
  done: number
  totalScenarios: number
  totalCompletedRuns: number
  currentStreakDays: number
  bestStreakDays: number
  conf: number
  eq: number
  avgRisk: number
  confidenceEqDelta: number
  readinessLevel: 'starting' | 'developing' | 'advanced'
  weakestTags: string[]
  trendLast7Days: TrendPoint[]
  trendLast30Days: TrendPoint[]
  trendRange: '7d' | '30d'
  setTrendRange: (range: '7d' | '30d') => void
  modeInsights: PerformanceInsight[]
  categoryInsights: PerformanceInsight[]
  recentRuns: RecentRun[]
  scenarioHeatmap: ScenarioHeatmapCell[]
  improvementGoals: ImprovementGoal[]
  achievements: Achievement[]
  unlockedAchievements: number
  certificateUnlocked: boolean
  certificateProgress: number
  metricView: 'confidence' | 'eq'
  setMetricView: (value: 'confidence' | 'eq') => void
}) {
  const ringPercent = Math.max(0, Math.min(100, Math.round((props.done / Math.max(1, props.totalScenarios)) * 100)))
  const trendPoints = props.trendRange === '30d' ? props.trendLast30Days : props.trendLast7Days
  const readinessColor =
    props.readinessLevel === 'advanced'
      ? '#166534'
      : props.readinessLevel === 'developing'
        ? '#9a3412'
        : '#7b1d3a'
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
          Progress Snapshot
        </div>
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: 12, padding: '6px 10px', marginBottom: 12 }}
          onClick={() => {
            const html = `
              <html>
                <head><title>SafePath Progress Report</title></head>
                <body style="font-family: Arial, sans-serif; padding: 24px; color: #1a0a0f;">
                  <h1>SafePath Progress Report</h1>
                  <p>Generated on: ${new Date().toLocaleString()}</p>
                  <h2>Overview</h2>
                  <ul>
                    <li>Completed scenarios: ${props.done}/${props.totalScenarios}</li>
                    <li>Completed runs: ${props.totalCompletedRuns}</li>
                    <li>Current streak: ${props.currentStreakDays} day(s)</li>
                    <li>Best streak: ${props.bestStreakDays} day(s)</li>
                    <li>Average confidence: ${props.conf}%</li>
                    <li>Average EQ: ${props.eq}%</li>
                    <li>Average risk: ${props.avgRisk}%</li>
                    <li>Readiness: ${props.readinessLevel}</li>
                  </ul>
                </body>
              </html>
            `
            const win = window.open('', '_blank')
            if (!win) return
            win.document.write(html)
            win.document.close()
            win.focus()
            win.print()
          }}
        >
          Export Progress PDF
        </button>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: '50%',
              background: `conic-gradient(#9b3060 ${ringPercent}%, #ecdbe2 0)`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'var(--bg-card)', display: 'grid', placeItems: 'center' }}>
              <strong style={{ color: 'var(--wine)', fontFamily: 'var(--font-display)' }}>{ringPercent}%</strong>
            </div>
          </div>
          <div style={{ minWidth: 190 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Completed scenarios: <strong style={{ color: 'var(--text)' }}>{props.done}/{props.totalScenarios}</strong></p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Completed runs: <strong style={{ color: 'var(--text)' }}>{props.totalCompletedRuns}</strong></p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Current streak: <strong style={{ color: 'var(--text)' }}>{props.currentStreakDays} day(s)</strong></p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Best streak: <strong style={{ color: 'var(--text)' }}>{props.bestStreakDays} day(s)</strong></p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Avg risk (lower is better): <strong style={{ color: 'var(--text)' }}>{props.avgRisk}%</strong></p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Readiness level: <strong style={{ color: readinessColor, textTransform: 'capitalize' }}>{props.readinessLevel}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Trend ({props.trendRange === '30d' ? '30 days' : '7 days'})
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              {(['7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => props.setTrendRange(range)}
                  style={{
                    border: 'none',
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: props.trendRange === range ? 'var(--tone-soft)' : 'var(--bg-card)',
                    color: props.trendRange === range ? 'var(--wine)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            {(['confidence', 'eq'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => props.setMetricView(m)}
                style={{
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: props.metricView === m ? 'var(--tone-soft)' : 'var(--bg-card)',
                  color: props.metricView === m ? 'var(--wine)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {m === 'confidence' ? 'Confidence' : 'EQ'}
              </button>
            ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'end', height: 140 }}>
          {trendPoints.map((point) => {
            const val = props.metricView === 'confidence' ? point.avgConfidence : point.avgEq
            return (
              <div key={point.date} style={{ flex: 1, display: 'grid', justifyItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: `${Math.max(8, val)}%`, background: props.metricView === 'confidence' ? '#9b3060' : '#c4537a', borderRadius: '6px 6px 2px 2px', transition: 'all .3s ease' }} />
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{point.label}</div>
              </div>
            )
          })}
        </div>
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          Avg confidence: <strong style={{ color: 'var(--text)' }}>{props.conf}%</strong> | Avg EQ: <strong style={{ color: 'var(--text)' }}>{props.eq}%</strong>
        </p>
        <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Confidence-EQ balance: <strong style={{ color: 'var(--text)' }}>{props.confidenceEqDelta >= 0 ? '+' : ''}{props.confidenceEqDelta}</strong>
        </p>
        {props.weakestTags.length > 0 && (
          <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            Focus areas: <strong style={{ color: 'var(--text)' }}>{props.weakestTags.join(', ')}</strong>
          </p>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Mode Performance
        </div>
        {props.modeInsights.slice(0, 4).map((m) => (
          <div key={m.name} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>{m.name} ({m.runs})</span>
              <strong style={{ color: 'var(--text)' }}>{m.score}</strong>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(2, Math.min(100, m.score))}%`, height: '100%', background: '#9b3060' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Category Performance
        </div>
        {props.categoryInsights.slice(0, 4).map((m) => (
          <div key={m.name} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>{m.name} ({m.runs})</span>
              <strong style={{ color: 'var(--text)' }}>{m.score}</strong>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(2, Math.min(100, m.score))}%`, height: '100%', background: '#c4537a' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Improvement Plan
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {props.improvementGoals.map((g) => (
            <div key={g.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text)' }}>{g.title}</strong>
                <span style={{ fontSize: 11, borderRadius: 999, padding: '2px 8px', background: g.priority === 'high' ? '#fde7ea' : g.priority === 'medium' ? '#fff4e6' : '#edf5ff', color: g.priority === 'high' ? '#9f1239' : g.priority === 'medium' ? '#9a3412' : '#1d4ed8', fontWeight: 700 }}>
                  {g.priority}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target: {g.target}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.reason}</div>
            </div>
          ))}
          {props.improvementGoals.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No immediate gaps detected. Keep consistency to maintain performance.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Scenario Skill Heatmap
        </div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {props.scenarioHeatmap.slice(0, 12).map((cell) => {
            const intensity = Math.max(20, Math.min(100, cell.score))
            return (
              <div key={cell.scenarioId} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 10, background: `linear-gradient(135deg, rgba(123,29,58,${intensity / 350}), var(--bg-card))` }}>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, marginBottom: 2 }}>{cell.scenarioTitle}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{cell.category} | {cell.mode}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Runs: {cell.runs}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conf {cell.avgConfidence}% | EQ {cell.avgEq}% | Risk {cell.avgRisk}%</div>
                <div style={{ marginTop: 6, height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(2, Math.min(100, cell.score))}%`, height: '100%', background: '#9b3060' }} />
                </div>
              </div>
            )
          })}
          {props.scenarioHeatmap.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Complete scenarios to populate heatmap insights.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Recent Session Timeline
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {props.recentRuns.map((run) => (
            <div key={`${run.scenarioId}-${run.completedAt}`} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text)' }}>{run.scenarioTitle}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(run.completedAt).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {run.category} | {run.mode} | Outcome: {run.outcome}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Conf {run.confidence}% | EQ {run.eq}% | Risk {run.risk}%
              </div>
            </div>
          ))}
          {props.recentRuns.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No completed runs yet. Finish a scenario to see your timeline.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Achievements and Certificate
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {props.achievements.map((a) => (
            <span
              key={a.id}
              title={a.description}
              style={{
                fontSize: 11,
                borderRadius: 999,
                padding: '6px 10px',
                border: `1px solid ${a.unlocked ? '#8a3a5e55' : 'var(--border)'}`,
                background: a.unlocked ? 'var(--tone-soft)' : 'var(--bg-card)',
                color: a.unlocked ? '#7b1d3a' : 'var(--text-muted)',
                fontWeight: 700,
              }}
            >
              {a.unlocked ? 'Unlocked' : 'Locked'} | {a.title}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          Achievements unlocked: <strong style={{ color: 'var(--text)' }}>{props.unlockedAchievements}/{props.achievements.length}</strong>
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Certificate status: <strong style={{ color: props.certificateUnlocked ? 'var(--wine)' : 'var(--text)' }}>{props.certificateUnlocked ? 'Ready' : 'In progress'}</strong>
        </p>
        <div style={{ marginBottom: 10 }}>
          <Link href="/certificate" className={props.certificateUnlocked ? 'btn-primary' : 'btn-ghost'} style={{ fontSize: 12, padding: '6px 10px' }}>
            {props.certificateUnlocked ? 'Open Certificate' : 'View Certificate Requirements'}
          </Link>
        </div>
        <div style={{ height: 9, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${props.certificateUnlocked ? 100 : Math.min(100, props.certificateProgress)}%`,
              height: '100%',
              background: props.certificateUnlocked ? 'linear-gradient(135deg, #7b1d3a, #c4537a)' : '#9b3060',
              transition: 'width .35s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function TipsExperience(props: {
  practicedTips: string[]
  tipExpandedId: string | null
  setTipExpandedId: (id: string | null) => void
  onTogglePractice: (tipId: string, practiced: boolean) => Promise<void>
  onResetPractice: () => Promise<void>
  saving: boolean
}) {
  const practicedCount = props.practicedTips.length
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Daily Tip Practice</div>
          <div style={{ fontSize: 15, color: 'var(--text)' }}>
            {practicedCount}/{TIPS.length} tips marked as practiced
          </div>
        </div>
        <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => void props.onResetPractice()} disabled={props.saving}>
          Reset
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {TIPS.map((t) => {
          const expanded = props.tipExpandedId === t.id
          const practiced = props.practicedTips.includes(t.id)
          return (
            <div key={t.id} className="card" style={{ padding: 18, borderColor: practiced ? '#7b1d3a44' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, borderRadius: 999, padding: '4px 9px', background: 'var(--tone-soft)', color: 'var(--wine)', fontWeight: 700 }}>{t.category}</span>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>{t.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{t.tip}</p>
              {expanded && (
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-mid)' }}>
                  Action: {t.action}
                </div>
              )}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => props.setTipExpandedId(expanded ? null : t.id)}>
                  {expanded ? 'Hide Action' : 'Show Action'}
                </button>
                <button
                  type="button"
                  className={practiced ? 'btn-ghost' : 'btn-primary'}
                  style={{ fontSize: 12, padding: '6px 10px' }}
                  onClick={() => void props.onTogglePractice(t.id, !practiced)}
                  disabled={props.saving}
                >
                  {practiced ? 'Marked Practiced' : 'Mark Practiced'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
