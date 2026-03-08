'use client'

import { useState, useMemo, useEffect } from 'react'

interface RedFlagScannerProps {
  text: string
  targets: string[]          // e.g. ['brand ambassador', 'scout', 'fashion']
  onComplete: (score: number) => void
  color?: string
}

type TokenKind = 'word' | 'space' | 'punct'

interface Token {
  id: string
  raw: string          // original text including spacing/punct
  display: string      // what shows on screen
  kind: TokenKind
  targetIndex: number  // -1 = not part of any target, >=0 = belongs to targets[targetIndex]
  posInTarget: number  // position within the target phrase (0 = first word)
  targetLength: number // total words in that target phrase
}

/** Split text into word/space/punct tokens, tagging which multi-word target each belongs to */
function tokenize(text: string, targets: string[]): Token[] {
  // Normalise targets to lowercase for matching
  const normTargets = targets.map(t => t.toLowerCase().trim())

  // Tokenise into raw pieces (words + spaces + punctuation)
  const rawTokens = text.split(/(\s+|[^\w\s]+)/).filter(Boolean)

  // Build display tokens
  const tokens: Token[] = rawTokens.map((raw, i) => ({
    id: `tok-${i}`,
    raw,
    display: raw,
    kind: /^\s+$/.test(raw) ? 'space' : /^[^\w]+$/.test(raw) ? 'punct' : 'word',
    targetIndex: -1,
    posInTarget: 0,
    targetLength: 1,
  }))

  // For each target phrase, find matching word sequences and tag them
  normTargets.forEach((target, tIdx) => {
    const targetWords = target.split(/\s+/)
    const wordTokens = tokens.filter(t => t.kind === 'word')

    // Scan word tokens for a run matching the target phrase
    for (let i = 0; i <= wordTokens.length - targetWords.length; i++) {
      const run = wordTokens.slice(i, i + targetWords.length)
      const match = run.every((tok, j) =>
        tok.display.toLowerCase().replace(/[^\w]/g, '') === targetWords[j].replace(/[^\w]/g, '')
      )
      if (match) {
        run.forEach((tok, j) => {
          const realTok = tokens.find(t => t.id === tok.id)
          if (realTok) {
            realTok.targetIndex = tIdx
            realTok.posInTarget = j
            realTok.targetLength = targetWords.length
          }
        })
        break // only tag first occurrence
      }
    }
  })

  return tokens
}

