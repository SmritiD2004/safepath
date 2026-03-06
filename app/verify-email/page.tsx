'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type Status = 'verifying' | 'success' | 'error'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const hasValidParams = Boolean(token && email)
  const [status, setStatus] = useState<Status>(hasValidParams ? 'verifying' : 'error')
  const [message, setMessage] = useState(
    hasValidParams ? 'Verifying your email...' : 'Invalid verification link.'
  )

  useEffect(() => {
    if (!hasValidParams || !token || !email) {
      return
    }

    fetch('/api/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error ?? 'Could not verify email.')
        }
        setStatus('success')
        setMessage('Email verified. You can now log in.')
      })
      .catch((error: Error) => {
        setStatus('error')
        setMessage(error.message)
      })
  }, [hasValidParams, token, email])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div className="card" style={{ maxWidth: 520, width: '100%', padding: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Email Verification</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{message}</p>

        {status === 'verifying' && <p style={{ fontSize: 14 }}>Please wait...</p>}

        {status !== 'verifying' && (
          <Link href="/login" className="btn-primary" style={{ display: 'inline-flex' }}>
            Go to Login
          </Link>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
          Preparing verification...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
