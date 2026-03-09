'use client'

import { FormEvent, useMemo, useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function GlobalChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'SafePath Assistant is ready. Ask about safety scenarios, boundaries, role-play practice, or using features in this app.',
    },
  ])

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-8),
        }),
      })

      const data = await res.json().catch(() => null)
      const reply =
        typeof data?.reply === 'string' && data.reply.trim()
          ? data.reply.trim()
          : 'I can help with SafePath topics like scenarios, role-play, and safety decisions.'

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Network issue. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        zIndex: 1200,
      }}
    >
      {open ? (
        <div
          style={{
            width: 'min(360px, calc(100vw - 24px))',
            height: 'min(520px, calc(100vh - 90px))',
            borderRadius: 16,
            overflow: 'hidden',
            background: 'rgba(7, 14, 28, 0.97)',
            border: '1px solid rgba(137, 247, 255, 0.35)',
            boxShadow: '0 16px 44px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: '1px solid rgba(137, 247, 255, 0.2)',
              background: 'linear-gradient(90deg, rgba(137,247,255,0.14), rgba(255,127,170,0.14))',
            }}
          >
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 12, color: 'var(--text)', letterSpacing: '0.06em' }}>
              SAFEPATH ASSIST
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
              }}
              aria-label="Close chat widget"
            >
              x
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '9px 11px',
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: 'var(--text)',
                  background:
                    m.role === 'user'
                      ? 'linear-gradient(120deg, rgba(255,127,170,0.35), rgba(255,196,221,0.25))'
                      : 'rgba(255,255,255,0.08)',
                  border:
                    m.role === 'user'
                      ? '1px solid rgba(255,176,214,0.45)'
                      : '1px solid rgba(137,247,255,0.25)',
                }}
              >
                {m.content}
              </div>
            ))}
            {loading ? (
              <div
                style={{
                  alignSelf: 'flex-start',
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                thinking...
              </div>
            ) : null}
          </div>

          <form
            onSubmit={onSubmit}
            style={{
              display: 'flex',
              gap: 8,
              padding: 10,
              borderTop: '1px solid rgba(137, 247, 255, 0.2)',
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about SafePath safety topics..."
              style={{
                flex: 1,
                borderRadius: 10,
                border: '1px solid rgba(255,176,214,0.35)',
                background: 'rgba(255,255,255,0.07)',
                color: 'var(--text)',
                padding: '10px 11px',
                fontSize: 13,
                outline: 'none',
              }}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!canSend}
              style={{
                border: '1px solid rgba(137,247,255,0.5)',
                borderRadius: 10,
                background: canSend ? 'rgba(137,247,255,0.2)' : 'rgba(137,247,255,0.08)',
                color: canSend ? 'var(--text)' : 'var(--muted)',
                padding: '0 14px',
                fontFamily: 'var(--font-orbitron)',
                fontSize: 11,
                letterSpacing: '0.06em',
                cursor: canSend ? 'pointer' : 'not-allowed',
              }}
            >
              SEND
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            borderRadius: 999,
            border: '1px solid rgba(255, 176, 214, 0.45)',
            background: 'linear-gradient(135deg, rgba(137,247,255,0.25), rgba(255,127,170,0.25))',
            color: 'var(--text)',
            padding: '10px 14px',
            fontFamily: 'var(--font-orbitron)',
            fontSize: 11,
            letterSpacing: '0.07em',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            cursor: 'pointer',
          }}
          aria-label="Open SafePath chat widget"
        >
          CHAT ASSIST
        </button>
      )}
    </div>
  )
}

