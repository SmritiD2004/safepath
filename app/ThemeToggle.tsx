'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = window.localStorage.getItem('safepath_theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('safepath_theme', theme)
  }, [theme])

  function handleToggle() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
    localStorage.setItem('safepath_theme', nextTheme)
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: nextTheme }))
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      suppressHydrationWarning
      aria-label="Toggle theme"
      title="Toggle theme"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 200,
        borderRadius: 999,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text)',
        padding: '10px 14px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      }}
    >
      Theme: {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
