'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SCENARIOS from '@/lib/scenarios'
import { applyChoiceScoring } from '@/lib/scoring'
import { modeToSlug } from '@/lib/mode'

type Phase = 'warning' | 'playing' | 'coaching' | 'end'

interface CoachFeedback {
  feedback: string
  hint: string
  riskDelta: number
  eqDelta: number
  coachMood: string
}

type ScenarioCoreProps = {
  scenarioId: string
  routeVariant?: 'legacy' | 'mode'
}

export default function ScenarioCore({ scenarioId, routeVariant = 'legacy' }: ScenarioCoreProps) {
  const router   = useRouter()
  const searchParams = useSearchParams()
  const id = scenarioId
  const scenario = SCENARIOS[id]
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const [phase, setPhase]               = useState<Phase>('warning')
  const [currentNodeId, setCurrentNodeId] = useState(scenario?.startNodeId || '')
  const [riskLevel, setRiskLevel]       = useState(40)
  const [confidence, setConfidence]     = useState(50)
  const [eqScore, setEqScore]           = useState(50)
  const [choiceHistory, setChoiceHistory] = useState<string[]>([])
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [coaching, setCoaching]         = useState<CoachFeedback | null>(null)
  const [loadingCoach, setLoadingCoach] = useState(false)
  const [showHint, setShowHint]         = useState(false)
  const [elapsed, setElapsed]           = useState(0)
  const [runId, setRunId]               = useState<string | null>(null)
  const [runCompleteSent, setRunCompleteSent] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resumeInitRef = useRef(false)

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  useEffect(() => {
    const readTheme = () => {
      const t = document.documentElement.getAttribute('data-theme')
      setTheme(t === 'dark' ? 'dark' : 'light')
    }
    readTheme()
    const observer = new MutationObserver(readTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!scenario || resumeInitRef.current) return
    const requestedRunId = searchParams.get('runId')
    if (!requestedRunId) return

    resumeInitRef.current = true
    setResumeLoading(true)

    fetch(`/api/scenario-runs/resume?runId=${encodeURIComponent(requestedRunId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.resumeAvailable) return
        if (String(data.scenarioId) !== scenario.id) return

        setRunId(String(data.runId))
        setCurrentNodeId(String(data.currentNodeId))
        setRiskLevel(Number(data.riskLevel) || 40)
        setConfidence(Number(data.confidence) || 50)
        setEqScore(Number(data.eqScore) || 50)
        setChoiceHistory(Array.isArray(data.choiceHistory) ? data.choiceHistory.map(String) : [])
        setElapsed(Number(data.elapsedSeconds) || 0)
        setRunCompleteSent(false)
        setPhase(data.isEnd ? 'end' : 'playing')
      })
      .catch(() => {})
      .finally(() => setResumeLoading(false))
  }, [scenario, searchParams])

  if (!scenario) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Scenario not found</h2>
        <Link href="/dashboard" className="btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>Back to Dashboard</Link>
      </div>
    </div>
  )

  if (resumeLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Resuming session...</div>
    </div>
  )

  const currentNode = scenario.nodes[currentNodeId]
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const secs = String(elapsed % 60).padStart(2, '0')
  const scenarioOrder = Object.keys(SCENARIOS)
  const currentIndex = scenarioOrder.indexOf(scenario.id)
  const nextScenarioId =
    currentIndex >= 0 && currentIndex < scenarioOrder.length - 1
      ? scenarioOrder[currentIndex + 1]
      : null

  function getScenarioHref(targetScenarioId: string) {
    if (routeVariant === 'mode') {
      const targetScenario = SCENARIOS[targetScenarioId]
      if (targetScenario) return `/mode/${modeToSlug(targetScenario.mode)}/${targetScenarioId}`
    }
    return `/scenario/${targetScenarioId}`
  }

  function resetScenarioSession() {
    setPhase('warning')
    setCurrentNodeId(scenario.startNodeId)
    setRiskLevel(40)
    setConfidence(50)
    setEqScore(50)
    setChoiceHistory([])
    setSelectedChoice(null)
    setCoaching(null)
    setLoadingCoach(false)
    setShowHint(false)
    setElapsed(0)
    setRunId(null)
    setRunCompleteSent(false)
  }

  async function startScenarioRun() {
    try {
      const res = await fetch('/api/scenario-runs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          initialRisk: riskLevel,
          initialConfidence: confidence,
          initialEq: eqScore,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data?.runId) setRunId(String(data.runId))
    } catch {}
  }

  async function trackChoiceEvent(params: {
    choiceId: string
    choiceText: string
    riskImpact: number
    eqImpact: number
    riskBefore: number
    riskAfter: number
    confidenceBefore: number
    confidenceAfter: number
    eqBefore: number
    eqAfter: number
  }) {
    if (!runId) return
    try {
      await fetch('/api/scenario-runs/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          nodeId: currentNodeId,
          ...params,
        }),
      })
    } catch {}
  }

  async function completeScenarioRun(outcome?: string) {
    if (!runId || runCompleteSent) return
    setRunCompleteSent(true)
    try {
      await fetch('/api/scenario-runs/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          finalRisk: riskLevel,
          finalConfidence: confidence,
          finalEq: eqScore,
          outcome,
        }),
      })
    } catch {}
  }

  async function handleChoice(choiceId: string) {
    if (selectedChoice) return
    const choice = currentNode.choices.find(c => c.id === choiceId)
    if (!choice) return

    setSelectedChoice(choiceId)
    setPhase('coaching')
    setLoadingCoach(true)
    setShowHint(false)

    // Update meters optimistically
    const riskBefore = riskLevel
    const confidenceBefore = confidence
    const eqBefore = eqScore
    const next = applyChoiceScoring(
      { risk: riskLevel, confidence, eq: eqScore },
      choice
    )
    const riskAfter = next.risk
    const confidenceAfter = next.confidence
    const eqAfter = next.eq

    setRiskLevel(riskAfter)
    setConfidence(confidenceAfter)
    setEqScore(eqAfter)
    setChoiceHistory(h => [...h, choice.text])

    void trackChoiceEvent({
      choiceId,
      choiceText: choice.text,
      riskImpact: choice.riskImpact,
      eqImpact: choice.eqImpact,
      riskBefore,
      riskAfter,
      confidenceBefore,
      confidenceAfter,
      eqBefore,
      eqAfter,
    })

    try {
      const res = await fetch('/api/coach/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          nodeId: currentNodeId,
          choiceId,
          choiceText: choice.text,
          playerHistory: choiceHistory,
          riskLevel,
        }),
      })
      const data = await res.json()
      setCoaching(data)
    } catch {
      setCoaching({
        feedback: "Your instincts are developing. Every decision in a real scenario is valid data — there are no perfect answers, only more and less prepared ones.",
        hint: choice.aiCoachNote,
        riskDelta: choice.riskImpact,
        eqDelta: choice.eqImpact,
        coachMood: 'encouraging',
      })
    } finally {
      setLoadingCoach(false)
    }
  }

  function continueScenario() {
    const choice = currentNode.choices.find(c => c.id === selectedChoice)
    if (!choice) return
    setSelectedChoice(null)
    setCoaching(null)

    if (choice.nextNodeId && scenario.nodes[choice.nextNodeId]) {
      const nextNode = scenario.nodes[choice.nextNodeId]
      setCurrentNodeId(choice.nextNodeId)
      if (nextNode.isEnd) {
        void completeScenarioRun(nextNode.endType || 'partial')
        setPhase('end')
      } else {
        setPhase('playing')
      }
    } else {
      void completeScenarioRun('partial')
      setPhase('end')
    }
  }

  const moodColors: Record<string, string> = {
    tense: '#7b1d3a', escalated: '#b91c1c', relieved: '#15803d', neutral: '#3b82f6', resolved: '#7c3aed',
  }
  const moodLabels: Record<string, string> = {
    tense: '⚠️ Tense', escalated: '🚨 Escalating', relieved: '✅ De-escalated', neutral: '😐 Neutral', resolved: '🎯 Resolved',
  }
  const endMessages: Record<string, { title: string; subtitle: string; emoji: string }> = {
    safe: { title: 'Excellent work.', subtitle: 'You navigated this scenario safely. Your choices reflect strong situational awareness.', emoji: '🛡️' },
    partial: { title: 'Good instincts.', subtitle: 'You kept yourself safe. There may be additional strategies to explore — try replaying.', emoji: '💪' },
    learning: { title: 'Important lesson.', subtitle: "This outcome shows a common vulnerability. Don't worry — recognising patterns is the first step.", emoji: '📚' },
  }

  // ── Warning Screen ──────────────────────────────────────────────────────
  if (phase === 'warning') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div className="card" style={{ padding: '40px 36px' }}>
          <div style={{ fontSize: 40, marginBottom: 20, textAlign: 'center' }}>{scenario.icon}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, color: 'var(--text)', textAlign: 'center', marginBottom: 8 }}>{scenario.title}</h1>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ fontSize: 11, color: scenario.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: `${scenario.color}15`, padding: '3px 10px', borderRadius: 100 }}>{scenario.mode} · {scenario.category}</span>
          </div>

          {scenario.triggerWarnings.length > 0 && (
            <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(246,173,85,0.07)', border: '1px solid rgba(246,173,85,0.25)', marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>⚠️ Content Notice</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>This scenario contains references to:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {scenario.triggerWarnings.map((w, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: 'rgba(246,173,85,0.12)', color: '#92400e', fontWeight: 600 }}>{w}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28, padding: '0 4px' }}>
            <strong style={{ color: 'var(--text)' }}>Context:</strong> {scenario.context}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>← Back</Link>
            <button
              onClick={() => {
                setPhase('playing')
                void startScenarioRun()
              }}
              className="btn-primary"
              style={{ flex: 2, justifyContent: 'center', padding: '13px' }}
            >
              I am Ready — Begin →
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            Emergency exit available on every screen
          </p>
        </div>
      </div>
    </div>
  )

  // ── End Screen ──────────────────────────────────────────────────────────
  if (phase === 'end' && currentNode?.isEnd) {
    const endData = endMessages[currentNode.endType || 'partial']
    const improvement = Math.round((confidence - 50 + eqScore - 50) / 2)
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 540, width: '100%' }}>
          <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'var(--grad-hero)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, boxShadow: '0 8px 32px rgba(123,29,58,0.3)',
            }}>{endData.emoji}</div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 10 }}>{endData.title}</h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>{endData.subtitle}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 36 }}>
              {[
                { label: 'Choices Made', value: choiceHistory.length, unit: '' },
                { label: 'Confidence', value: confidence, unit: '%' },
                { label: 'EQ Score', value: eqScore, unit: '%' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 12px', borderRadius: 10, background: 'rgba(123,29,58,0.04)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: 'var(--wine)' }}>{m.value}{m.unit}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {improvement > 0 && (
              <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(123,29,58,0.05)', border: '1.5px solid var(--border)', marginBottom: 28 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--wine)' }}>
                  +{improvement}% growth this session 🎉
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }} onClick={() => resetScenarioSession()}>
                Replay
              </button>
              {nextScenarioId && (
                <button
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                  onClick={() => router.push(getScenarioHref(nextScenarioId))}
                >
                  Next Scenario
                </button>
              )}
              <Link href="/dashboard" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Game UI ─────────────────────────────────────────────────────────
  const isDark = theme === 'dark'
  const gameplayBackground = isDark
    ? scenario.backgroundMood
    : 'linear-gradient(135deg, #fff7fa 0%, #ffeef7 55%, #fffaff 100%)'
  const hudBg = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.82)'
  const hudBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)'
  const hudText = isDark ? '#fff' : 'var(--text)'
  const hudMuted = isDark ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)'
  const cardBg = isDark
    ? 'linear-gradient(160deg, rgba(20,12,24,0.74), rgba(20,12,24,0.56))'
    : 'linear-gradient(160deg, rgba(255,255,255,0.94), rgba(255,237,247,0.9))'
  const cardText = isDark ? '#f0e8ec' : 'var(--text)'
  const coachingBg = isDark ? 'rgba(15,8,16,0.9)' : 'rgba(255,255,255,0.95)'
  const coachingText = isDark ? '#e8d5dc' : 'var(--text)'

  return (
    <div style={{ minHeight: '100vh', background: gameplayBackground, position: 'relative', overflow: 'hidden' }}>

      {/* Atmospheric background */}
      <div style={{ position: 'fixed', inset: 0, background: gameplayBackground, opacity: isDark ? 0.85 : 0.75, zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '15%', left: '12%', width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${scenario.color}${isDark ? '44' : '2b'} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 1, filter: 'blur(10px)' }} />
      <div style={{ position: 'fixed', bottom: '8%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 72%)' : 'radial-gradient(circle, rgba(255, 111, 145, 0.1) 0%, transparent 72%)', pointerEvents: 'none', zIndex: 1, filter: 'blur(8px)' }} />

      {/* Emergency Exit */}
      <Link href="/safe-exit" style={{
        position: 'fixed', top: 16, right: 16, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 8,
        background: isDark ? 'rgba(185,28,28,0.9)' : 'rgba(185,28,28,0.82)', color: '#fff',
        fontSize: 12, fontWeight: 700, textDecoration: 'none',
        backdropFilter: 'blur(8px)',
        boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(185,28,28,0.22)',
      }}>🚪 Exit Safely</Link>

      {/* HUD */}
      <div style={{
        position: 'fixed', top: 16, left: 16, right: 80, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L4 7v8c0 5.5 4.3 10.7 10 12 5.7-1.3 10-6.5 10-12V7L14 2z" stroke={isDark ? '#fff' : '#2b1430'} strokeWidth="2" fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'} />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: hudText, opacity: 0.9 }}>SafePath</span>
        </div>

        {/* Risk Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: hudBg, backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 12px', border: hudBorder }}>
          <span style={{ fontSize: 10, color: hudMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>RISK</span>
          <div style={{ width: 80, height: 5, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(141,103,148,0.25)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${riskLevel}%`,
              background: riskLevel > 70 ? '#ef4444' : riskLevel > 40 ? '#f59e0b' : '#22c55e',
              borderRadius: 3,
              transition: 'all 0.5s ease',
            }} />
          </div>
          <span style={{ fontSize: 11, color: hudText, fontWeight: 700 }}>{riskLevel}%</span>
        </div>

        {/* Confidence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: hudBg, backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 12px', border: hudBorder }}>
          <span style={{ fontSize: 10, color: hudMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>CONF</span>
          <div style={{ width: 60, height: 5, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(141,103,148,0.25)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${confidence}%`, background: 'var(--pink)', borderRadius: 3, transition: 'all 0.5s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: hudText, fontWeight: 700 }}>{confidence}%</span>
        </div>

        {/* Mood */}
        <div style={{ background: hudBg, backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 12px', border: `1px solid ${moodColors[currentNode?.mood || 'neutral']}55`, fontSize: 11, color: hudText }}>
          {moodLabels[currentNode?.mood || 'neutral']}
        </div>

        {/* Timer */}
        <div style={{ background: hudBg, backdropFilter: 'blur(8px)', borderRadius: 8, padding: '6px 12px', border: hudBorder, fontSize: 11, color: hudMuted, fontFamily: 'monospace' }}>
          {mins}:{secs}
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 2rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>

          {/* Scenario card */}
          <div style={{
            background: cardBg,
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: `1px solid ${moodColors[currentNode?.mood || 'neutral']}44`,
            padding: '32px 36px',
            marginBottom: 20,
            boxShadow: isDark
              ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 20px 60px rgba(123,29,58,0.14), 0 0 0 1px rgba(255,255,255,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, opacity: 0.7 }}>
              <span style={{ fontSize: 16 }}>{scenario.icon}</span>
              <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{scenario.title}</span>
            </div>

            <p style={{ fontSize: 16, color: cardText, lineHeight: 1.8, fontStyle: 'italic' }}>
              {currentNode?.description}
            </p>
          </div>

          {/* Choices */}
          {phase === 'playing' && currentNode?.choices && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>What do you do?</div>
              {currentNode.choices.map((choice, i) => (
                <button key={choice.id} onClick={() => handleChoice(choice.id)} style={{
                  padding: '16px 20px',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,240,248,0.85))',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--border)',
                  borderRadius: 12,
                  color: cardText,
                  fontSize: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  lineHeight: 1.5,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `rgba(${scenario.color === '#7b1d3a' ? '123,29,58' : '155,48,96'},0.25)`
                    e.currentTarget.style.borderColor = `${scenario.color}88`
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isDark
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,240,248,0.85))'
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'var(--border)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
                  {choice.text}
                </button>
              ))}
            </div>
          )}

          {/* Coaching panel */}
          {phase === 'coaching' && (
            <div style={{
              background: coachingBg,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${scenario.color}55`,
              borderRadius: 16,
              padding: '28px',
              boxShadow: isDark
                ? `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${scenario.color}22`
                : `0 8px 32px rgba(123,29,58,0.15), 0 0 30px ${scenario.color}26`,
            }}>
              {/* Selected choice */}
              <div style={{ padding: '10px 14px', borderRadius: 8, background: `${scenario.color}22`, border: `1px solid ${scenario.color}44`, marginBottom: 20, fontSize: 13, color: isDark ? 'rgba(255,255,255,0.75)' : 'var(--text)' }}>
                <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 4 }}>YOUR CHOICE</span>
                {currentNode?.choices.find(c => c.id === selectedChoice)?.text}
              </div>

              {/* AI Coach header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--grad-hero)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>🤖</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: hudText }}>SafePath AI Coach</div>
                  <div style={{ fontSize: 11, color: hudMuted }}>Trauma-informed · Non-judgmental</div>
                </div>
                {loadingCoach && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: scenario.color,
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                )}
              </div>

              {!loadingCoach && coaching && (
                <>
                  <p style={{ fontSize: 14, color: coachingText, lineHeight: 1.8, marginBottom: 20 }}>{coaching.feedback}</p>

                  {!showHint ? (
                    <button onClick={() => setShowHint(true)} style={{
                      fontSize: 12, color: scenario.color === '#7b1d3a' ? '#e8759a' : '#f3a8c0',
                      background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
                    }}>
                      💡 Show safety tip
                    </button>
                  ) : (
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(232,117,154,0.1)', border: '1px solid rgba(232,117,154,0.2)', marginBottom: 20, fontSize: 13, color: '#f3a8c0', fontStyle: 'italic' }}>
                      💡 {coaching.hint}
                    </div>
                  )}

                  {/* Score deltas */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: coaching.riskDelta < 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: coaching.riskDelta < 0 ? '#4ade80' : '#f87171', border: `1px solid ${coaching.riskDelta < 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      Risk {coaching.riskDelta < 0 ? '▼' : '▲'} {Math.abs(coaching.riskDelta)}
                    </div>
                    <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(232,117,154,0.1)', color: '#f3a8c0', border: '1px solid rgba(232,117,154,0.2)' }}>
                      EQ +{coaching.eqDelta} · Confidence +{Math.abs(coaching.eqDelta)}
                    </div>
                  </div>

                  <button onClick={continueScenario} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {currentNode?.choices.find(c => c.id === selectedChoice)?.nextNodeId &&
                      scenario.nodes[currentNode.choices.find(c => c.id === selectedChoice)!.nextNodeId!]?.isEnd
                      ? 'See Outcome →'
                      : 'Continue →'
                    }
                  </button>
                </>
              )}

              {loadingCoach && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: hudMuted, fontSize: 13 }}>
                  Analysing your decision…
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
