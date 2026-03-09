'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import SCENARIOS from '@/lib/scenarios'
import { applyChoiceScoring } from '@/lib/scoring'
import StarBorder from '@/app/components/StarBorder'
import DecryptedText from '@/app/components/DecryptedText'
import RedFlagScanner from '@/app/components/RedFlagScanner'
import WhackAMoleRisk from '@/app/components/WhackAMoleRisk'
import MatchTheFollowing from '@/app/components/MatchTheFollowing'
import AvatarPath from '@/app/components/AvatarPath'
import ScenarioChat from '@/app/components/ScenarioChat'
import SafetyGridEngine from '@/app/components/SafetyGridEngine'
import confetti from 'canvas-confetti'

interface ScenarioCoreProps {
  scenarioId: string
  routeVariant?: 'legacy' | 'mode'
}

type Phase = 'playing' | 'coaching' | 'end'

interface CoachFeedback {
  feedback: string
  hint: string
  riskDelta: number
  eqDelta: number
  coachMood: string
}

export default function ScenarioCore({ scenarioId, routeVariant: _routeVariant = 'legacy' }: ScenarioCoreProps) {
  const scenario = SCENARIOS[scenarioId]

  const [phase, setPhase] = useState<Phase>('playing')
  const [currentNodeId, setCurrentNodeId] = useState(scenario?.startNodeId || '')
  const [riskLevel, setRiskLevel] = useState(40)
  const [confidence, setConfidence] = useState(50)
  const [eqScore, setEqScore] = useState(50)
  const [history, setHistory] = useState<string[]>([scenario?.startNodeId || ''])
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [coaching, setCoaching] = useState<CoachFeedback | null>(null)
  const [loadingCoach, setLoadingCoach] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [_runId, setRunId] = useState<string | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [timeLeft, setTimeLeft] = useState(15)
  const [isCritical, setIsCritical] = useState(false)
  const [missedNodes, setMissedNodes] = useState<Array<{ nodeId: string; description: string; choices: typeof scenario.nodes[string]['choices'] }>>([])

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasStartedRef = useRef(false)
  // Prevents handleTimeOut firing more than once per node
  const hasTimedOutRef = useRef(false)
  // Keep a live ref to currentNodeId so the timer closure always reads the latest value
  const currentNodeIdRef = useRef(currentNodeId)
  useEffect(() => { currentNodeIdRef.current = currentNodeId }, [currentNodeId])

  useEffect(() => {
    if (phase === 'playing' && !hasStartedRef.current) {
      hasStartedRef.current = true
      startScenarioRun()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  useEffect(() => {
    // Reset the per-node timeout guard whenever the node changes
    hasTimedOutRef.current = false
    const isRetry = missedNodes.some(m => m.nodeId === currentNodeId)
    if (isRetry) {
      setIsCritical(true)
      setTimeLeft(30)
    } else if (phase === 'playing' && (scenario?.intensity === 'high' || scenario?.mode === 'Simulation')) {
      setIsCritical(true)
      setTimeLeft(15)
    } else {
      setIsCritical(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId, phase, scenario?.mode, scenario?.intensity])

  useEffect(() => {
    if (!isCritical || phase !== 'playing') return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Guard: only fire once per node, even if the interval ticks an extra time
          if (!hasTimedOutRef.current) {
            hasTimedOutRef.current = true
            handleTimeOut()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCritical, phase, currentNodeId])

  const handleTimeOut = () => {
    if (!scenario) return
    // Use the ref to get the actual current node ID — avoids stale closure
    const nodeId = currentNodeIdRef.current
    const currentNode = scenario.nodes[nodeId]
    if (!currentNode) return

    // Check if this is a retry (already in missedNodes) — use functional update to read latest state
    setMissedNodes(prev => {
      const isAlreadyRetry = prev.some(m => m.nodeId === nodeId)
      if (isAlreadyRetry) return prev // don't add again
      return [...prev, {
        nodeId,
        description: currentNode.description,
        choices: currentNode.choices,
      }]
    })

    // Apply timeout penalty — risk up, confidence down, EQ slightly down (panic/freeze response)
    setRiskLevel((prev) => Math.min(100, prev + 15))
    setConfidence((prev) => Math.max(0, prev - 10))
    setEqScore((prev) => Math.max(0, prev - 8))

    // Check retry state to decide navigation
    // We re-read missedNodes via the functional updater approach above,
    // but for navigation we need to know synchronously — use the ref snapshot
    const isAlreadyRetry = missedNodes.some(m => m.nodeId === nodeId)
    if (isAlreadyRetry) {
      setPhase('end')
      return
    }

    // Auto-advance: pick the last (riskiest) choice, or first if only one exists
    const timeoutChoice = currentNode.choices[currentNode.choices.length - 1] || currentNode.choices[0]
    if (!timeoutChoice) return

    const nextId = timeoutChoice.nextNodeId
    if (nextId && scenario.nodes[nextId]) {
      // Use functional update to avoid stale history
      setHistory(h => {
        if (h[h.length - 1] === nextId) return h // already there, don't duplicate
        return [...h, nextId]
      })
      setCurrentNodeId(nextId)
      if (scenario.nodes[nextId].isEnd) setPhase('end')
    } else {
      setPhase('end')
    }
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ff7faa', '#ffc4dd', '#89f7ff', '#00ffa3', '#ffc06b']
    })
  }

  const startScenarioRun = async () => {
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
      const data = await res.json()
      if (data?.runId) setRunId(String(data.runId))
    } catch {
      // silently ignore
    }
  }

  const handleChoice = async (choiceId: string) => {
    if (selectedChoice || !scenario) return
    const currentNode = scenario.nodes[currentNodeId]
    const choice = currentNode.choices.find(c => c.id === choiceId)
    if (!choice) return

    setSelectedChoice(choiceId)
    setPhase('coaching')
    setLoadingCoach(true)

    const next = applyChoiceScoring({ risk: riskLevel, confidence, eq: eqScore }, choice)
    if (choice.riskImpact < 0) triggerConfetti()

    setRiskLevel(next.risk)
    setConfidence(next.confidence)
    setEqScore(next.eq)

    try {
      const res = await fetch('/api/coach/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          nodeId: currentNodeId,
          choiceId,
          choiceText: choice.text,
          riskLevel: next.risk,
        }),
      })
      const data = await res.json()
      setCoaching(data)
    } catch {
      setCoaching({
        feedback: "Your instincts are developing. This decision shows growing situational awareness.",
        hint: choice.aiCoachNote,
        riskDelta: choice.riskImpact,
        eqDelta: choice.eqImpact,
        coachMood: 'encouraging',
      })
    } finally {
      setLoadingCoach(false)
    }
  }

  const continueScenario = () => {
    const currentNode = scenario.nodes[currentNodeId]
    const choice = currentNode.choices.find(c => c.id === selectedChoice)
    if (!choice) return

    const wasRetryingMissed = missedNodes.some(m => m.nodeId === currentNodeId)

    setSelectedChoice(null)
    setCoaching(null)

    if (wasRetryingMissed) {
      // Remove this node from missed list — player has now answered it
      setMissedNodes(prev => prev.filter(m => m.nodeId !== currentNodeId))
      // Apply the choice scoring benefit (optimistic — reward the attempt)
      setPhase('end')
      return
    }

    if (choice.nextNodeId && scenario.nodes[choice.nextNodeId]) {
      const nextNode = scenario.nodes[choice.nextNodeId]
      setCurrentNodeId(choice.nextNodeId)
      setHistory(h => [...h, choice.nextNodeId!])
      if (nextNode.isEnd) setPhase('end')
      else setPhase('playing')
    } else {
      setPhase('end')
    }
  }

  const currentNode = scenario?.nodes[currentNodeId]

  const memoizedInteractionData = useMemo(() => currentNode?.interactionData || {}, [currentNode?.interactionData])
  const memoizedTargets = useMemo(() => memoizedInteractionData.targets || [], [memoizedInteractionData.targets])
  const memoizedPairs = useMemo(() =>
    (memoizedInteractionData.pairs || []).map((p: { key: string; value: string }, idx: number) => ({
      id: `pair-${idx}`,
      left: p.key,
      right: p.value,
    })),
  [memoizedInteractionData.pairs])
  const themeColor = useMemo(() => scenario?.color || '#ff6f91', [scenario?.color])

  const handleInteractionComplete = useCallback((_score?: unknown) => {
    if (currentNode?.choices && currentNode.choices[0]) {
      handleChoice(currentNode.choices[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode?.choices])

  const renderInteraction = () => {
    if (!currentNode || !scenario) return null

    // When time pressure is active, always use fast MCQ buttons —
    // chat / scanner widgets are incompatible with countdown urgency
    const rawType = currentNode.interactionType || (currentNode.choices ? 'mcq' : null)
    const type = isCritical && rawType === 'chat' ? 'mcq' : rawType

    switch (type) {
      case 'red-flag':
        return (
          <RedFlagScanner
            text={memoizedInteractionData.text || currentNode.description}
            targets={memoizedTargets}
            onComplete={handleInteractionComplete}
            color={themeColor}
          />
        )
      case 'match':
        return (
          <MatchTheFollowing
            pairs={memoizedPairs}
            onComplete={handleInteractionComplete}
            color={themeColor}
          />
        )
      case 'whack-a-mole':
        return (
          <WhackAMoleRisk
            onComplete={handleInteractionComplete}
            color={themeColor}
            totalToFind={5}
          />
        )
      case 'strategy-grid':
        return (
          <SafetyGridEngine
            availableBlocks={memoizedTargets.map((t: string) => ({
              type: 'safety',
              label: t.charAt(0).toUpperCase() + t.slice(1),
              icon: t === 'security' ? '👮' : t === 'lights' ? '💡' : t === 'crowd' ? '👥' : '🛡️',
              count: 3
            }))}
            onComplete={handleInteractionComplete}
            color={themeColor}
          />
        )
      case 'chat':
        return (
          <ScenarioChat
  scenarioId={scenario.id}
  npcInitialMessage={memoizedInteractionData.npcInitial || "Hey, can we talk for a moment?"}
  keywords={memoizedInteractionData.keywords || ['no', 'boundary', 'stop']}
  onComplete={handleInteractionComplete}
  color={themeColor}
/>
        )
      case 'avatar-path':
        return (
          <AvatarPath
            safeOption={memoizedInteractionData.safeOption || "Public Area"}
            riskyOption={memoizedInteractionData.riskyOption || "Shortcut"}
            onComplete={(isSafe: boolean) => {
              const choiceType = isSafe ? 'safe' : 'risky'
              const c = currentNode.choices.find(ch => ch.id.toLowerCase().includes(choiceType)) || currentNode.choices[0]
              handleChoice(c.id)
            }}
            color={themeColor}
          />
        )
      case 'mcq':
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentNode.choices.map((choice, i) => (
              <motion.button
                key={choice.id}
                whileHover={{ scale: 1.02, x: 6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChoice(choice.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  background: 'rgba(9, 18, 36, 0.7)',
                  border: '1px solid rgba(255, 176, 214, 0.22)',
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderLeft: '3px solid var(--accent)',
                }}
                className="scenario-choice-btn"
              >
                <div style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(255, 127, 170, 0.15)',
                  border: '1px solid rgba(255, 127, 170, 0.4)',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-orbitron)',
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span style={{
                  fontSize: 15,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-heading)',
                  lineHeight: 1.4,
                }}>
                  {choice.text}
                </span>
              </motion.button>
            ))}
          </div>
        )
    }
  }

  if (!scenario) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <p>Scenario not found</p>
          <Link href="/dashboard" style={{ color: 'var(--accent)', marginTop: 12, display: 'inline-block' }}>Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  // ── MISSED-NODE REPLAY HANDLER ──────────────────────────────────────
  const replayMissedNode = (nodeId: string) => {
    setCurrentNodeId(nodeId)
    setSelectedChoice(null)
    setCoaching(null)
    setPhase('playing')
    setTimeLeft(30) // extra 30s for retry
    setIsCritical(true)
  }

  // ── END SCREEN ────────────────────────────────────────────────────────
  if (phase === 'end') {
    const endNode = scenario.nodes[currentNodeId]
    const endType = endNode?.endType || 'partial'
    const hasMissed = missedNodes.length > 0
    // If any nodes were missed, cap the result at 'partial' max
    const effectiveEndType = hasMissed && endType === 'safe' ? 'partial' : endType
    const endEmoji = effectiveEndType === 'safe' ? '🏆' : effectiveEndType === 'partial' ? '✅' : '📚'
    const endLabel = effectiveEndType === 'safe' ? 'MISSION CLEARED' : effectiveEndType === 'partial' ? 'MISSION COMPLETE' : 'LESSON LEARNED'
    const endColor = effectiveEndType === 'safe' ? '#89f7ff' : effectiveEndType === 'partial' ? '#ffc4dd' : '#ffc06b'

    return (
      <div className="game-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="space-bg" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: 720,
            width: '100%',
            background: 'rgba(9, 18, 36, 0.88)',
            border: '1px solid rgba(255, 176, 214, 0.3)',
            borderRadius: 24,
            padding: '48px 40px',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* End badge */}
          <div style={{ fontSize: 56, marginBottom: 8 }}>{endEmoji}</div>
          <h1 style={{
            fontFamily: 'var(--font-orbitron)',
            fontSize: 'clamp(1.6rem, 5vw, 2.6rem)',
            color: endColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
            textShadow: `0 0 24px ${endColor}66`,
          }}>
            {endLabel}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
            {scenario.title} · {scenario.category}
          </p>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'RISK', value: riskLevel, color: '#ff6f91', warn: riskLevel > 60 },
              { label: 'CONFIDENCE', value: confidence, color: '#89f7ff', warn: false },
              { label: 'EQ', value: eqScore, color: '#ffc4dd', warn: false },
            ].map(m => (
              <div key={m.label} style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${m.color}44`,
                borderRadius: 14,
                padding: '16px 12px',
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)', marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 32, fontFamily: 'var(--font-mono)', color: m.color, fontWeight: 700 }}>{m.value}%</div>
                <div style={{ marginTop: 6, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '100%', width: `${m.value}%`, borderRadius: 999, background: m.color, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Butterfly effect tree */}
          <div style={{
            background: 'rgba(255, 127, 170, 0.06)',
            border: '1px dashed rgba(255, 176, 214, 0.3)',
            borderRadius: 16,
            padding: '20px 16px',
            marginBottom: 32,
          }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)', marginBottom: 14 }}>
              ⟡ BUTTERFLY EFFECT TREE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
              {history.map((id, i) => {
                const wasMissed = missedNodes.some(m => m.nodeId === id)
                const isLast = i === history.length - 1
                const dotColor = wasMissed ? '#ffc06b' : isLast ? endColor : 'rgba(255, 127, 170, 0.2)'
                const borderColor = wasMissed ? '#ffc06b' : isLast ? endColor : 'rgba(255,176,214,0.4)'
                const textColor = wasMissed ? '#ffc06b' : isLast ? '#000' : 'var(--accent)'
                return (
                  <div key={`${id}-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      title={wasMissed ? 'Timed out' : undefined}
                      style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: dotColor,
                      border: `2px solid ${borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: wasMissed ? 14 : 12,
                      fontFamily: 'var(--font-mono)',
                      color: textColor,
                      fontWeight: 700,
                      boxShadow: isLast ? `0 0 14px ${endColor}88` : wasMissed ? '0 0 10px rgba(255,192,107,0.4)' : 'none',
                    }}>
                      {wasMissed ? '⏱' : i + 1}
                    </div>
                    {i < history.length - 1 && (
                      <div style={{ width: 28, height: 2, background: 'rgba(255,176,214,0.25)' }} />
                    )}
                  </div>
                )
              })}
              {/* Greyed out "hidden paths" hint */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 28, height: 2, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '2px dashed rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'rgba(255,255,255,0.2)',
                }}>???</div>
              </div>
            </div>
            <p style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
              Replay to discover hidden paths ✦
            </p>
          </div>

          {/* Coach note */}
          {coaching?.feedback && (
            <div style={{
              background: 'rgba(255,196,221,0.07)',
              border: '1px solid rgba(255,196,221,0.2)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 28,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'var(--font-orbitron)', marginBottom: 6 }}>🤖 COACH NOTE</div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic' }}>{coaching.feedback}</p>
            </div>
          )}

          {/* ── MISSED QUESTIONS PANEL ────────────────────────────── */}
          {hasMissed && (
            <div style={{
              background: 'rgba(255, 192, 107, 0.06)',
              border: '1px solid rgba(255, 192, 107, 0.3)',
              borderRadius: 18,
              padding: '20px 18px',
              marginBottom: 28,
              textAlign: 'left',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}>
                <span style={{ fontSize: 18 }}>⏱</span>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#ffc06b', fontFamily: 'var(--font-orbitron)', textTransform: 'uppercase' }}>
                    Timed Out — {missedNodes.length} Question{missedNodes.length > 1 ? 's' : ''} Missed
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    These questions were skipped due to the time limit. You can attempt each one now.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {missedNodes.map((missed, idx) => (
                  <div key={`${missed.nodeId}-${idx}`} style={{
                    background: 'rgba(9, 18, 36, 0.6)',
                    border: '1px solid rgba(255, 192, 107, 0.2)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: '#ffc06b', fontFamily: 'var(--font-orbitron)', letterSpacing: '0.08em', marginBottom: 4 }}>
                          MISSED · Q{idx + 1}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, marginBottom: 0 }}>
                          {missed.description.length > 120
                            ? missed.description.slice(0, 120) + '…'
                            : missed.description}
                        </p>
                      </div>
                      <button
                        onClick={() => replayMissedNode(missed.nodeId)}
                        style={{
                          flexShrink: 0,
                          padding: '7px 14px',
                          background: 'rgba(255, 192, 107, 0.15)',
                          border: '1px solid rgba(255, 192, 107, 0.5)',
                          borderRadius: 8,
                          color: '#ffc06b',
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'var(--font-orbitron)',
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(255,192,107,0.28)' }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(255,192,107,0.15)' }}
                      >
                        Attempt →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
                Completing missed questions will not affect your final score — but it builds real practice.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <StarBorder as={Link} href="/dashboard" color="#89f7ff" speed="8s" thickness={1.2}>
              ← Return to Base
            </StarBorder>
            <StarBorder as="button" onClick={() => window.location.reload()} color="#ff7faa" speed="6s" thickness={1.2}>
              ↺ Replay Mission
            </StarBorder>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── PLAYING / COACHING ────────────────────────────────────────────────
  const riskColor = riskLevel > 70 ? '#ff4f7a' : riskLevel > 50 ? '#ffc06b' : '#89f7ff'

  return (
    <div className="game-page" style={{ minHeight: '100vh' }}>
      <div className="space-bg" aria-hidden="true" />

      {/* HUD header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(3, 9, 20, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 176, 214, 0.18)',
      }}>
        {/* Brand + scene info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 14px var(--accent)',
              display: 'inline-block', flexShrink: 0
            }} />
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text)' }}>
              SafePath
            </span>
          </div>
          <div style={{ width: 1, height: 20, background: 'rgba(255,176,214,0.2)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-orbitron)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {scenario.category}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {scenario.title}
            </div>
          </div>
        </div>

        {/* Stats HUD */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {[
            { label: 'RISK', value: riskLevel, color: riskColor },
            { label: 'CONF', value: confidence, color: '#89f7ff' },
            { label: 'EQ', value: eqScore, color: '#ffc4dd' },
          ].map(m => (
            <div key={m.label} style={{
              background: 'rgba(9,18,36,0.8)',
              border: `1px solid ${m.color}33`,
              borderRadius: 10,
              padding: '6px 10px',
              textAlign: 'center',
              minWidth: 64,
            }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>{m.label}</div>
              <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.08)', margin: '3px 0' }}>
                <motion.div style={{ height: '100%', borderRadius: 999, background: m.color }} animate={{ width: `${m.value}%` }} transition={{ duration: 0.6 }} />
              </div>
              <div style={{ fontSize: 15, fontFamily: 'var(--font-mono)', color: m.color, fontWeight: 700 }}>{m.value}%</div>
            </div>
          ))}

          <Link href="/dashboard" style={{
            fontSize: 11,
            color: 'var(--muted)',
            textDecoration: 'none',
            padding: '6px 10px',
            border: '1px solid rgba(255,176,214,0.2)',
            borderRadius: 8,
            letterSpacing: '0.06em',
          }}>
            ← EXIT
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1120, margin: '0 auto', paddingTop: 88, padding: '88px 20px 40px' }}>
        <AnimatePresence mode="wait">
          {phase === 'playing' ? (
            <motion.div
              key={currentNodeId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}
              className="scenario-grid"
            >
              {/* Left: scene description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Mode badge / Retry banner */}
                {missedNodes.some(m => m.nodeId === currentNodeId) ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,192,107,0.5)',
                    background: 'rgba(255,192,107,0.1)',
                  }}>
                    <span style={{ fontSize: 16 }}>⏱</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#ffc06b', fontFamily: 'var(--font-orbitron)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        RETRY MODE — Timed-Out Question
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        You have 30 seconds. This attempt won't affect your final score.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,176,214,0.3)',
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      color: 'var(--accent-2)',
                      background: 'rgba(255,127,170,0.08)',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                      {scenario.mode.toUpperCase()} · NODE {history.length}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{elapsed}s elapsed</span>
                  </div>
                )}

                {/* Scene card */}
                <div style={{
                  background: 'rgba(9, 18, 36, 0.82)',
                  border: '1px solid rgba(255, 176, 214, 0.2)',
                  borderRadius: 18,
                  padding: '28px 24px',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,127,170,0.12)',
                    border: '1px solid rgba(255,127,170,0.25)',
                    fontSize: 10,
                    color: 'var(--accent)',
                    letterSpacing: '0.1em',
                    fontFamily: 'var(--font-orbitron)',
                    marginBottom: 16,
                    width: 'fit-content',
                  }}>
                    ◉ INCOMING INTEL
                  </div>
                  <h2 style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text)',
                    lineHeight: 1.55,
                    fontWeight: 500,
                  }}>
                    {currentNode?.description || ''}
                  </h2>
                </div>

                {/* Time pressure bar */}
                {isCritical && (
                  <div style={{
                    background: 'rgba(9,18,36,0.82)',
                    border: `1px solid ${timeLeft < 6 ? '#ff4f7a44' : 'rgba(255,176,214,0.2)'}`,
                    borderRadius: 12,
                    padding: '12px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, letterSpacing: '0.1em', color: timeLeft < 6 ? '#ff4f7a' : missedNodes.some(m => m.nodeId === currentNodeId) ? '#ffc06b' : 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
                        {missedNodes.some(m => m.nodeId === currentNodeId) ? '⏱ RETRY TIMER' : '⏱ TIME PRESSURE'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: timeLeft < 6 ? '#ff4f7a' : '#ffc06b', fontWeight: 700 }}>
                        {timeLeft}s
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, #ffc06b, ${timeLeft < 6 ? '#ff4f7a' : '#ff7faa'})` }}
                        animate={{ width: `${(timeLeft / 15) * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                      />
                    </div>
                  </div>
                )}

                {/* Scenario context hint */}
                <div style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,176,214,0.15)',
                  borderRadius: 10,
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}>
                  {scenario.context}
                </div>
              </div>

              {/* Right: interaction / choices */}
              <div style={{ overflowY: 'auto', maxHeight: '72vh' }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)', textTransform: 'uppercase' }}>
                    Choose your response
                  </span>
                </div>
                {renderInteraction()}
              </div>
            </motion.div>
          ) : (
            /* COACHING PANEL */
            <motion.div
              key="coaching"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ maxWidth: 680, margin: '0 auto', paddingTop: 20 }}
            >
              <div style={{
                background: 'rgba(9, 18, 36, 0.9)',
                border: '1px solid rgba(255, 196, 221, 0.3)',
                borderRadius: 22,
                padding: '36px 32px',
                position: 'relative',
              }}>
                {/* Coach avatar bubble */}
                <div style={{
                  position: 'absolute',
                  top: -22,
                  right: 32,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(9,18,36,0.95)',
                  border: '2px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  boxShadow: '0 0 20px rgba(255,127,170,0.4)',
                }}>
                  🤖
                </div>

                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--accent)', fontFamily: 'var(--font-orbitron)', marginBottom: 16, textTransform: 'uppercase' }}>
                  <DecryptedText text="AI Coach Analysis" animateOn="view" sequential speed={20} />
                </div>

                {loadingCoach ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--muted)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} />
                    <span style={{ fontStyle: 'italic', fontSize: 14 }}>Analysing your strategy…</span>
                  </div>
                ) : (
                  <>
                    <p style={{
                      fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--text)',
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                      borderLeft: '3px solid var(--accent)',
                      paddingLeft: 18,
                      marginBottom: 20,
                    }}>
                      {coaching?.feedback || "Your instincts are developing well."}
                    </p>

                    {coaching?.hint && (
                      <div style={{
                        background: 'rgba(255,127,170,0.06)',
                        border: '1px solid rgba(255,176,214,0.2)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        marginBottom: 20,
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-orbitron)', letterSpacing: '0.08em', marginBottom: 6 }}>💡 COACHING TIP</div>
                        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{coaching.hint}</p>
                      </div>
                    )}

                    {/* Delta pills */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                      {coaching && [
                        { label: 'Risk', delta: coaching.riskDelta, good: coaching.riskDelta < 0, color: '#ff6f91' },
                        { label: 'EQ', delta: coaching.eqDelta, good: coaching.eqDelta > 0, color: '#ffc4dd' },
                      ].map(d => (
                        <span key={d.label} style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          background: d.good ? 'rgba(0,255,163,0.12)' : 'rgba(255,79,122,0.12)',
                          border: `1px solid ${d.good ? '#00ffa344' : '#ff4f7a44'}`,
                          color: d.good ? '#00ffcc' : '#ff7faa',
                        }}>
                          {d.label} {d.delta > 0 ? '+' : ''}{d.delta}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <StarBorder
                    as="button"
                    onClick={continueScenario}
                    disabled={loadingCoach}
                    color="#ffc4dd"
                    speed="7s"
                    thickness={1.2}
                  >
                    {loadingCoach ? 'Analysing…' : 'Next Phase →'}
                  </StarBorder>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .scenario-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .scenario-choice-btn:hover {
          background: rgba(255,127,170,0.1) !important;
          border-color: rgba(255,176,214,0.5) !important;
        }
      `}</style>
    </div>
  )
}
