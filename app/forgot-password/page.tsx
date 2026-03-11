'use client'

import { useState } from 'react'
import Link from 'next/link'
import StarBorder from '../components/StarBorder'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.includes('@')) {
      setMessage('Enter a valid email address.')
      return
    }

    setLoading(true)
    setMessage('')
    setResetUrl('')

    try {
      const res = await fetch('/api/auth/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage(data?.error || 'Could not send reset email.')
      } else {
        setMessage('If that email exists, a reset link has been sent.')
        if (data?.resetUrl) setResetUrl(data.resetUrl)
        setSubmitted(true)
      }
    } catch {
      setMessage('Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -120, left: -80, width: 380, height: 380, borderRadius: '50%', background: 'rgba(123,29,58,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(196,83,122,0.07)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 460 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 500 }}>
          ← Back to Login
        </Link>

        <div className="card" style={{ padding: '40px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L4 7v8c0 5.5 4.3 10.7 10 12 5.7-1.3 10-6.5 10-12V7L14 2z" stroke="var(--wine)" strokeWidth="2" fill="none"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--wine)' }}>
              Safe<span style={{ color: 'var(--wine-light)' }}>Path</span>
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
            Reset password
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Enter your email and we&apos;ll send a reset link.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 7 }}>
                  Email Address
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setMessage('') }}
                />
              </div>

              {message && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(123,29,58,0.06)', border: '1px solid var(--border)', fontSize: 13 }}>
                  {message}
                </div>
              )}
              {resetUrl && (
                <a href={resetUrl} style={{ fontSize: 12, color: 'var(--wine)' }}>
                  Dev reset link
                </a>
              )}

              <StarBorder as="button" type="submit" disabled={loading} color="#ffb0d6" speed="7s" style={{ width: '100%' }}>
                {loading ? 'Sending…' : 'Send reset link →'}
              </StarBorder>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
                background: 'var(--grad-hero)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, boxShadow: '0 8px 32px rgba(123,29,58,0.3)',
              }}>✉️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                Check your inbox
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
                If the email exists, you&apos;ll receive a reset link shortly.
              </p>
              {resetUrl && (
                <a href={resetUrl} style={{ fontSize: 12, color: 'var(--wine)' }}>
                  Dev reset link
                </a>
              )}
              <div style={{ marginTop: 18 }}>
                <StarBorder as={Link} href="/login" color="#ffc4dd" speed="8s" style={{ width: '100%' }}>
                  Back to Login →
                </StarBorder>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
