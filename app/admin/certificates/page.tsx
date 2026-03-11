'use client'

// app/admin/certificates/page.tsx
//
// Admin dashboard for reviewing and approving/rejecting pending certificates.
// Protected by server-side role check — redirect to /dashboard if not ADMIN.

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CertEntry = {
  id: string
  code: string
  issuedAt: string
  readinessLevel: string
  avgConfidence: number
  avgEq: number
  avgRisk: number
  completedScenarios: number
  totalRuns: number
  adminApproved: boolean | null
  adminReviewedAt: string | null
  adminNote: string | null
  user: { id: string; name: string | null; email: string | null }
}

type Status = 'pending' | 'approved' | 'rejected' | 'all'

export default function AdminCertificatesPage() {
  const [status, setStatus] = useState<Status>('pending')
  const [certs, setCerts] = useState<CertEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/certificates?status=${status}`)
      .then((r) => r.json())
      .then((d) => setCerts(d.certificates ?? []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false))
  }, [status])

  async function act(id: string, action: 'approve' | 'reject') {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note: noteMap[id] ?? '' }),
      })
      if (res.ok) {
        // Remove from list after action
        setCerts((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>
              Certificate Review
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Approve or reject user certificate applications.</p>
          </div>
          <Link href="/dashboard" className="btn-ghost">← Dashboard</Link>
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {(['pending', 'approved', 'rejected', 'all'] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={status === s ? 'btn-primary' : 'btn-ghost'}
              style={{ textTransform: 'capitalize', fontSize: 13 }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading...</div>
        ) : certs.length === 0 ? (
          <div className="card" style={{ padding: 20, color: 'var(--text-muted)' }}>
            No {status === 'all' ? '' : status} certificates found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {certs.map((cert) => (
              <div key={cert.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>
                      {cert.user.name || cert.user.email || 'Unknown User'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {cert.user.email} · Code: <strong>{cert.code}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                      {cert.adminReviewedAt && ` · Reviewed: ${new Date(cert.adminReviewedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <StatusBadge value={cert.adminApproved} />
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  <span>Scenarios: <strong>{cert.completedScenarios}</strong></span>
                  <span>Runs: <strong>{cert.totalRuns}</strong></span>
                  <span>Confidence: <strong>{cert.avgConfidence}%</strong></span>
                  <span>EQ: <strong>{cert.avgEq}%</strong></span>
                  <span>Risk: <strong>{cert.avgRisk}%</strong></span>
                  <span>Readiness: <strong style={{ textTransform: 'capitalize' }}>{cert.readinessLevel}</strong></span>
                </div>

                {/* Existing admin note (if reviewed) */}
                {cert.adminNote && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>
                    Note: {cert.adminNote}
                  </div>
                )}

                {/* Action area — only shown for pending */}
                {cert.adminApproved === null && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <textarea
                      className="input-field"
                      style={{ flex: 1, minWidth: 200, fontSize: 12, resize: 'vertical', minHeight: 36 }}
                      placeholder="Optional reviewer note (shown to user on rejection)"
                      value={noteMap[cert.id] ?? ''}
                      onChange={(e) => setNoteMap((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                    />
                    <button
                      className="btn-primary"
                      disabled={actionLoading === cert.id}
                      onClick={() => act(cert.id, 'approve')}
                    >
                      {actionLoading === cert.id ? '...' : 'Approve'}
                    </button>
                    <button
                      className="btn-ghost"
                      disabled={actionLoading === cert.id}
                      onClick={() => act(cert.id, 'reject')}
                      style={{ color: '#b91c1c' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ value }: { value: boolean | null }) {
  const label = value === true ? 'Approved' : value === false ? 'Rejected' : 'Pending'
  const color = value === true ? '#15803d' : value === false ? '#b91c1c' : '#92400e'
  const bg = value === true ? '#dcfce7' : value === false ? '#fee2e2' : '#fef9c3'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color, background: bg, textTransform: 'uppercase', letterSpacing: '0.06em', alignSelf: 'flex-start' }}>
      {label}
    </span>
  )
}
