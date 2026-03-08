'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

interface DecryptedTextProps extends HTMLMotionProps<'span'> {
  text: string
  speed?: number
  maxIterations?: number
  sequential?: boolean
  revealDirection?: 'start' | 'end' | 'center'
  useOriginalCharsOnly?: boolean
  characters?: string
  className?: string
  encryptedClassName?: string
  parentClassName?: string
  animateOn?: 'view' | 'hover' | 'both'
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-[var(--wine-light)] opacity-70',
  animateOn = 'hover',
  ...props
}: DecryptedTextProps) {
  const [mounted, setMounted] = useState(false)
  const [displayText, setDisplayText] = useState<string>(text)
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const [isScrambling, setIsScrambling] = useState<boolean>(false)
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
  const [hasAnimated, setHasAnimated] = useState<boolean>(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getNextIndex = useCallback((revealedSet: Set<number>): number => {
    const textLength = text.length
    switch (revealDirection) {
      case 'start':
        return revealedSet.size
      case 'end':
        return textLength - 1 - revealedSet.size
      case 'center': {
        const middle = Math.floor(textLength / 2)
        const offset = Math.floor(revealedSet.size / 2)
        const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1
        if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) return nextIndex
        for (let i = 0; i < textLength; i++) {
          if (!revealedSet.has(i)) return i
        }
        return 0
      }
      default:
        return revealedSet.size
    }
  }, [text.length, revealDirection])

  const shuffleText = useCallback((originalText: string, currentRevealed: Set<number>): string => {
    const availableChars = useOriginalCharsOnly
      ? Array.from(new Set(originalText.split(''))).filter((char) => char !== ' ')
      : characters.split('')

    if (useOriginalCharsOnly) {
      const positions = originalText.split('').map((char, i) => ({
        char,
        isSpace: char === ' ',
        index: i,
        isRevealed: currentRevealed.has(i),
      }))

      const nonSpaceChars = positions.filter((p) => !p.isSpace && !p.isRevealed).map((p) => p.char)

      for (let i = nonSpaceChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[nonSpaceChars[i], nonSpaceChars[j]] = [nonSpaceChars[j], nonSpaceChars[i]]
      }

      let charIndex = 0
      return positions
        .map((p) => {
          if (p.isSpace) return ' '
          if (p.isRevealed) return originalText[p.index]
          return nonSpaceChars[charIndex++]
        })
        .join('')
    }

    return originalText
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' '
        if (currentRevealed.has(i)) return originalText[i]
        return availableChars[Math.floor(Math.random() * availableChars.length)]
      })
      .join('')
  }, [useOriginalCharsOnly, characters])

  useEffect(() => {
    if (!mounted) return

    let interval: ReturnType<typeof setInterval>
    let currentIteration = 0

    if (isHovering) {
      setIsScrambling(true)
      interval = setInterval(() => {
        setRevealedIndices((prevRevealed) => {
          const newRevealed = new Set(prevRevealed)
          
          if (sequential) {
            if (newRevealed.size < text.length) {
              const nextIndex = getNextIndex(newRevealed)
              newRevealed.add(nextIndex)
              setDisplayText(shuffleText(text, newRevealed))
              return newRevealed
            }
            clearInterval(interval)
            setIsScrambling(false)
            return prevRevealed
          }

          setDisplayText(shuffleText(text, newRevealed))
          currentIteration++
          if (currentIteration >= maxIterations) {
            clearInterval(interval)
            setIsScrambling(false)
            setDisplayText(text)
          }
          return prevRevealed
        })
      }, speed)
    } else {
      setDisplayText(text)
      setRevealedIndices(new Set())
      setIsScrambling(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [mounted, isHovering, text, speed, maxIterations, sequential, getNextIndex, shuffleText])

  useEffect(() => {
    if (!mounted || hasAnimated || (animateOn !== 'view' && animateOn !== 'both')) return

    const currentRef = containerRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsHovering(true)
            setHasAnimated(true)
            observer.unobserve(currentRef)
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(currentRef)
    return () => observer.disconnect()
  }, [mounted, animateOn, hasAnimated])

  const hoverProps =
    mounted && (animateOn === 'hover' || animateOn === 'both')
      ? {
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => !hasAnimated && setIsHovering(false),
        }
      : {}

  if (!mounted) {
    return (
      <span className={`inline-block whitespace-pre-wrap ${parentClassName}`}>
        <span className={className}>{text}</span>
      </span>
    )
  }

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block whitespace-pre-wrap ${parentClassName}`}
      {...hoverProps}
      {...props}
    >
      <span 
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0'
        }}
      >
        {text}
      </span>
      <span aria-hidden="true">
        {displayText.split('').map((char, index) => {
          const isRevealedOrDone = revealedIndices.has(index) || !isScrambling || !isHovering
          return (
            <span 
              key={index} 
              className={isRevealedOrDone ? className : encryptedClassName}
              style={{ transition: 'color 0.1s ease' }}
            >
              {char}
            </span>
          )
        })}
      </span>
    </motion.span>
  )
}
