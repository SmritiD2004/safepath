'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import StarBorder from '../components/StarBorder'
import Avatar from '../components/Avatar'

const AVATAR_OPTIONS = ['/avatars/aanya.svg', '/avatars/zoya.svg', '/avatars/meera.svg', '/avatars/kavya.svg'] as const

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<(typeof AVATAR_OPTIONS)[number]>('/avatars/aanya.svg')
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [router, status])

  useEffect(() => {
    const current = session?.user?.image
    if (current && AVATAR_OPTIONS.includes(current as (typeof AVATAR_OPTIONS)[number])) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAvatar(current as (typeof AVATAR_OPTIONS)[number])
    }
  }, [session?.user?.image])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
        Loading settings...
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  async function onPasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (newPassword.length < 8) {
      setErr('New password must be at least 8 characters.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/user/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json().catch(() => null)
    setSaving(false)
    if (!res.ok) {
      setErr(data?.error || 'Could not update password.')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setMsg('Password updated successfully.')
  }

  async function onSaveAvatar() {
    setErr('')
    setMsg('')
    setSavingAvatar(true)
    const res = await fetch('/api/user/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: selectedAvatar }),
    })
    const data = await res.json().catch(() => null)
    setSavingAvatar(false)
    if (!res.ok) {
      setErr(data?.error || 'Could not update avatar.')
      return
    }
    await update({ user: { image: data?.image || selectedAvatar } })
    setMsg('Avatar updated.')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>
          Back to Dashboard
        </Link>

        <div className="card" style={{ marginTop: 14, padding: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Profile Settings</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Avatar
              src={selectedAvatar || session.user.image}
              alt="Profile avatar"
              size={64}
              fallbackText={(session.user.name?.[0] ?? 'U').toUpperCase()}
            />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text)' }}>{session.user.name || 'User'}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{session.user.email}</p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>Choose your profile avatar</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AVATAR_OPTIONS.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedAvatar(item)}
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 999,
                    border: `2px solid ${selectedAvatar === item ? 'var(--wine)' : 'var(--border)'}`,
                    background: selectedAvatar === item ? 'rgba(255,111,145,0.12)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  aria-label={`Choose avatar ${index + 1}`}
                >
                  <Avatar src={item} alt={`Avatar ${index + 1}`} size={44} fallbackText="" />
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <StarBorder as="button" type="button" onClick={onSaveAvatar} disabled={savingAvatar} color="#ffb0d6" speed="7s">
                {savingAvatar ? 'Saving...' : 'Save Avatar'}
              </StarBorder>
            </div>
          </div>

          <form onSubmit={onPasswordChange} style={{ display: 'grid', gap: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-mid)' }}>Current Password</label>
            <input
              className="input-field"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <label style={{ fontSize: 12, color: 'var(--text-mid)' }}>New Password</label>
            <input
              className="input-field"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            {err && <div style={{ fontSize: 13, color: '#ff9bb9' }}>{err}</div>}
            {msg && <div style={{ fontSize: 13, color: '#95f5c6' }}>{msg}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <StarBorder as="button" type="submit" disabled={saving} color="#ffb0d6" speed="7s">
                {saving ? 'Saving...' : 'Change Password'}
              </StarBorder>
              <button type="button" className="btn-ghost" onClick={() => signOut({ callbackUrl: '/' })}>
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
