'use client'

import { FormEvent, useState } from 'react'

type VerifyResponse = {
  found?: boolean
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
      id: string
      name: string | null
      email: string | null
    }
  }
  error?: string
}

export default function AdminCertificatesPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResponse | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/certificates/verify?code=${encodeURIComponent(code.trim())}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Could not verify certificate.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card" style={{ padding: 18, marginBottom: 16, background: 'linear-gradient(120deg, rgba(123,29,58,0.12), rgba(59,70,138,0.08))' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 4 }}>Certificate Verification</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Validate certificate authenticity using its code.</p>
      </div>

      <form className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 8 }} onSubmit={onSubmit}>
        <input className="input-field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter certificate code (e.g., SP-20260304-ABC123)" />
        <button className="btn-primary" type="submit" disabled={loading || !code.trim()}>
          {loading ? 'Checking...' : 'Verify'}
        </button>
      </form>

      {result?.error && <div className="card" style={{ padding: 14, color: '#b91c1c' }}>{result.error}</div>}

      {result && !result.error && result.found === false && (
        <div className="card" style={{ padding: 14, color: 'var(--text-muted)' }}>
          No certificate found for this code.
        </div>
      )}

      {result?.certificate && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
            Verified Certificate
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Row label="Code" value={result.certificate.code} />
            <Row label="User" value={result.certificate.user.name || result.certificate.user.email || result.certificate.user.id} />
            <Row label="Issued" value={new Date(result.certificate.issuedAt).toLocaleDateString()} />
            <Row label="Readiness" value={result.certificate.readinessLevel} />
            <Row label="Completed Scenarios" value={String(result.certificate.completedScenarios)} />
            <Row label="Total Runs" value={String(result.certificate.totalRuns)} />
            <Row label="Avg Confidence / EQ / Risk" value={`${result.certificate.avgConfidence}% / ${result.certificate.avgEq}% / ${result.certificate.avgRisk}%`} />
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{value}</div>
    </div>
  )
}
