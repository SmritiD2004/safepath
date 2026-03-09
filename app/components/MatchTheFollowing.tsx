'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

interface MatchPair {
  id: string
  left: string
  right: string
}

interface MatchTheFollowingProps {
  pairs: MatchPair[]
  onComplete: (score: number) => void
  color: string
}

export default function MatchTheFollowing({ pairs, onComplete, color }: MatchTheFollowingProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<string[]>([])
  const shuffledRight = useMemo(
    () => [...pairs.map((p) => p.right)].sort((a, b) => b.localeCompare(a)),
    [pairs]
  )

  const handleLeftClick = (id: string) => {
    if (matches[id]) return // Already matched
    setSelectedLeft(id === selectedLeft ? null : id)
  }

  const handleRightClick = (text: string) => {
    if (!selectedLeft) return

    const correctPair = pairs.find(p => p.id === selectedLeft)
    if (correctPair?.right === text) {
      const newMatches = { ...matches, [selectedLeft]: text }
      setMatches(newMatches)
      setSelectedLeft(null)
      
      if (Object.keys(newMatches).length === pairs.length) {
        onComplete(100)
      }
    } else {
      // Error feedback
      setErrors(prev => [...prev, selectedLeft])
      setTimeout(() => {
        setErrors(prev => prev.filter(e => e !== selectedLeft))
        setSelectedLeft(null)
      }, 500)
    }
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: `${color}cc`, textTransform: 'uppercase', textAlign: 'center' }}>
        Tactical Pairing: Match the Threat to the Defense
      </div>

      <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pairs.map(pair => (
            <motion.div
              key={pair.id}
              onClick={() => handleLeftClick(pair.id)}
              animate={{ 
                x: selectedLeft === pair.id ? 10 : 0,
                borderColor: errors.includes(pair.id) ? '#ff6f91' : (selectedLeft === pair.id ? color : 'rgba(255,255,255,0.1)'),
                opacity: matches[pair.id] ? 0.4 : 1
              }}
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 13,
                cursor: matches[pair.id] ? 'default' : 'pointer',
                textAlign: 'left',
                position: 'relative'
              }}
            >
              {pair.left}
              {matches[pair.id] && <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#00ffa3' }}>✓</div>}
            </motion.div>
          ))}
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shuffledRight.map((text, idx) => {
            const isMatched = Object.values(matches).includes(text)
            return (
              <motion.div
                key={idx}
                whileHover={!isMatched ? { scale: 1.02 } : {}}
                onClick={() => !isMatched && handleRightClick(text)}
                animate={{ 
                  opacity: isMatched ? 0.4 : 1,
                  background: isMatched ? 'transparent' : 'rgba(255,255,255,0.03)'
                }}
                style={{
                  padding: '12px 16px',
                  border: isMatched ? `1px solid ${color}44` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: isMatched ? 'default' : 'pointer',
                  textAlign: 'right'
                }}
              >
                {text}
              </motion.div>
            )
          })}
        </div>
      </div>

      {Object.keys(matches).length > 0 && Object.keys(matches).length < pairs.length && (
         <div style={{ fontSize: 10, opacity: 0.5, textAlign: 'center' }}>
           {pairs.length - Object.keys(matches).length} connections remaining...
         </div>
      )}
    </div>
  )
}
