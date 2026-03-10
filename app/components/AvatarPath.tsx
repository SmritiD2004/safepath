'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import StarBorder from './StarBorder'

interface AvatarPathProps {
  safeOption: string
  riskyOption: string
  onComplete: (isSafe: boolean) => void
  color: string
}

export default function AvatarPath({
  safeOption,
  riskyOption,
  onComplete,
  color
}: AvatarPathProps) {
  const [selectedSide, setSelectedSide] = useState<'none' | 'left' | 'right'>('none')
  const [isConfirmed, setIsConfirmed] = useState(false)

  const handleConfirm = () => {
    if (selectedSide === 'none') return
    setIsConfirmed(true)
    setTimeout(() => {
      onComplete(selectedSide === 'left') // Left is safe
    }, 1200)
  }

  return (
    <div style={{ padding: '32px', background: 'rgba(0,0,0,0.2)', borderRadius: 24, border: `1px solid ${color}33`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ marginBottom: 24, fontSize: 13, color: `${color}aa`, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
        Story Direction: Choose Your Path
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '220px', position: 'relative', marginBottom: 32 }}>
        {/* The Paths */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} viewBox="0 0 400 200">
          {/* Background Static Path */}
          <path d="M 200 180 Q 200 120 200 100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
          
          {/* Left Safe Path */}
          <motion.path
            d="M 200 180 Q 200 100 50 40"
            fill="none"
            stroke={selectedSide === 'left' ? color : 'rgba(255,255,255,0.05)'}
            strokeWidth={selectedSide === 'left' ? "6" : "3"}
            strokeDasharray="8 8"
            animate={{ 
              strokeDashoffset: [0, -20],
              stroke: selectedSide === 'left' ? color : 'rgba(255,255,255,0.05)'
            }}
            transition={{ 
              strokeDashoffset: { repeat: Infinity, duration: 1, ease: "linear" },
              stroke: { duration: 0.3 }
            }}
          />
          
          {/* Right Risky Path */}
          <motion.path
            d="M 200 180 Q 200 100 350 40"
            fill="none"
            stroke={selectedSide === 'right' ? '#ff6f91' : 'rgba(255,255,255,0.05)'}
            strokeWidth={selectedSide === 'right' ? "6" : "3"}
            strokeDasharray="8 8"
            animate={{ 
              strokeDashoffset: [0, -20],
              stroke: selectedSide === 'right' ? '#ff6f91' : 'rgba(255,255,255,0.05)'
            }}
            transition={{ 
              strokeDashoffset: { repeat: Infinity, duration: 1, ease: "linear" },
              stroke: { duration: 0.3 }
            }}
          />
        </svg>

        {/* Safe Option (Left) */}
        <div 
          onClick={() => !isConfirmed && setSelectedSide('left')}
          style={{ 
            width: '45%', 
            zIndex: 2, 
            cursor: 'pointer',
            textAlign: 'center',
            padding: 16,
            borderRadius: 16,
            background: selectedSide === 'left' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: `1px solid ${selectedSide === 'left' ? color : 'transparent'}`,
            transition: 'all 0.3s'
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>🛡️</div>
          <div style={{ fontSize: 14, color: selectedSide === 'left' ? color : 'var(--text-muted)', fontWeight: 600 }}>{safeOption}</div>
        </div>

        {/* Risky Option (Right) */}
        <div 
          onClick={() => !isConfirmed && setSelectedSide('right')}
          style={{ 
            width: '45%', 
            zIndex: 2, 
            cursor: 'pointer',
            textAlign: 'center',
            padding: 16,
            borderRadius: 16,
            background: selectedSide === 'right' ? 'rgba(255,111,145,0.1)' : 'transparent',
            border: `1px solid ${selectedSide === 'right' ? '#ff6f91' : 'transparent'}`,
            transition: 'all 0.3s'
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 14, color: selectedSide === 'right' ? '#ff6f91' : 'var(--text-muted)', fontWeight: 600 }}>{riskyOption}</div>
        </div>

        {/* The Avatar */}
        <motion.div
          animate={{
            x: selectedSide === 'left' ? -130 : selectedSide === 'right' ? 130 : 0,
            y: selectedSide === 'none' ? 80 : -60,
            scale: isConfirmed ? 0 : 1
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '20px',
            marginLeft: '-24px',
            zIndex: 5,
            pointerEvents: 'none'
          }}
        >
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            border: `3px solid ${selectedSide === 'right' ? '#ff6f91' : color}`,
            boxShadow: `0 0 20px ${selectedSide === 'right' ? '#ff6f9188' : color + '88'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            👩
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <StarBorder
          onClick={handleConfirm}
          disabled={selectedSide === 'none' || isConfirmed}
          color={selectedSide === 'right' ? '#ff6f91' : color}
          style={{ width: '200px', opacity: selectedSide === 'none' ? 0.5 : 1 }}
        >
          {isConfirmed ? 'Moving...' : 'Commit to Choice'}
        </StarBorder>
      </div>
    </div>
  )
}
