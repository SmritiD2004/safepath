'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type CertificatePayload = {
  eligible: boolean
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
  }
  user?: { name?: string | null; email?: string | null }
  metrics?: {
    done: number
    totalRuns: number
    avgConfidence: number
    avgEq: number
    avgRisk: number
    unlockedAchievements: number
    unmet: string[]
  }
  error?: string
}

export default function CertificatePage() {
  const [data, setData] = useState<CertificatePayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    fetch('/api/certificate')
      .then(async (res) => {
        const body = await res.json()
        if (ignore) return
        setData(body)
      })
      .catch(() => {
        if (!ignore) setData({ eligible: false, error: 'Could not load certificate.' })
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading certificate...</div>
      </div>
    )
  }

  if (!data?.eligible || !data.certificate) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }} className="card">
          <div style={{ padding: 22 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text)', marginBottom: 8 }}>
              Certificate Locked
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>
              Complete the requirements to unlock your SafePath completion certificate.
            </p>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {(data?.metrics?.unmet ?? ['Keep progressing through scenarios and improve your average scores.']).map((u, idx) => (
                <div key={idx} style={{ marginBottom: 6 }}>• {u}</div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
              <Link href="/role-play" className="btn-ghost">Practice Role-Play</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const cert = data.certificate
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/dashboard" className="btn-ghost">Back</Link>
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          Download / Print PDF
        </button>
      </div>

      <div
        className="card"
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: 30,
          background: 'linear-gradient(160deg, rgba(123,29,58,0.10), var(--bg-card) 42%)',
          border: '1px solid rgba(123,29,58,0.35)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--wine)', marginBottom: 8 }}>
            SafePath Training Certification
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 40, color: 'var(--text)', lineHeight: 1.1 }}>
            Certificate of Completion
          </h1>
        </div>

        <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--text-muted)', marginBottom: 20 }}>
          This certifies that
        </p>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--wine)', fontWeight: 800, marginBottom: 14 }}>
          {data.user?.name || data.user?.email || 'SafePath User'}
        </p>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 22 }}>
          has successfully completed SafePath core readiness criteria in safety decision training.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 18 }}>
          <Metric label="Completed Scenarios" value={String(cert.completedScenarios)} />
          <Metric label="Total Runs" value={String(cert.totalRuns)} />
          <Metric label="Avg Confidence" value={`${cert.avgConfidence}%`} />
          <Metric label="Avg EQ" value={`${cert.avgEq}%`} />
          <Metric label="Avg Risk" value={`${cert.avgRisk}%`} />
          <Metric label="Readiness" value={cert.readinessLevel} />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <div>Certificate Code: <strong style={{ color: 'var(--text)' }}>{cert.code}</strong></div>
            <div>Issued On: {new Date(cert.issuedAt).toLocaleDateString()}</div>
            <div>Issued By: {cert.issuedBy}</div>
            <div style={{ marginTop: 6 }}>
              Verify URL: <a href={`/verify-certificate?code=${encodeURIComponent(cert.code)}`} style={{ color: 'var(--wine)' }}>
                /verify-certificate?code={cert.code}
              </a>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Image
              src={`/api/certificate/qr?code=${encodeURIComponent(cert.code)}`}
              alt="Certificate verification QR"
              width={140}
              height={140}
              unoptimized
              style={{ borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}
            />
            <div style={{ fontFamily: 'var(--font-display)', color: 'var(--wine)', fontWeight: 800, fontSize: 18, marginTop: 6 }}>
              SafePath
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 10, background: 'var(--bg-card)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontWeight: 800, color: 'var(--text)' }}>{value}</div>
    </div>
  )
}
