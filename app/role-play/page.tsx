'use client'

import { FormEvent, useMemo, useState } from 'react'
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
          content: 'Role-play started. Set a clear boundary and prioritize your safety in each turn.',
        },
      ])
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

        setMessages((prev) =>
          prev.map((m) => (m.id === npcId ? { ...m, content: String(data.reply || '') } : m))
        )
        setSession((prev) => (prev ? { ...prev, ...data.session } : prev))
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
            setMessages((prev) =>
              prev.map((m) =>
                m.id === npcId ? { ...m, content: `${m.content}${payload.text ?? ''}` } : m
              )
            )
          }
          if (payload.type === 'done') {
            setSession((prev) => (prev ? { ...prev, ...payload.session } : prev))
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Product Depth</div>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: 32 }}>
              <DecryptedText
                text="Role-Play Mode"
                animateOn="view"
                sequential
                speed={30}
                className=""
                encryptedClassName=""
              />
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {authStatus === 'authenticated' && (
              <Link
                href="/settings"
                title="Profile settings"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <Avatar
                  src={authSession?.user?.image}
                  alt="Profile avatar"
                  size={36}
                  fallbackText={(authSession?.user?.name?.[0] ?? 'U').toUpperCase()}
                />
              </Link>
            )}
            <Link href="/dashboard" className="btn-ghost" style={{ fontSize: 12, padding: '8px 12px' }}>
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '2fr 1fr', alignItems: 'end' }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Role-Play Scenario
              <select
                value={selectedScenarioId}
                onChange={(ev) => setSelectedScenarioId(ev.target.value)}
                style={{ marginTop: 6, width: '100%' }}
                disabled={Boolean(session && session.status === 'IN_PROGRESS')}
              >
                {rolePlayScenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <StarBorder
              as="button"
              type="button"
              onClick={startSession}
              disabled={loading || (session?.status === 'IN_PROGRESS')}
              color="#ffb0d6"
              speed="7s"
              style={{ width: '100%' }}
            >
              {session?.status === 'IN_PROGRESS' ? 'Session Active' : 'Start Session'}
            </StarBorder>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
              gap: 8,
              marginTop: 10,
            }}
          >
            {rolePlayScenarios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedScenarioId(s.id)}
                disabled={Boolean(session && session.status === 'IN_PROGRESS')}
                style={{
                  textAlign: 'left',
                  borderRadius: 12,
                  border: `1px solid ${selectedScenarioId === s.id ? 'var(--wine)' : 'var(--border)'}`,
                  background: selectedScenarioId === s.id ? 'rgba(255,111,145,0.16)' : 'rgba(255,255,255,0.03)',
                  padding: '10px 11px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.category} · {s.duration}
                </div>
              </button>
            ))}
          </div>
          {selectedScenario && (
            <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>{selectedScenario.context}</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Risk', value: session?.currentRisk ?? 40, color: '#ff8ab2' },
            { label: 'Confidence', value: session?.currentConfidence ?? 50, color: '#ff5b90' },
            { label: 'EQ', value: session?.currentEq ?? 50, color: '#ffc4dd' },
          ].map((m) => (
            <div key={m.label} className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
              <div style={{ color: m.color, fontWeight: 800, fontSize: 24 }}>{m.value}%</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ minHeight: 340, maxHeight: 460, overflowY: 'auto', display: 'grid', gap: 8, paddingRight: 4 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background:
                    m.speaker === 'USER'
                      ? 'rgba(123,29,58,0.10)'
                      : m.speaker === 'NPC'
                        ? 'var(--bg-card)'
                        : 'var(--bg-2)',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{m.speaker}</div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>{m.content || '...'}</div>
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Start a role-play session to begin practicing dialog turns.
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input
              className="input-field"
              placeholder="Type your response..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!session || session.status !== 'IN_PROGRESS' || loading}
            />
            <StarBorder
              as="button"
              type="submit"
              color="#ffc4dd"
              speed="8s"
              disabled={!session || session.status !== 'IN_PROGRESS' || loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </StarBorder>
          </form>
        </div>

        {session?.status === 'COMPLETED' && (
          <div className="card" style={{ padding: 14, marginTop: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', color: 'var(--wine)', fontWeight: 800 }}>
              Role-Play Completed
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Outcome: {session.outcome ?? 'partial'} | Final Confidence: {session.finalConfidence ?? session.currentConfidence}% | Final EQ: {session.finalEq ?? session.currentEq}% | Final Risk: {session.finalRisk ?? session.currentRisk}%
            </div>
          </div>
        )}

        {error && <p style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  )
}
