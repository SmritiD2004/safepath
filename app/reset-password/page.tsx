'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import StarBorder from '../components/StarBorder'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || !token) {
      setMessage('Reset link is missing or invalid.')
      return
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/auth/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage(data?.error || 'Could not reset password.')
      } else {
        setDone(true)
      }
    } catch {
      setMessage('Could not reset password.')
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

          {!done ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                Set new password
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                Enter a new password for <strong>{email || 'your account'}</strong>.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 7 }}>
                    New Password
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setMessage('') }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 7 }}>
                    Confirm Password
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setMessage('') }}
                  />
                </div>

                {message && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(123,29,58,0.06)', border: '1px solid var(--border)', fontSize: 13 }}>
                    {message}
                  </div>
                )}

                <StarBorder as="button" type="submit" disabled={loading} color="#ffb0d6" speed="7s" style={{ width: '100%' }}>
                  {loading ? 'Saving…' : 'Update password →'}
                </StarBorder>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
                background: 'var(--grad-hero)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, boxShadow: '0 8px 32px rgba(123,29,58,0.3)',
              }}>✅</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                Password updated
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
                You can now log in with your new password.
              </p>
              <StarBorder as={Link} href="/login" color="#ffc4dd" speed="8s" style={{ width: '100%' }}>
                Back to Login →
              </StarBorder>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
