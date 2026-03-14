'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function JoinPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('Validating invitation...')
  const displayStatus = token ? status : 'Missing invite token.'

  useEffect(() => {
    if (!token) return
    let ignore = false

    const run = async () => {
      try {
        setStatus('Validating invitation...')
        const res = await fetch('/api/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (res.status === 401) {
          router.replace(`/login?invite=${encodeURIComponent(token)}`)
          return
        }
        const data = await res.json()
        if (data?.success && data?.orgId) {
          router.replace(`/org/${data.orgId}/dashboard`)
          return
        }
        if (!ignore) {
          setStatus(data?.error || 'Invite could not be processed.')
        }
      } catch {
        if (!ignore) {
          setStatus('Invite could not be processed.')
        }
      }
    }

    void run()
    return () => {
      ignore = true
    }
  }, [router, token])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Joining your team</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>{displayStatus}</p>
      </div>
    </div>
  )
}
