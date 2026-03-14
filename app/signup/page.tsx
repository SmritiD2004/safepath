'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import StarBorder from '../components/StarBorder'
import DecryptedText from '../components/DecryptedText'

type Step = 'details' | 'role' | 'done'

const ROLES = [
  { id: 'student', label: 'Student', desc: 'School or college student' },
  { id: 'professional', label: 'Working Professional', desc: 'Corporate or freelance' },
  { id: 'traveller', label: 'Frequent Traveller', desc: 'Travel often for work' },
  { id: 'other', label: 'Other', desc: 'Something else entirely' },
]

const AVATAR_OPTIONS = [
  '/avatars/aanya.svg',
  '/avatars/zoya.svg',
  '/avatars/meera.svg',
  '/avatars/kavya.svg',
]

const INDUSTRIES = [
  { id: 'CORPORATE_IT', label: 'Corporate IT & Tech' },
  { id: 'MANUFACTURING', label: 'Manufacturing & Industrial' },
  { id: 'EDUCATION', label: 'Education & Academia' },
  { id: 'RETAIL', label: 'Retail & Hospitality' },
  { id: 'BANKING_FINANCE', label: 'Banking & Finance' },
  { id: 'CUSTOM', label: 'Other / General' }
]

type IndustryId = (typeof INDUSTRIES)[number]['id']
type SignupPayload = {
  name: string
  email: string
  password: string
  avatar: string
  industry?: IndustryId
  orgCode?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<'individual' | 'org' | 'platform'>('individual')
  const [role, setRole] = useState('')
  const [industry, setIndustry] = useState('')
  const [orgCode, setOrgCode] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeTrauma, setAgreeTrauma] = useState(false)
  const [verifyLink, setVerifyLink] = useState('')
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0])

  function submitDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return setError('Please enter your name.')
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (!agreeTerms) return setError('Please agree to the Terms to continue.')
    setError('')
    setStep('role')
  }

  async function submitRole() {
    if (!role) return setError('Please select your role.')
    if (!agreeTrauma) return setError('Please acknowledge the content notice.')
    if (role === 'professional' && !orgCode && !industry) {
      return setError('Please select your industry or enter an organization code.')
    }
    setLoading(true)

    const payload: SignupPayload = { name, email, password, avatar }
    if (role === 'professional' && industry && !orgCode) {
      payload.industry = industry
    }
    if (orgCode.trim()) {
      payload.orgCode = orgCode.trim()
    }

    const registerRes = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!registerRes.ok) {
      const data = await registerRes.json().catch(() => null)
      setError(data?.error || `Could not create account (${registerRes.status}).`)
      setLoading(false)
      return
    }

    const data = await registerRes.json().catch(() => null)
    if (data?.verifyUrl) setVerifyLink(data.verifyUrl)

    setLoading(false)
    setStep('done')
    setTimeout(() => router.push('/login'), 1800)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(123,29,58,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(196,83,122,0.07)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 500 }}
        >
          Back to SafePath
        </Link>

        <div className="card" style={{ padding: '40px 36px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
            <DecryptedText
              text={step === 'done' ? 'Email verification required' : 'Create your account'}
              animateOn="view"
              sequential
              speed={28}
            />
          </h1>

          {step === 'details' && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                Already have one? <Link href="/login" style={{ color: 'var(--wine)', textDecoration: 'none', fontWeight: 600 }}>Log in</Link>
              </p>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 8 }}>
                  Sign Up As
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
                      onClick={() => setAccountType(item.id as typeof accountType)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${accountType === item.id ? 'var(--wine)' : 'var(--border)'}`,
                        background: accountType === item.id ? 'rgba(255,111,145,0.14)' : 'rgba(255,255,255,0.03)',
                        color: accountType === item.id ? 'var(--wine)' : 'var(--text)',
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
                  {accountType === 'platform'
                    ? 'Platform admins are created by the SafePath team.'
                    : accountType === 'org'
                      ? 'Use your organization access code during signup.'
                      : 'Individuals choose their industry for personalized scenarios.'}
                </div>
              </div>

              <form onSubmit={submitDetails} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Field label="Full Name">
                  <input className="input-field" type="text" value={name} onChange={(e) => { setName(e.target.value); setError('') }} />
                </Field>
                <Field label="Email Address">
                  <input className="input-field" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} />
                </Field>
                <Field label="Password">
                  <input className="input-field" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} />
                </Field>
                <Checkbox checked={agreeTerms} onChange={() => { setAgreeTerms((v) => !v); setError('') }} label="I agree to the Terms of Service and Privacy Policy." />
                {error && <ErrorBox msg={error} />}
                <StarBorder as="button" type="submit" color="#ffb0d6" speed="7s" style={{ width: '100%' }}>
                  Continue
                </StarBorder>
              </form>
            </>
          )}

          {step === 'role' && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Helps us personalize your scenarios.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRole(r.id); setError('') }}
                    style={{
                      padding: '16px 14px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: `1.5px solid ${role === r.id ? 'var(--wine)' : 'var(--border)'}`,
                      background: role === r.id ? 'rgba(255,111,145,0.14)' : 'rgba(255,255,255,0.03)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: role === r.id ? 'var(--wine)' : 'var(--text)', marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</div>
                  </button>
                ))}
              </div>

              {role === 'professional' && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>What industry do you work in?</div>
                  <select
                    className="input-field"
                    value={industry}
                    onChange={(e) => { setIndustry(e.target.value); setError('') }}
                    style={{ width: '100%', appearance: 'none', background: 'rgba(255,255,255,0.03)', border: '1.5px solid var(--border)', padding: '12px 14px', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}
                  >
                    <option value="" disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>Select your industry...</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind.id} value={ind.id} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
                  Have an organization access code?
                </div>
                <input
                  className="input-field"
                  type="text"
                  value={orgCode}
                  onChange={(e) => { setOrgCode(e.target.value); setError('') }}
                  placeholder="Enter code (optional)"
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  If you enter a valid code, your account will be linked to that organization.
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>Choose your squad avatar</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                {AVATAR_OPTIONS.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    style={{
                      height: 72,
                      borderRadius: 12,
                      border: `1.5px solid ${avatar === item ? 'var(--wine)' : 'var(--border)'}`,
                      background: avatar === item ? 'rgba(255,111,145,0.12)' : 'rgba(255,255,255,0.03)',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    aria-label={`Choose avatar ${index + 1}`}
                  >
                    <Image src={item} alt="" fill sizes="72px" style={{ objectFit: 'contain', padding: 6 }} />
                  </button>
                ))}
              </div>
              <Checkbox checked={agreeTrauma} onChange={() => { setAgreeTrauma((v) => !v); setError('') }} label="I understand and consent to the content notice." />
              {error && <ErrorBox msg={error} />}
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={() => setStep('details')} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Back</button>
                <StarBorder
                  as="button"
                  onClick={submitRole}
                  disabled={loading}
                  color="#ffc4dd"
                  speed="8s"
                  style={{ flex: 2 }}
                >
                  {loading ? 'Creating account...' : 'Start My Journey'}
                </StarBorder>
              </div>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                We sent a verification link to <strong>{email}</strong>. Verify first, then log in.
              </p>
              {verifyLink && (
                <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                  Dev link: <a href={verifyLink} style={{ color: 'var(--wine)' }}>Verify now</a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{label}</span>
    </label>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(185,28,28,0.06)', border: '1px solid rgba(185,28,28,0.2)', fontSize: 13, color: '#b91c1c' }}>
      {msg}
    </div>
  )
}
