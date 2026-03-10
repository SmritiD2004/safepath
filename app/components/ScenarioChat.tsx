'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  speaker: 'NPC' | 'USER'
  content: string
}

interface ScenarioChatProps {
  npcInitialMessage: string
  keywords: string[]   // kept in props signature so ScenarioCore doesn't need changes, but ignored
  onComplete: (score: number) => void
  color: string
  scenarioId: string   // needed to call the right NPC persona
}

export default function ScenarioChat({
  npcInitialMessage,
  onComplete,
  color,
  scenarioId,
}: ScenarioChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', speaker: 'NPC', content: npcInitialMessage }
  ])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [npcTyping, setNpcTyping] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, npcTyping])

  // Start a roleplay session on mount so we have a sessionId for API calls
  useEffect(() => {
    if (!scenarioId) return
    fetch('/api/roleplay/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data?.session?.id) setSessionId(data.session.id)
      })
      .catch(() => {/* silently fail — will use fallback */})
  }, [scenarioId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isSubmitting) return

    const userText = inputValue.trim()
    setInputValue('')
    setIsSubmitting(true)
    setNpcTyping(true)

    // Add user message immediately
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      speaker: 'USER',
      content: userText,
    }])

    const newTurnCount = turnCount + 1
    setTurnCount(newTurnCount)

    try {
      // Call the real AI roleplay API
      const endpoint = sessionId
        ? `/api/roleplay/sessions/${sessionId}/message`
        : null

      let npcReply = ''
      let shouldEnd = false
      let score = 50

      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText }),
        })
        if (res.ok) {
          const data = await res.json()
          npcReply = data.reply || ''
          shouldEnd = data.session?.status === 'COMPLETED' || newTurnCount >= 8
          // Map confidence delta to a 0-100 score
          const conf = data.session?.currentConfidence ?? 50
          score = Math.round(conf)
        }
      }

      // Fallback if API failed
      if (!npcReply) {
        npcReply = "I see. Go on."
      }

      setNpcTyping(false)
      setMessages(prev => [...prev, {
        id: `npc-${Date.now()}`,
        speaker: 'NPC',
        content: npcReply,
      }])
      setIsSubmitting(false)

      if (shouldEnd) {
        setTimeout(() => onComplete(score), 1200)
      }
    } catch {
      setNpcTyping(false)
      setMessages(prev => [...prev, {
        id: `npc-err-${Date.now()}`,
        speaker: 'NPC',
        content: "I see. What do you mean by that?",
      }])
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      padding: '20px',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: 20,
      border: `1px solid ${color}33`,
      display: 'flex',
      flexDirection: 'column',
      height: '400px'
    }}>
      <div style={{
        marginBottom: 16,
        fontSize: 11,
        color: `${color}aa`,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Interactive Conversation
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingRight: 8
      }}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                alignSelf: m.speaker === 'USER' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: m.speaker === 'USER' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                background: m.speaker === 'USER' ? color : 'rgba(255,255,255,0.08)',
                color: m.speaker === 'USER' ? 'white' : 'var(--text)',
                fontSize: 14,
                lineHeight: 1.5,
                boxShadow: m.speaker === 'USER' ? `0 4px 15px ${color}44` : 'none',
                border: m.speaker === 'NPC' ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}
            >
              {m.content}
            </motion.div>
          ))}

          {npcTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 16px',
                borderRadius: '18px 18px 18px 2px',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                gap: 4,
                alignItems: 'center'
              }}
            >
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay }}
                  style={{ width: 4, height: 4, background: 'white', borderRadius: '50%' }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your response…"
          disabled={isSubmitting}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 25,
            padding: '12px 20px',
            color: 'white',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = color}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSubmitting}
          style={{
            background: color,
            border: 'none',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (inputValue.trim() && !isSubmitting) ? 'pointer' : 'default',
            opacity: (inputValue.trim() && !isSubmitting) ? 1 : 0.5,
            flexShrink: 0,
          }}
          onMouseDown={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'}
          onMouseUp={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  )
}
