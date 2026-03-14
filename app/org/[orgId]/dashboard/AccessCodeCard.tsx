'use client'

import { useEffect, useState } from 'react'

type AccessCodeState = {
  active: boolean
  issuedAt: string | null
  last4: string | null
  code?: string
}

export default function AccessCodeCard({ orgId }: { orgId: string }) {
  const [state, setState] = useState<AccessCodeState>({
    active: false,
    issuedAt: null,
    last4: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    fetch(`/api/org/${orgId}/access-code`)
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return
        setState({
          active: Boolean(data.active),
          issuedAt: data.issuedAt ?? null,
          last4: data.last4 ?? null,
        })
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [orgId])

  async function generateCode() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/org/${orgId}/access-code`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Could not generate code.')
      }
      const data = await res.json().catch(() => null)
      setState({
        active: true,
        issuedAt: data?.issuedAt ?? null,
        last4: data?.last4 ?? null,
        code: data?.code ?? '',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not generate code.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ border: '1px solid #dbeafe', borderRadius: 12, padding: 18, background: '#ffffff', marginTop: 24, boxShadow: '0 6px 18px rgba(37,99,235,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 6, fontWeight: 700 }}>Organization Access Code</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {state.code ? state.code : state.active ? `Active (ends with ${state.last4 ?? '----'})` : 'Not generated'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {state.issuedAt ? `Issued at ${new Date(state.issuedAt).toLocaleString()}` : 'Generate a code to onboard employees.'}
          </div>
        </div>
        <button
          onClick={generateCode}
          disabled={loading}
          style={{
            border: '1px solid #1d4ed8',
            background: '#1d4ed8',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : state.active ? 'Rotate Code' : 'Generate Code'}
        </button>
      </div>
      {state.code && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
          Share this code with employees for sign-up. This code is only shown when generated.
        </div>
      )}
      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#b91c1c' }}>
          {error}
        </div>
      )}
    </div>
  )
}
