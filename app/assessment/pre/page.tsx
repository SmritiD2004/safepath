'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import StarBorder from '../../components/StarBorder'

const QUESTIONS = [
  {
    id: 1,
    q: "You're alone on a quiet street at night and notice someone mirroring your pace behind you. What's your first instinct?",
    options: [
      { text: "Ignore it — probably a coincidence", score: 1 },
      { text: "Speed up without changing direction", score: 2 },
      { text: "Cross the street to see if they follow, then head somewhere populated", score: 4 },
      { text: "Freeze and hope they pass", score: 1 },
    ],
    category: 'situational',
  },
  {
    id: 2,
    q: "A colleague makes a comment about your appearance that makes you uncomfortable. Under POSH guidelines, what is your right?",
    options: [
      { text: "Nothing — it's just a comment", score: 1 },
      { text: "Report it to HR only if it happens 3+ times", score: 2 },
      { text: "Document it and report even a single incident if it creates a hostile environment", score: 4 },
      { text: "Handle it privately without involving HR", score: 2 },
    ],
    category: 'knowledge',
  },
  {
    id: 3,
    q: "Someone online claims to be a talent scout and asks for your phone number and location. They have a professional-looking profile. What do you do?",
    options: [
      { text: "Share the information — their profile looks legit", score: 1 },
      { text: "Ask for their company email and verify it independently", score: 4 },
      { text: "Give only your phone number, not your location", score: 2 },
      { text: "Check if any friends know them first", score: 3 },
    ],
    category: 'digital',
  },
  {
    id: 4,
    q: "In a crowded public space, you feel physically uncomfortable due to someone's proximity. The most effective immediate response is:",
    options: [
      { text: "Stay silent to avoid making a scene", score: 1 },
      { text: "Physically reposition yourself and observe if they follow", score: 4 },
      { text: "Tell them directly and loudly to step back", score: 3 },
      { text: "Wait until you reach your stop", score: 1 },
    ],
    category: 'situational',
  },
  {
    id: 5,
    q: "What does DARVO stand for in the context of harassment response?",
    options: [
      { text: "I don't know this term", score: 0 },
      { text: "Deflect, Avoid, Redirect, Validate, Obstruct", score: 1 },
      { text: "Deny, Attack, Reverse Victim and Offender", score: 4 },
      { text: "Document, Assert, Report, Verify, Outline", score: 2 },
    ],
    category: 'knowledge',
  },
  {
    id: 6,
    q: "You're at a party and an acquaintance keeps offering you drinks after you've said no. This is:",
    options: [
      { text: "Just being friendly and social", score: 1 },
      { text: "A potential boundary violation worth naming directly", score: 4 },
      { text: "Normal party behaviour — don't overthink it", score: 1 },
      { text: "Concerning only if they touch you", score: 2 },
    ],
    category: 'social',
  },
  {
    id: 7,
    q: "A stranger on the street asks for your help with something minor (e.g. reading a map). You feel vaguely uneasy but can't explain why. You should:",
    options: [
      { text: "Help them — you're probably being paranoid", score: 1 },
      { text: "Trust your unease — offer verbal help from a distance or decline", score: 4 },
      { text: "Call someone while helping them", score: 3 },
      { text: "Ignore them entirely without responding", score: 2 },
    ],
    category: 'situational',
  },
  {
    id: 8,
    q: "What is the Women's Helpline number in India?",
    options: [
      { text: "100", score: 1 },
      { text: "1091", score: 4 },
      { text: "112", score: 2 },
      { text: "181", score: 3 },
    ],
    category: 'knowledge',
  },
  {
    id: 9,
    q: "Online manipulation often uses urgency tactics ('Act now!', 'Only tonight!'). Recognising this as a red flag is an example of:",
    options: [
      { text: "Being overly suspicious", score: 1 },
      { text: "Pattern recognition — a key digital safety skill", score: 4 },
      { text: "Anxiety rather than safety awareness", score: 1 },
      { text: "Good customer instincts", score: 2 },
    ],
    category: 'digital',
  },
  {
    id: 10,
    q: "If you witness someone being harassed in public, the most effective bystander intervention is:",
    options: [
      { text: "Confront the harasser directly and aggressively", score: 2 },
      { text: "Do nothing — it's not your business", score: 0 },
      { text: "Create a distraction or engage the target as if you know them", score: 4 },
      { text: "Record it on your phone", score: 2 },
    ],
    category: 'social',
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  situational: '🧭 Situational Awareness',
  knowledge: '📚 Safety Knowledge',
  digital: '📱 Digital Safety',
  social: '👥 Social Dynamics',
}

export default function PreAssessmentPage() {
  const { data: session, status: authStatus } = useSession()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [savedToDb, setSavedToDb] = useState(false)

  const q = QUESTIONS[current]
  const progress = ((current) / QUESTIONS.length) * 100

  function handleSelect(score: number, optionIndex: number) {
    setSelected(optionIndex)
  }

  async function handleNext() {
    if (selected === null) return
    const score = q.options[selected].score
    const newAnswers = [...answers, score]
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 >= QUESTIONS.length) {
      const total = newAnswers.reduce((a, b) => a + b, 0)
      const max = QUESTIONS.length * 4
      const pct = Math.round((total / max) * 100)
      localStorage.setItem('safepath_pre_score', JSON.stringify({ score: pct, answers: newAnswers, timestamp: Date.now() }))
      if (authStatus === 'authenticated') {
        try {
          const res = await fetch('/api/assessments/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'PRE', score: pct }),
          })
          if (res.ok) setSavedToDb(true)
        } catch {}
      }
      setDone(true)
    } else {
      setCurrent(c => c + 1)
    }
  }

  if (done) {
    const total = answers.reduce((a, b) => a + b, 0)
    const max = QUESTIONS.length * 4
    const pct = Math.round((total / max) * 100)
    const level = pct >= 75 ? 'Advanced' : pct >= 50 ? 'Developing' : pct >= 25 ? 'Emerging' : 'Foundational'
    const levelColor = pct >= 75 ? '#15803d' : pct >= 50 ? '#d97706' : pct >= 25 ? '#9b3060' : '#7b1d3a'

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'var(--grad-hero)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, boxShadow: '0 8px 32px rgba(123,29,58,0.3)',
            }}>📊</div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>Baseline set.</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
              Your pre-assessment is complete. After training, you&apos;ll take the post-test to measure your growth.
            </p>

            <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(123,29,58,0.04)', border: '1.5px solid var(--border)', marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 900, color: levelColor, lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, marginBottom: 16 }}>Cognitive Preparedness Baseline</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: `${levelColor}15`, border: `1px solid ${levelColor}44` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: levelColor }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: levelColor }}>{level} Level</span>
              </div>
            </div>

            <div style={{ marginBottom: 32, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Score breakdown</div>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                const catQs = QUESTIONS.filter(q => q.category === cat)
                const catScores = catQs.map((q) => {
                  const idx = QUESTIONS.indexOf(q)
                  return answers[idx] || 0
                })
                const catMax = catQs.length * 4
                const catPct = Math.round((catScores.reduce((a, b) => a + b, 0) / catMax) * 100)
                return (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--wine)' }}>{catPct}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${catPct}%`, background: 'var(--grad-hero)', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <StarBorder as={Link} href="/dashboard" color="#ffb0d6" speed="7s" style={{ width: '100%' }}>
              Start Training →
            </StarBorder>
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              {savedToDb ? 'Baseline saved to your account.' : 'Your baseline is saved. Complete scenarios to unlock the post-test.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 600, width: '100%' }}>

        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 8H4M6 5L3 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Exit
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{current + 1} of {QUESTIONS.length}</div>
              {authStatus === 'authenticated' && (
                <Link
                  href="/settings"
                  title="Profile settings"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    overflow: 'hidden',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--tone-soft)',
                    textDecoration: 'none',
                  }}
                >
                  {session?.user?.image ? (
                    <Image src={session.user.image} alt="Profile avatar" width={34} height={34} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--wine)' }}>
                      {(session?.user?.name?.[0] ?? 'U').toUpperCase()}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--grad-hero)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '36px 32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: 'rgba(123,29,58,0.07)', marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: 'var(--wine)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{CATEGORY_LABELS[q.category]}</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.4, marginBottom: 28 }}>
            {q.q}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => handleSelect(opt.score, i)} style={{
                padding: '14px 18px',
                borderRadius: 10,
                border: `1.5px solid ${selected === i ? 'var(--wine)' : 'var(--border)'}`,
                background: selected === i ? 'rgba(123,29,58,0.06)' : 'var(--bg-card)',
                color: selected === i ? 'var(--wine)' : 'var(--text)',
                fontSize: 14,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 12,
                fontWeight: selected === i ? 600 : 400,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${selected === i ? 'var(--wine)' : 'var(--border)'}`,
                  background: selected === i ? 'var(--wine)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected === i && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
                {opt.text}
              </button>
            ))}
          </div>

          <StarBorder as="button" onClick={handleNext} disabled={selected === null} color="#ffc4dd" speed="8s" style={{ width: '100%' }}>
            {current + 1 === QUESTIONS.length ? 'See My Results →' : 'Next Question →'}
          </StarBorder>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          This assessment measures current knowledge — not performance. There&apos;s no wrong answer.
        </p>
      </div>
    </div>
  )
}
