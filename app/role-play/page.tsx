'use client'

import { FormEvent, useMemo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import SCENARIOS from '@/lib/scenarios'
import StarBorder from '../components/StarBorder'
import DecryptedText from '../components/DecryptedText'
import Avatar from '../components/Avatar'

type ChatMessage = {
  id: string
  speaker: 'USER' | 'NPC' | 'SYSTEM'
  content: string
}

type RolePlaySessionState = {
  id: string
  scenarioId: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  currentRisk: number
  currentConfidence: number
  currentEq: number
  finalRisk?: number | null
  finalConfidence?: number | null
  finalEq?: number | null
  outcome?: string | null
}

export default function RolePlayPage() {
  const { data: authSession, status: authStatus } = useSession()
  const rolePlayScenarios = useMemo(
    () => Object.values(SCENARIOS).filter((s) => s.mode === 'Role-Play'),
    []
  )

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(rolePlayScenarios[0]?.id ?? '')
  const [session, setSession] = useState<RolePlaySessionState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  function speakText(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typeof window === 'undefined' || !window.speechSynthesis) return

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(trimmed)
    speechRef.current = utterance

    // Female voice keywords found across Chrome, Edge, Safari, Android
    const FEMALE_HINTS = ['female', 'woman', 'zira', 'susan', 'hazel', 'moira',
      'samantha', 'victoria', 'karen', 'veena', 'raveena', 'heera',
      'google uk english female', 'google us english']

    const voices = window.speechSynthesis.getVoices()

    const femaleIndian =
      // 1st choice: Indian English female by name hint
      voices.find((v) => v.lang === 'en-IN' && FEMALE_HINTS.some((h) => v.name.toLowerCase().includes(h))) ??
      // 2nd choice: any Indian English voice (usually female on most OS)
      voices.find((v) => v.lang === 'en-IN') ??
      // 3rd choice: any English female by name hint
      voices.find((v) => v.lang.startsWith('en') && FEMALE_HINTS.some((h) => v.name.toLowerCase().includes(h))) ??
      // 4th choice: any English voice
      voices.find((v) => v.lang.startsWith('en'))

    if (femaleIndian) utterance.voice = femaleIndian

    utterance.lang = 'en-IN'
    utterance.rate = 0.95
    utterance.pitch = 1.2  // slightly higher pitch sounds more feminine
    utterance.volume = 1

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        setError(`Voice error: ${e.error}`)
      }
    }

    window.speechSynthesis.speak(utterance)
  }

  async function startSession() {
    if (!selectedScenarioId) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/roleplay/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenarioId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not start role-play')
      setSession(data.session)
      setMessages([
        {
          id: `sys-${Date.now()}`,
          speaker: 'SYSTEM',
          content: 'Role-play session started. Practice setting clear boundaries and prioritizing your safety in each turn.',
        },
      ])
      const scenarioContext = SCENARIOS[selectedScenarioId]?.context
      if (scenarioContext) {
        speakText(scenarioContext)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start role-play')
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    if (!session || !input.trim() || loading || session.status !== 'IN_PROGRESS') return

    const userText = input.trim()
    setInput('')
    setLoading(true)
    setError('')

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      speaker: 'USER',
      content: userText,
    }
    setMessages((prev) => [...prev, userMessage])

    const npcId = `n-${Date.now()}`
    setMessages((prev) => [...prev, { id: npcId, speaker: 'NPC', content: '' }])
    let npcText = ''

    try {
      const res = await fetch(`/api/roleplay/sessions/${session.id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      })
      if (!res.ok || !res.body) {
        const fallback = await fetch(`/api/roleplay/sessions/${session.id}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText }),
        })
        const data = await fallback.json()
        if (!fallback.ok) throw new Error(data?.error || 'Role-play response failed.')
        npcText = String(data.reply || '')
        setMessages((prev) =>
          prev.map((m) => (m.id === npcId ? { ...m, content: npcText } : m))
        )
        setSession((prev) => (prev ? { ...prev, ...data.session } : prev))
        speakText(npcText)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''
        for (const event of events) {
          const line = event.trim()
          if (!line.startsWith('data:')) continue
          const payload = JSON.parse(line.slice(5).trim())
          if (payload.type === 'chunk') {
            npcText = `${npcText}${payload.text ?? ''}`
            setMessages((prev) =>
              prev.map((m) =>
                m.id === npcId ? { ...m, content: `${m.content}${payload.text ?? ''}` } : m
              )
            )
          }
          if (payload.type === 'done') {
            setSession((prev) => (prev ? { ...prev, ...payload.session } : prev))
            speakText(npcText)
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const selectedScenario = selectedScenarioId ? SCENARIOS[selectedScenarioId] : null

  // Compute assertiveness signal from last USER message
  const lastUserMsg = [...messages].reverse().find(m => m.speaker === 'USER')?.content?.toLowerCase() ?? ''
  const assertivenessScore = lastUserMsg
    ? Math.min(100, Math.max(10,
        (lastUserMsg.includes('no') ? 25 : 0) +
        (lastUserMsg.includes('stop') ? 25 : 0) +
        (lastUserMsg.includes('boundary') ? 20 : 0) +
        (lastUserMsg.includes('leave') ? 20 : 0) +
        (lastUserMsg.includes('help') ? 15 : 0) +
        (lastUserMsg.length > 20 ? 10 : 0) -
        (lastUserMsg.includes('maybe') ? 20 : 0) -
        (lastUserMsg.includes('sorry') ? 15 : 0) -
        (lastUserMsg.includes('okay') ? 10 : 0)
      ))
    : 50

  const assertColor = assertivenessScore >= 70 ? '#00ffcc' : assertivenessScore >= 40 ? '#ffc06b' : '#ff4f7a'

  return (
    <div className="game-page" style={{ minHeight: '100vh' }}>
      <div className="space-bg" aria-hidden="true" />

      {/* HUD nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        background: 'rgba(3,9,20,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,176,214,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 14px var(--accent)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text)' }}>
            SafePath Arena
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', paddingLeft: 4 }}>/ Role-Play Mode</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {authStatus === 'authenticated' && (
            <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              <Avatar
                src={authSession?.user?.image}
                alt="Profile"
                size={30}
                fallbackText={(authSession?.user?.name?.[0] ?? 'U').toUpperCase()}
              />
            </Link>
          )}
          <Link href="/dashboard" style={{
            fontSize: 11, color: 'var(--muted)', textDecoration: 'none',
            padding: '6px 12px', border: '1px solid rgba(255,176,214,0.2)', borderRadius: 8, letterSpacing: '0.06em',
          }}>
            ← Dashboard
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 20px 40px' }}>

        {/* Page heading */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 4 }}>Interactive Training</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: 'var(--text)', fontWeight: 800, lineHeight: 1 }}>
            <DecryptedText text="Role-Play Arena" animateOn="view" sequential speed={25} className="" encryptedClassName="" />
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }} className="roleplay-grid">

          {/* ── LEFT: scenario selector ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Scenario cards */}
            <div style={{
              background: 'rgba(9,18,36,0.82)', border: '1px solid rgba(255,176,214,0.2)',
              borderRadius: 18, padding: '18px 16px',
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)', marginBottom: 12 }}>SELECT SCENARIO</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rolePlayScenarios.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => !session?.status || session.status !== 'IN_PROGRESS' ? setSelectedScenarioId(s.id) : undefined}
                    disabled={Boolean(session && session.status === 'IN_PROGRESS')}
                    style={{
                      textAlign: 'left',
                      borderRadius: 12,
                      border: `1px solid ${selectedScenarioId === s.id ? 'var(--accent)' : 'rgba(255,176,214,0.18)'}`,
                      background: selectedScenarioId === s.id ? 'rgba(255,127,170,0.12)' : 'rgba(255,255,255,0.02)',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.category} · {s.duration}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario context */}
            {selectedScenario && (
              <div style={{
                background: 'rgba(9,18,36,0.82)',
                border: '1px solid rgba(255,176,214,0.25)',
                borderLeft: '3px solid var(--accent)',
                borderRadius: 12,
                padding: '16px 18px',
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 10, fontFamily: 'var(--font-orbitron)' }}>SCENARIO BRIEF</div>
                <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7, fontWeight: 400 }}>{selectedScenario.context}</p>
              </div>
            )}

            {/* Start button */}
            <StarBorder
              as="button"
              type="button"
              onClick={startSession}
              disabled={loading || session?.status === 'IN_PROGRESS'}
              color="#ffb0d6"
              speed="7s"
              thickness={1.2}
              style={{ width: '100%' }}
            >
              {session?.status === 'IN_PROGRESS' ? '◉ Session Active' : '▶ Start Session'}
            </StarBorder>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[
                { label: 'Risk', value: session?.currentRisk ?? 40, color: '#ff6f91' },
                { label: 'Conf', value: session?.currentConfidence ?? 50, color: '#89f7ff' },
                { label: 'EQ', value: session?.currentEq ?? 50, color: '#ffc4dd' },
              ].map((m) => (
                <div key={m.label} style={{
                  background: 'rgba(9,18,36,0.7)', border: `1px solid ${m.color}33`,
                  borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-orbitron)', letterSpacing: '0.08em', marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontSize: 20, fontFamily: 'var(--font-mono)', color: m.color, fontWeight: 700 }}>{m.value}%</div>
                  <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${m.value}%`, borderRadius: 999, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Assertiveness meter */}
            {messages.some(m => m.speaker === 'USER') && (
              <div style={{
                background: 'rgba(9,18,36,0.7)', border: `1px solid ${assertColor}33`,
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', fontFamily: 'var(--font-orbitron)', color: 'var(--muted)' }}>ASSERTIVENESS</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: assertColor, fontWeight: 700 }}>{assertivenessScore}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${assertivenessScore}%`,
                    borderRadius: 999, background: assertColor,
                    transition: 'width 0.6s ease, background 0.4s ease',
                    boxShadow: `0 0 10px ${assertColor}88`,
                  }} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                  {assertivenessScore >= 70 ? '✦ Strong boundary language detected' :
                   assertivenessScore >= 40 ? '◈ Moderate – try using firmer language' :
                   '⚠ Weak response detected – assert your boundary'}
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: chat area ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Chat log */}
            <div style={{
              background: 'rgba(9,18,36,0.82)', border: '1px solid rgba(255,176,214,0.2)',
              borderRadius: 18, padding: '16px',
              minHeight: 380, maxHeight: 480, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.5 }}>
                  <div style={{ fontSize: 36 }}>🎭</div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                    Select a scenario and press Start Session to begin practicing.
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex',
                    flexDirection: m.speaker === 'USER' ? 'row-reverse' : 'row',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}>
                    {/* Avatar dot */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                      background: m.speaker === 'USER' ? 'rgba(255,127,170,0.2)' :
                                  m.speaker === 'NPC' ? 'rgba(9,18,36,0.8)' : 'rgba(255,192,107,0.15)',
                      border: `1px solid ${m.speaker === 'USER' ? 'rgba(255,127,170,0.4)' :
                                          m.speaker === 'NPC' ? 'rgba(137,247,255,0.3)' : 'rgba(255,192,107,0.3)'}`,
                    }}>
                      {m.speaker === 'USER' ? '👤' : m.speaker === 'NPC' ? '🎭' : 'ℹ'}
                    </div>
                    {/* Bubble */}
                    <div style={{
                      maxWidth: '78%',
                      padding: '10px 14px',
                      borderRadius: m.speaker === 'USER' ? '14px 14px 4px 14px' :
                                   m.speaker === 'NPC' ? '14px 14px 14px 4px' : '12px',
                      background: m.speaker === 'USER' ? 'rgba(255,127,170,0.12)' :
                                  m.speaker === 'NPC' ? 'rgba(9,18,36,0.6)' : 'rgba(255,192,107,0.08)',
                      border: `1px solid ${m.speaker === 'USER' ? 'rgba(255,127,170,0.25)' :
                                           m.speaker === 'NPC' ? 'rgba(137,247,255,0.15)' : 'rgba(255,192,107,0.2)'}`,
                    }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)', marginBottom: 4 }}>
                        {m.speaker}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                        {m.content || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>typing…</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10 }}>
              <input
                style={{
                  flex: 1, padding: '13px 16px',
                  background: 'rgba(9,18,36,0.9)',
                  border: '1px solid rgba(255,176,214,0.25)',
                  borderRadius: 12,
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
                placeholder={session?.status === 'IN_PROGRESS' ? "Type your response and assert your boundary…" : "Start a session first…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!session || session.status !== 'IN_PROGRESS' || loading}
              />
              <StarBorder
                as="button"
                type="submit"
                color="#ffc4dd"
                speed="8s"
                thickness={1.2}
                disabled={!session || session.status !== 'IN_PROGRESS' || loading}
              >
                {loading ? '…' : 'Send'}
              </StarBorder>
            </form>

            {/* Completed banner */}
            {session?.status === 'COMPLETED' && (
              <div style={{
                background: 'rgba(0,255,163,0.07)', border: '1px solid rgba(0,255,163,0.25)',
                borderRadius: 14, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#00ffcc', fontFamily: 'var(--font-orbitron)', marginBottom: 6 }}>
                  ✦ SESSION COMPLETE
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Outcome: <span style={{ color: 'var(--text)' }}>{session.outcome ?? 'partial'}</span>
                  {' · '}Confidence: <span style={{ color: '#89f7ff' }}>{session.finalConfidence ?? session.currentConfidence}%</span>
                  {' · '}EQ: <span style={{ color: '#ffc4dd' }}>{session.finalEq ?? session.currentEq}%</span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <StarBorder as={Link} href="/dashboard" color="#89f7ff" speed="8s" thickness={1.2}>
                    Return to Base
                  </StarBorder>
                  <StarBorder
                    as="button"
                    type="button"
                    onClick={() => { setSession(null); setMessages([]) }}
                    color="#ffb0d6"
                    speed="7s"
                    thickness={1.2}
                  >
                    Try Again
                  </StarBorder>
                </div>
              </div>
            )}

            {error && (
              <p style={{ color: '#ff4f7a', fontSize: 13, padding: '8px 12px', background: 'rgba(255,79,122,0.08)', borderRadius: 8, border: '1px solid rgba(255,79,122,0.2)' }}>
                ⚠ {error}
              </p>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .roleplay-grid {
            grid-template-columns: 1fr !important;
          }
        }
        input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(255,127,170,0.12);
        }
      `}</style>
    </div>
  )
}