export default function RedFlagScanner({ text, targets, onComplete, color = '#ff6f91' }: RedFlagScannerProps) {
  // Which targets have been fully found (all words clicked)
  const [foundTargets, setFoundTargets] = useState<Set<number>>(new Set())
  // Which individual token IDs have been clicked
  const [clickedTokenIds, setClickedTokenIds] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState(false)
  const [shakeId, setShakeId] = useState<string | null>(null)

  const tokens = useMemo(() => tokenize(text, targets), [text, targets])

  // Group tokens by targetIndex so we can tell when a whole phrase is clicked
  const targetTokenGroups = useMemo(() => {
    const groups: Record<number, string[]> = {}
    tokens.forEach(tok => {
      if (tok.targetIndex >= 0) {
        if (!groups[tok.targetIndex]) groups[tok.targetIndex] = []
        groups[tok.targetIndex].push(tok.id)
      }
    })
    return groups
  }, [tokens])

  const handleTokenClick = (tok: Token) => {
    if (completed) return
    if (tok.kind !== 'word') return

    // Not part of any target — shake feedback
    if (tok.targetIndex === -1) {
      setShakeId(tok.id)
      setTimeout(() => setShakeId(null), 500)
      return
    }

    // Already found this whole target
    if (foundTargets.has(tok.targetIndex)) return

    // Mark this token as clicked
    const nextClicked = new Set(clickedTokenIds)
    nextClicked.add(tok.id)
    setClickedTokenIds(nextClicked)

    // Check if ALL tokens in this target group are now clicked
    const group = targetTokenGroups[tok.targetIndex] || []
    const allClicked = group.every(id => nextClicked.has(id))
    if (allClicked) {
      const nextFound = new Set(foundTargets)
      nextFound.add(tok.targetIndex)
      setFoundTargets(nextFound)

      // All targets found → complete
      if (nextFound.size >= targets.length) {
        setCompleted(true)
        setTimeout(() => onComplete(nextFound.size), 600)
      }
    }
  }

  const getTokenStyle = (tok: Token): React.CSSProperties => {
    const base: React.CSSProperties = {
      cursor: tok.kind === 'word' && tok.targetIndex >= 0 && !foundTargets.has(tok.targetIndex) ? 'pointer' : 'default',
      borderRadius: 4,
      padding: tok.kind === 'word' ? '1px 2px' : undefined,
      transition: 'all 0.2s ease',
      display: 'inline',
    }

    if (tok.kind !== 'word') return base

    if (foundTargets.has(tok.targetIndex)) {
      // Fully found — bright neon green highlight
      return {
        ...base,
        background: 'rgba(0,255,163,0.2)',
        color: '#00ffcc',
        borderBottom: '2px solid #00ffcc',
        textDecoration: 'none',
        fontWeight: 700,
      }
    }

    if (clickedTokenIds.has(tok.id) && tok.targetIndex >= 0) {
      // Partially clicked (multi-word phrase, first word found)
      return {
        ...base,
        background: 'rgba(255,192,107,0.15)',
        color: '#ffc06b',
        borderBottom: '2px solid #ffc06b',
      }
    }

    if (tok.targetIndex >= 0) {
      // Unclicked target word — subtle underline hint
      return {
        ...base,
        borderBottom: '1px dashed rgba(255,176,214,0.4)',
        color: 'var(--text)',
      }
    }

    return { ...base, color: 'var(--text)' }
  }

  const totalTargets = targets.length
  const foundCount = foundTargets.size

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: color,
        fontFamily: 'var(--font-orbitron)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: completed ? '#00ffcc' : color,
          boxShadow: `0 0 10px ${completed ? '#00ffcc' : color}`,
          display: 'inline-block',
          animation: completed ? 'none' : 'scanPulse 1.4s ease-in-out infinite',
        }} />
        {completed ? 'ALL RED FLAGS IDENTIFIED' : `SCANNER ACTIVE — IDENTIFY THE ${totalTargets} RED FLAGS`}
      </div>

      {/* Scan text card */}
      <div style={{
        background: 'rgba(9,18,36,0.82)',
        border: `1px solid ${completed ? 'rgba(0,255,163,0.3)' : 'rgba(255,176,214,0.2)'}`,
        borderRadius: 14,
        padding: '20px 18px',
        fontSize: 15,
        lineHeight: 1.75,
        transition: 'border-color 0.4s ease',
        userSelect: 'none',
      }}>
        {tokens.map(tok => (
          <span
            key={tok.id}
            onClick={() => handleTokenClick(tok)}
            style={{
              ...getTokenStyle(tok),
              animation: shakeId === tok.id ? 'tokenShake 0.4s ease' : undefined,
            }}
          >
            {tok.display}
          </span>
        ))}
      </div>

      {/* Progress indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {targets.map((_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: `2px solid ${foundTargets.has(i) ? '#00ffcc' : 'rgba(255,176,214,0.3)'}`,
                background: foundTargets.has(i) ? '#00ffcc' : 'transparent',
                boxShadow: foundTargets.has(i) ? '0 0 10px #00ffcc' : 'none',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
        <span style={{
          fontSize: 12,
          color: foundCount === totalTargets ? '#00ffcc' : 'var(--muted)',
          fontFamily: 'var(--font-mono)',
          transition: 'color 0.3s ease',
        }}>
          {foundCount} / {totalTargets} {foundCount === totalTargets ? '✓ Complete' : 'Threats Located'}
        </span>
      </div>

      {/* Hint for multi-word targets */}
      {!completed && (
        <p style={{
          fontSize: 11,
          color: 'rgba(210,170,199,0.5)',
          fontStyle: 'italic',
          marginTop: -8,
        }}>
          Tap all words in a red flag phrase to identify it.
        </p>
      )}

      <style>{`
        @keyframes scanPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes tokenShake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-4px); }
          40%  { transform: translateX(4px); }
          60%  { transform: translateX(-3px); }
          80%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
