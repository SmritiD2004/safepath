'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StarBorder from './StarBorder'

interface GridBlock {
  type: 'empty' | 'start' | 'exit' | 'risk' | 'safety'
  label?: string
  icon?: string
  value?: number
  isClicked?: boolean // NEW: Track if tile was clicked
}

interface SafetyGridEngineProps {
  gridSize?: number
  initialRisks?: Array<{ x: number; y: number; label: string }>
  startPos?: { x: number; y: number }
  exitPos?: { x: number; y: number }
  availableBlocks: Array<{ type: string; label: string; icon: string; count: number }>
  onComplete: (safetyScore: number) => void
  color: string
}

const DEFAULT_START = { x: 0, y: 0 }
const DEFAULT_EXIT = { x: 4, y: 4 }
const DEFAULT_RISKS: any[] = []

export default function SafetyGridEngine({
  gridSize = 5,
  initialRisks = DEFAULT_RISKS,
  startPos = DEFAULT_START,
  exitPos = DEFAULT_EXIT,
  availableBlocks,
  onComplete,
  color
}: SafetyGridEngineProps) {
  const [grid, setGrid] = useState<GridBlock[][]>([])
  const [inventory, setInventory] = useState(availableBlocks)
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null)
  const [path, setPath] = useState<{ x: number; y: number }[]>([])
  
  const availableBlocksKey = availableBlocks.map(b => `${b.label}:${b.count}`).join(',')
  useEffect(() => {
    setInventory(availableBlocks)
  }, [availableBlocksKey])

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [message, setMessage] = useState('Place your safety blocks to secure a path.')
  const [movesLeft, setMovesLeft] = useState(12)
  const [currentRisk, setCurrentRisk] = useState(40)

  const isInitialized = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const newGrid: GridBlock[][] = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill(null).map(() => ({ type: 'empty' }))
    )
    
    newGrid[startPos.y][startPos.x] = { type: 'start', label: 'START', icon: '📍' }
    newGrid[exitPos.y][exitPos.x] = { type: 'exit', label: 'EXIT', icon: '🏁' }
    
    initialRisks.forEach(risk => {
      newGrid[risk.y][risk.x] = { type: 'risk', label: risk.label, icon: '⚠️', value: 20 }
    })
    
    setGrid(newGrid)
    setInventory(availableBlocks)
    setMovesLeft(12)
    setCurrentRisk(40)
    setPath([])
    setIsEvaluating(false)
    setMessage('Place your safety blocks to secure a path.')
  }, [gridSize, initialRisks, startPos, exitPos, availableBlocks])

  const handleCellClick = (x: number, y: number) => {
    if (isEvaluating) return
    if (grid[y][x].type === 'start' || grid[y][x].type === 'exit' || grid[y][x].type === 'risk') return
    
    if (selectedBlockIdx === null) {
      if (grid[y][x].type === 'safety') {
        const type = grid[y][x].label
        const newGrid = grid.map(row => [...row])
        newGrid[y][x] = { type: 'empty' }
        setGrid(newGrid)
        
        const newInv = [...inventory]
        const invIdx = newInv.findIndex(b => b.label === type)
        if (invIdx !== -1) newInv[invIdx].count++
        setInventory(newInv)
      }
      return
    }

    const block = inventory[selectedBlockIdx]
    if (block.count <= 0) return

    // NEW: Place block with clicked visual feedback
    const newGrid = grid.map(row => [...row])
    newGrid[y][x] = { type: 'safety', label: block.label, icon: block.icon, value: -15, isClicked: true }
    setGrid(newGrid)

    // Reset click state after animation
    setTimeout(() => {
      setGrid(prev => {
        const updated = prev.map(row => [...row])
        updated[y][x].isClicked = false
        return updated
      })
    }, 300)

    const newInv = [...inventory]
    newInv[selectedBlockIdx].count--
    setInventory(newInv)
    setMovesLeft(prev => prev - 1)
    setCurrentRisk(prev => Math.max(0, prev - 5))
    
    if (newInv[selectedBlockIdx].count === 0) setSelectedBlockIdx(null)
  }

  // FIXED: Properly evaluate path and require safety blocks
  const evaluatePath = async () => {
    setIsEvaluating(true)
    setMessage('Evaluating path safety...')
    
    // NEW: Check if user actually placed any safety blocks
    const hasSafetyBlocks = grid.some(row => row.some(cell => cell.type === 'safety'))
    if (!hasSafetyBlocks) {
      setMessage('❌ You must place safety blocks first!')
      setTimeout(() => {
        setIsEvaluating(false)
        setMessage('Place your safety blocks to secure a path.')
      }, 2000)
      return
    }
    
    const queue: { x: number; y: number; p: {x:number, y:number}[] }[] = [{ ...startPos, p: [startPos] }]
    const visited = new Set<string>()
    let foundPath: {x:number, y:number}[] | null = null

    while(queue.length > 0) {
      const { x, y, p } = queue.shift()!
      const key = `${x},${y}`
      if (visited.has(key)) continue
      visited.add(key)

      if (x === exitPos.x && y === exitPos.y) {
        foundPath = p
        break
      }

      const neighbors = [
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
      ]

      for(const { dx, dy } of neighbors) {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
          const cell = grid[ny][nx]
          // Only allow walking on: START, EXIT, SAFETY blocks (not empty or risk)
          if (cell.type === 'start' || cell.type === 'exit' || cell.type === 'safety') {
             queue.push({ x: nx, y: ny, p: [...p, { x: nx, y: ny }] })
          }
        }
      }
    }

    if (foundPath) {
      setPath(foundPath)
      setMessage('✅ SAFE PATH FOUND!')
      let score = 100 - (foundPath.length * 2)
      
      // FIXED: Properly await before calling onComplete
      setTimeout(() => {
        onComplete(score)
        setIsEvaluating(false)
      }, 1000)
    } else {
      setMessage('❌ NO CLEAR PATH! Re-arrange blocks.')
      setTimeout(() => setIsEvaluating(false), 2000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: -8 }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '10px 15px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', fontWeight: 700 }}>Strategy Moves</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: movesLeft < 3 ? '#ff6f91' : color }}>{movesLeft}</div>
        </div>
        <div style={{ flex: 2, background: 'rgba(0,0,0,0.4)', padding: '10px 15px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Scenario Risk Level</div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <motion.div 
              initial={{ width: '40%' }}
              animate={{ width: `${currentRisk}%` }}
              style={{ height: '100%', background: currentRisk > 60 ? '#ff6f91' : color, borderRadius: 4 }}
            />
          </div>
          <div style={{ fontSize: 10, textAlign: 'right', marginTop: 4, fontWeight: 600 }}>{currentRisk}%</div>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4, letterSpacing: '0.05em', textAlign: 'center' }}>
          {message.toUpperCase()}
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`, 
          gap: 6,
          aspectRatio: '1/1',
          marginTop: 12,
          padding: 4
        }}>
          {grid.map((row, y) => row.map((cell, x) => {
            const isPath = path.some(p => p.x === x && p.y === y)
            return (
              <motion.div
                key={`${x}-${y}`}
                whileHover={(!isEvaluating && movesLeft > 0) ? { scale: 0.96 } : {}}
                animate={cell.isClicked ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}} // NEW: Click animation
                onClick={() => handleCellClick(x, y)}
                style={{
                  background: cell.isClicked // NEW: Highlight clicked tiles
                    ? `${color}66`
                    : isPath
                      ? `${color}44`
                      : cell.type === 'safety'
                        ? `${color}28`
                        : cell.type === 'start'
                          ? 'rgba(0,255,163,0.15)'
                          : cell.type === 'exit'
                            ? 'rgba(255,192,107,0.15)'
                            : cell.type === 'risk'
                              ? 'rgba(255,79,122,0.15)'
                              : 'rgba(255,255,255,0.05)',
                  border: cell.isClicked // NEW: Highlight border on click
                    ? `2px solid ${color}`
                    : isPath
                      ? `2px solid ${color}`
                      : cell.type === 'safety'
                        ? `2px solid ${color}`
                        : cell.type === 'start'
                          ? '1px solid rgba(0,255,163,0.5)'
                          : cell.type === 'exit'
                            ? '1px solid rgba(255,192,107,0.5)'
                            : cell.type === 'risk'
                              ? '1px solid rgba(255,79,122,0.4)'
                              : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: cell.isClicked // NEW: Glow on click
                    ? `0 0 20px ${color}88, inset 0 0 15px ${color}44`
                    : cell.type === 'safety' 
                      ? `0 0 12px ${color}55` 
                      : 'none',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  cursor: (isEvaluating || movesLeft <= 0) ? 'default' : 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {cell.icon}
                {cell.type === 'safety' && (
                   <div style={{ fontSize: 8, position: 'absolute', bottom: 2, textAlign: 'center', width: '100%', opacity: 0.8, color: 'white', fontWeight: 600 }}>
                     {cell.label}
                   </div>
                )}
                {isPath && (
                   <motion.div 
                     initial={{ scale: 0 }} 
                     animate={{ scale: [0, 1.2, 1] }} 
                     transition={{ duration: 0.3 }}
                     style={{ position: 'absolute', width: 6, height: 6, background: color, borderRadius: '50%', boxShadow: `0 0 10px ${color}` }} 
                   />
                )}
              </motion.div>
            )
          }))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {inventory.map((block, idx) => (
          <motion.div
            key={idx}
            whileTap={block.count > 0 ? { scale: 0.95 } : {}}
            onClick={() => block.count > 0 && setSelectedBlockIdx(selectedBlockIdx === idx ? null : idx)}
            style={{
              padding: '12px 8px',
              background: selectedBlockIdx === idx ? `${color}33` : 'rgba(0,0,0,0.2)',
              border: `1px solid ${selectedBlockIdx === idx ? color : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14,
              cursor: block.count > 0 ? 'pointer' : 'default',
              opacity: block.count > 0 ? 1 : 0.3,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              boxShadow: selectedBlockIdx === idx ? `0 4px 15px ${color}33` : 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: 22 }}>{block.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{block.label}</div>
            <div style={{ fontSize: 9, opacity: 0.6 }}>x{block.count}</div>
          </motion.div>
        ))}
      </div>

      <StarBorder as="button" onClick={evaluatePath} disabled={isEvaluating || (movesLeft === 0 && !grid.some(r => r.some(c => c.type === 'safety')))} color={color} style={{ width: '100%', height: '54px' }}>
        {isEvaluating ? 'VERIFYING...' : 'CONFIRM STRATEGY'}
      </StarBorder>
    </div>
  )
}