'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WhackAMoleRiskProps {
  duration?: number
  spawnRate?: number // ms
  totalToFind: number
  onComplete: (score: number) => void
  color: string
}

export default function WhackAMoleRisk({
  duration = 30000,
  spawnRate = 1200,
  totalToFind,
  onComplete,
  color
}: WhackAMoleRiskProps) {
  const [activeRisks, setActiveRisks] = useState<{ id: number, x: number, y: number }[]>([])
  const [foundCount, setFoundCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(duration / 1000)
  const [isPlaying, setIsPlaying] = useState(true)
  const idCounter = useRef(0)

  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    const spawner = setInterval(() => {
      const newRisk = {
        id: idCounter.current++,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      }
      setActiveRisks(prev => [...prev.slice(-4), newRisk])

      setTimeout(() => {
        setActiveRisks(prev => prev.filter(r => r.id !== newRisk.id))
      }, 2000)
    }, spawnRate)

    return () => {
      clearInterval(timer)
      clearInterval(spawner)
    }
  }, [isPlaying, spawnRate])

  // Completion effect
  useEffect(() => {
    if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false)
      onComplete(foundCount)
    }
  }, [timeLeft, isPlaying, foundCount, onComplete])

  const handleWhack = (id: number) => {
    const nextCount = foundCount + 1
    if (nextCount >= totalToFind) {
      setIsPlaying(false)
      onComplete(nextCount)
    }
    setFoundCount(nextCount)
    setActiveRisks(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div style={{ 
      height: 350, 
      background: 'rgba(0,0,0,0.4)', 
      borderRadius: 16, 
      position: 'relative', 
      overflow: 'hidden',
      border: `1px solid ${color}44`,
      cursor: 'crosshair'
    }}>
      {/* HUD */}
      <div style={{ 
        position: 'absolute', top: 12, left: 12, right: 12, 
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, fontWeight: 700, pointerEvents: 'none'
      }}>
        <div style={{ color: `${color}cc` }}>DETECTION RATIO: {foundCount} / {totalToFind}</div>
        <div style={{ color: timeLeft < 10 ? '#ff6f91' : 'white' }}>SCAN TIME: {timeLeft}s</div>
      </div>

      <AnimatePresence>
        {activeRisks.map(risk => (
          <motion.div
            key={risk.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={(e) => {
               e.stopPropagation()
               handleWhack(risk.id)
            }}
            style={{
              position: 'absolute',
              left: `${risk.x}%`,
              top: `${risk.y}%`,
              width: 50,
              height: 50,
              background: 'radial-gradient(circle, #ff6f91 0%, transparent 70%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              boxShadow: '0 0 20px rgba(255,111,145,0.4)',
              zIndex: 10
            }}
          >
            ⚠️
          </motion.div>
        ))}
      </AnimatePresence>

      {!isPlaying && (
        <div style={{ 
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, zIndex: 20
        }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#00ffa3' }}>AREA SECURED</div>
          <div style={{ opacity: 0.7 }}>Identified {foundCount} threats in time.</div>
        </div>
      )}
    </div>
  )
}
