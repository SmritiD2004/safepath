'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type VerifyResponse = {
  found: boolean
  certificate?: {
    code: string
    issuedAt: string
    issuedBy: string
    avgConfidence: number
    avgEq: number
    avgRisk: number
    completedScenarios: number
    totalRuns: number
    readinessLevel: string
    user: {
      name: string | null
      email: string | null
    }
  }
  error?: string
}

function VerifyCertificateContent() {
  const search = useSearchParams()
  const initial = (search.get('code') ?? '').toUpperCase()
  const [code, setCode] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResponse | null>(null)

  useEffect(() => {
    if (!initial) return
    setLoading(true)
    setResult(null)
    fetch(`/api/certificates/public-verify?code=${encodeURIComponent(initial.trim().toUpperCase())}`)
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ found: false, error: 'Could not verify certificate.' }))
      .finally(() => setLoading(false))
  }, [initial])

  async function verify(value: string) {
    const normalized = value.trim().toUpperCase()
    if (!normalized) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/certificates/public-verify?code=${encodeURIComponent(normalized)}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ found: false, error: 'Could not verify certificate.' })
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await verify(code)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text)', marginBottom: 6 }}>
            Verify SafePath Certificate
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Enter certificate code or scan QR from certificate.
          </p>
          <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SP-YYYYMMDD-XXXXXX" />
            <button className="btn-primary" type="submit" disabled={loading || !code.trim()}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>

        {result?.error && <div className="card" style={{ padding: 14, color: '#b91c1c', marginBottom: 10 }}>{result.error}</div>}

        {result && !result.error && result.found === false && (
          <div className="card" style={{ padding: 14, color: 'var(--text-muted)' }}>
            Certificate not found.
          </div>
        )}

        {result?.certificate && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Verified
            </div>
            <Row label="Code" value={result.certificate.code} />
            <Row label="Name" value={result.certificate.user.name || result.certificate.user.email || 'SafePath User'} />
            <Row label="Issued" value={new Date(result.certificate.issuedAt).toLocaleDateString()} />
            <Row label="Issued By" value={result.certificate.issuedBy} />
            <Row label="Readiness" value={result.certificate.readinessLevel} />
            <Row label="Completed Scenarios" value={String(result.certificate.completedScenarios)} />
            <Row label="Total Runs" value={String(result.certificate.totalRuns)} />
            <Row label="Confidence / EQ / Risk" value={`${result.certificate.avgConfidence}% / ${result.certificate.avgEq}% / ${result.certificate.avgRisk}%`} />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <Link href="/" className="btn-ghost">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
          Loading verification...
        </div>
      }
    >
      <VerifyCertificateContent />
    </Suspense>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 8, marginBottom: 6 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{value}</div>
    </div>
  )
}
