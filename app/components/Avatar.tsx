'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type AvatarProps = {
  src?: string | null
  alt?: string
  size?: number
  fallbackText?: string
}

export default function Avatar({ src, alt = 'User', size = 48, fallbackText = 'U' }: AvatarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const s = `${size}px`

  useEffect(() => {
    // Initial theme check
    const saved = localStorage.getItem('safepath_theme')
    if (saved === 'light') setTheme('light')

    const handleThemeChange = (e: any) => {
      setTheme(e.detail)
    }

    window.addEventListener('themeChanged', handleThemeChange)
    return () => window.removeEventListener('themeChanged', handleThemeChange)
  }, [])

  const defaultAvatar = theme === 'light' ? '/Hero-Avatar-cute.png' : '/Hero-avatar.png'
  const displaySrc = src || defaultAvatar

  return (
    <div
      className="relative overflow-hidden rounded-full border-4 shadow-xl ring-2 transition-transform hover:scale-105"
      style={{
        width: s,
        height: s,
        borderColor: 'var(--wine-light)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image 
        src={displaySrc} 
        alt={alt} 
        width={size} 
        height={size} 
        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'top' }} 
      />
    </div>
  )
}
