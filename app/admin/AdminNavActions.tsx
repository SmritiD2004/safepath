'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function AdminNavActions() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Link href="/admin/users" className="btn-ghost">Users</Link>
      <Link href="/admin/analytics" className="btn-ghost">Analytics</Link>
      <Link href="/admin/certificates" className="btn-ghost">Certificates</Link>
      <Link href="/dashboard" className="btn-ghost">Open App</Link>
      <button
        type="button"
        className="btn-primary"
        style={{ padding: '8px 14px' }}
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        Log Out
      </button>
    </div>
  )
}
