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
  keywords: string[] // required assertive words to "pass"
  onComplete: (score: number) => void
  color: string
}

export default function ScenarioChat({
  npcInitialMessage,
  keywords,
  onComplete,
  color
}: ScenarioChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', speaker: 'NPC', content: npcInitialMessage }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [npcTyping, setNpcTyping] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isSubmitting) return

    const userText = inputValue.trim()
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      speaker: 'USER',
      content: userText
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSubmitting(true)
    setNpcTyping(true)
    setFeedback(null)

    // Validation logic
    const lowerText = userText.toLowerCase()
    const matchedKeywords = keywords.filter(k => lowerText.includes(k.toLowerCase()))
    const passThreshold = Math.ceil(keywords.length * 0.4)

    setTimeout(() => {
      setNpcTyping(false)
      if (matchedKeywords.length >= passThreshold) {
        setMessages(prev => [...prev, {
          id: `npc-response-${Date.now()}`,
          speaker: 'NPC',
          content: "I understand. I'll respect that boundary and back off."
        }])
        setTimeout(() => {
          onComplete(100)
        }, 1500)
      } else {
        setMessages(prev => [...prev, {
          id: `npc-fail-${Date.now()}`,
          speaker: 'NPC',
          content: "Wait, I didn't quite get that. What are you trying to say?"
        }])
        setFeedback("Be more direct. Use words like: " + keywords.slice(0, 3).join(', '))
        setIsSubmitting(false)
      }
    }, 1500)
  }

  const isNpcTyping = npcTyping

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
          {isNpcTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 16px',
                borderRadius: '18px 18px 18px 2px',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                gap: 4
              }}
            >
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 4, height: 4, background: 'white', borderRadius: '50%' }} />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 4, height: 4, background: 'white', borderRadius: '50%' }} />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 4, height: 4, background: 'white', borderRadius: '50%' }} />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, position: 'relative' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your assertive response..."
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
            transition: 'transform 0.2s'
          }}
          onMouseDown={(e) => (e.target as any).style.transform = 'scale(0.9)'}
          onMouseUp={(e) => (e.target as any).style.transform = 'scale(1)'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: '110%',
              left: 0,
              right: 0,
              background: '#7b1d3a',
              color: 'white',
              fontSize: 12,
              padding: '8px 12px',
              borderRadius: 10,
              textAlign: 'center',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              border: '1px solid #ff6f9144'
            }}
          >
            {feedback}
          </motion.div>
        )}
      </form>
    </div>
  )
}
