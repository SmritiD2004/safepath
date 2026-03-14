'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSession, signIn } from 'next-auth/react'
import StarBorder from '../components/StarBorder'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loginType, setLoginType] = useState<'individual' | 'org' | 'platform'>('individual')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verifyLink, setVerifyLink] = useState('')


  const rawCallback = searchParams.get('callbackUrl')
  const callbackUrl = rawCallback && rawCallback.startsWith('/') ? rawCallback : '/dashboard'

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  if (!email.includes('@')) return setError('Enter a valid email address.')
  if (password.length < 6)  return setError('Enter your password.')

  setLoading(true)
  setNeedsVerification(false)
  setVerifyLink('')

  const checkRes = await fetch('/api/auth/login-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const checkData = await checkRes.json().catch(() => null)
  if (checkRes.ok && checkData?.exists && !checkData?.verified) {
    setError('Please verify your email before logging in.')
    setNeedsVerification(true)
    setLoading(false)
    return
  }

  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })

  if (result?.error) {
    setError('Invalid email or password.')
    setNeedsVerification(false)
    setLoading(false)
  } else {
    const session = await getSession()
    const role = session?.user && 'role' in session.user ? (session.user.role as string | undefined) : undefined
    router.push(role === 'ADMIN' ? '/admin/users' : callbackUrl)
  }
}

async function resendVerification() {
  const res = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    setError(data?.error || 'Could not resend verification email.')
    return
  }

  if (data?.verifyUrl) {
    setVerifyLink(data.verifyUrl)
  }
  setError('Verification email sent. Please check your inbox.')
}

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -120, left: -80, width: 380, height: 380, borderRadius: '50%', background: 'rgba(123,29,58,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(196,83,122,0.07)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>

        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 500, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--wine)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 8H4M6 5L3 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to SafePath
        </Link>

        <div className="card" style={{ padding: '40px 36px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L4 7v8c0 5.5 4.3 10.7 10 12 5.7-1.3 10-6.5 10-12V7L14 2z" stroke="var(--wine)" strokeWidth="2" fill="none"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--wine)' }}>
              Safe<span style={{ color: 'var(--wine-light)' }}>Path</span>
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Do not have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--wine)', textDecoration: 'none', fontWeight: 600 }}>Sign up free</Link>
          </p>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 8 }}>
              Login As
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {[
                { id: 'individual', label: 'Individual' },
                { id: 'org', label: 'Organization' },
                { id: 'platform', label: 'Platform Admin' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLoginType(item.id as typeof loginType)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${loginType === item.id ? 'var(--wine)' : 'var(--border)'}`,
                    background: loginType === item.id ? 'rgba(255,111,145,0.14)' : 'rgba(255,255,255,0.03)',
                    color: loginType === item.id ? 'var(--wine)' : 'var(--text)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              {loginType === 'platform'
                ? 'Platform admins are redirected to the admin panel after login.'
                : loginType === 'org'
                  ? 'Organization admins are redirected to their org dashboard.'
                  : 'Individuals are taken to the training dashboard.'}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 7 }}>Email Address</label>
              <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setError('') }} autoComplete="email" />
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>Password</span>
                <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--wine)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot?
                </Link>
              </label>
              <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => { setPassword(e.target.value); setError('') }} autoComplete="current-password" />
            </div>

            {/* Remember */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => setRemember(v => !v)} style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `1.5px solid ${remember ? 'var(--wine)' : 'var(--border)'}`,
                background: remember ? 'var(--wine)' : 'var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', cursor: 'pointer',
              }}>
                {remember && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Remember me for 30 days</span>
            </label>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(185,28,28,0.06)', border: '1px solid rgba(185,28,28,0.2)', fontSize: 13, color: '#b91c1c' }}>
                {error}
              </div>
            )}
            {needsVerification && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button type="button" className="btn-ghost" onClick={resendVerification}>
                  Resend Verification Email
                </button>
                {verifyLink && (
                  <a href={verifyLink} style={{ fontSize: 12, color: 'var(--wine)' }}>
                    Dev verify link
                  </a>
                )}
              </div>
            )}

            <StarBorder
              as="button"
              type="submit"
              disabled={loading}
              color="#ffb0d6"
              speed="7s"
              style={{ width: '100%', marginTop: 4 }}
            >
              {loading
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block' }} className="animate-spin-slow" /> Signing in…</>
                : 'Sign In →'
              }
            </StarBorder>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <StarBorder as={Link} href={callbackUrl} color="#ffc4dd" speed="8s" style={{ width: '100%' }}>
            Continue Without Account
          </StarBorder>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Your data is private and encrypted. SafePath never shares personal information.
        </p>
      </div>
    </div>
  )
}
