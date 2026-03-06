'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function SafeExitPage() {
  useEffect(() => { sessionStorage.removeItem('safepath_game_state') }, [])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'var(--grad-hero)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, boxShadow: '0 8px 32px rgba(123,29,58,0.25)',
        }}>🛡️</div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>You are safe.</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
          You&apos;ve exited the session. Take a breath. You&apos;re in control.
        </p>

        <div style={{ padding: '18px 20px', borderRadius: 14, background: 'rgba(185,28,28,0.05)', border: '1px solid rgba(185,28,28,0.15)', marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>If you&apos;re in immediate danger, please call:</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <strong style={{ color: '#b91c1c', fontSize: 22, fontFamily: 'var(--font-display)' }}>112</strong>
            <span style={{ color: 'var(--border)' }}>|</span>
            <strong style={{ color: '#b91c1c', fontSize: 22, fontFamily: 'var(--font-display)' }}>1091</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>(Women Helpline)</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
          <Link href="/" className="btn-ghost">Leave SafePath</Link>
        </div>
      </div>
    </div>
  )
}
