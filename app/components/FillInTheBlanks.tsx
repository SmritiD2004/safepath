'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface FillInTheBlanksProps {
  sentence: string // "I need you to [____] my [____]."
  options: string[] // ["respect", "space", "boundaries", "help"]
  correctSequence: string[] // ["respect", "boundaries"]
  onComplete: (score: number) => void
  color: string
}

export default function FillInTheBlanks({
  sentence,
  options,
  correctSequence,
  onComplete,
  color
}: FillInTheBlanksProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [isError, setIsError] = useState(false)

  const handleChipClick = (word: string) => {
    if (selected.includes(word)) {
      setSelected(selected.filter(w => w !== word))
      return
    }
    
    if (selected.length < correctSequence.length) {
      const next = [...selected, word]
      setSelected(next)
      
      if (next.length === correctSequence.length) {
        // Verify
        const isCorrect = next.every((w, i) => w === correctSequence[i])
        if (isCorrect) {
          onComplete(100)
        } else {
          setIsError(true)
          setTimeout(() => {
            setIsError(false)
            setSelected([])
          }, 600)
        }
      }
    }
  }

  // Split sentence to show blanks
  const parts = sentence.split('[____]')

  return (
    <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: 16, border: `1px solid ${color}33`, textAlign: 'center' }}>
      <div style={{ marginBottom: 20, fontSize: 13, color: `${color}aa`, fontWeight: 700, textTransform: 'uppercase' }}>
        Practice Assertion: Build the Response
      </div>

      <div style={{ fontSize: 18, lineHeight: 2, marginBottom: 32, fontWeight: 500 }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span style={{ 
                display: 'inline-block', 
                minWidth: 80, 
                borderBottom: `2px solid ${isError ? '#ff6f91' : (selected[i] ? color : 'rgba(255,255,255,0.2)')}`,
                margin: '0 8px',
                color: color,
                textAlign: 'center'
              }}>
                {selected[i] || ''}
              </span>
            )}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {options.map((word, idx) => {
          const isUsed = selected.includes(word)
          return (
            <motion.div
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleChipClick(word)}
              style={{
                padding: '10px 18px',
                background: isUsed ? 'transparent' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isUsed ? 'rgba(255,255,255,0.1)' : color}44`,
                borderRadius: 20,
                fontSize: 14,
                cursor: 'pointer',
                opacity: isUsed ? 0.3 : 1,
                color: isUsed ? 'transparent' : 'white'
              }}
            >
              {word}
            </motion.div>
          )
        })}
      </div>
      
      {isError && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 16, color: '#ff6f91', fontSize: 12, fontWeight: 700 }}
        >
          THAT DOESN&apos;T SEEM RIGHT. TRY AGAIN.
        </motion.div>
      )}
    </div>
  )
}
