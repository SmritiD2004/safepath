'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import StarBorder from '../../components/StarBorder'

// Reuse same questions but randomised order
const QUESTIONS = [
  { id: 'q1', q: "You're on a late-night bus and notice the person behind you has repositioned twice to stay close. You've already moved once. The most effective next step is:", options: [ { text: "Move again and stay near the driver or conductor", score: 4 }, { text: "Confront them aggressively", score: 2 }, { text: "Exit at the next stop regardless", score: 3 }, { text: "Ignore it — you might be misreading", score: 1 } ], category: 'situational' },
  { id: 'q2', q: "Under the POSH Act 2013, which of the following is NOT considered sexual harassment at the workplace?", options: [ { text: "Unwelcome physical contact", score: 1 }, { text: "Showing sexually explicit content", score: 1 }, { text: "A performance review with negative feedback", score: 4 }, { text: "Creating a hostile work environment", score: 1 } ], category: 'knowledge' },
  { id: 'q3', q: "A social media account with 200 followers sends you a 'brand deal' — offering cash if you share your address for a 'product delivery'. This is likely:", options: [ { text: "A legitimate micro-influencer opportunity", score: 1 }, { text: "A social engineering / phishing attempt", score: 4 }, { text: "Fine if you've verified their email", score: 2 }, { text: "Worth exploring if the amount is small", score: 2 } ], category: 'digital' },
  { id: 'q4', q: "You're meeting someone from an online platform for the first time. Which of these is NOT a good safety practice?", options: [ { text: "Meeting in a public place", score: 1 }, { text: "Telling a trusted person where you'll be", score: 1 }, { text: "Sharing your live location with a friend", score: 1 }, { text: "Keeping the location secret so it feels special", score: 4 } ], category: 'situational' },
  { id: 'q5', q: "The 'bystander effect' describes:", options: [ { text: "When bystanders are too far away to help", score: 1 }, { text: "How individual responsibility diffuses in groups, reducing intervention", score: 4 }, { text: "When witnesses actively prevent help", score: 2 }, { text: "A legal term for failure to report", score: 2 } ], category: 'social' },
  { id: 'q6', q: "A person sets limits on what they're comfortable with in a social situation. If those limits are repeatedly tested despite being clearly stated, this is:", options: [ { text: "Just persistence and interest", score: 1 }, { text: "Normal social negotiation", score: 1 }, { text: "A boundary violation that may constitute harassment", score: 4 }, { text: "Only a problem if physical", score: 2 } ], category: 'social' },
  { id: 'q7', q: "You feel uneasy in an unfamiliar environment but can't identify a specific threat. The appropriate response is:", options: [ { text: "Dismiss the feeling — it's anxiety", score: 1 }, { text: "Trust the signal and take protective action (leave, seek people, call someone)", score: 4 }, { text: "Stay still until you can rationalise the feeling", score: 2 }, { text: "Only act if you see a concrete threat", score: 2 } ], category: 'situational' },
  { id: 'q8', q: "The iCall helpline (psychological support) in India can be reached at:", options: [ { text: "9152987821", score: 4 }, { text: "1800-599-0019", score: 3 }, { text: "1091", score: 2 }, { text: "112", score: 1 } ], category: 'knowledge' },
  { id: 'q9', q: "Manufactured urgency in a conversation ('You need to decide now!') is a manipulation tactic that works by:", options: [ { text: "Creating time pressure that bypasses careful thinking", score: 4 }, { text: "Showing genuine enthusiasm", score: 1 }, { text: "Demonstrating high demand for their offer", score: 2 }, { text: "Building excitement", score: 1 } ], category: 'digital' },
  { id: 'q10', q: "After a harassment incident, what should you do FIRST to protect your rights?", options: [ { text: "Wait to see if it happens again before acting", score: 1 }, { text: "Document everything: date, time, words, witnesses, your state of mind", score: 4 }, { text: "Tell friends but not HR", score: 2 }, { text: "Confront the person privately", score: 2 } ], category: 'knowledge' },
]

export default function PostAssessmentPage() {
  const { data: session, status: authStatus } = useSession()
  const [current, setCurrent]     = useState(0)
  const [answers, setAnswers]     = useState<number[]>([])
  const [selected, setSelected]   = useState<number | null>(null)
  const [done, setDone]           = useState(false)
  const [preScore, setPreScore]   = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('safepath_pre_score')
      return stored ? Number(JSON.parse(stored).score) : null
    } catch {
      return null
    }
  })
  const [savedToDb, setSavedToDb] = useState(false)

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    fetch('/api/assessments/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data?.latestPre?.score !== undefined && data.latestPre.score !== null) {
          setPreScore(Number(data.latestPre.score))
        }
      })
      .catch(() => {})
  }, [authStatus])

  const q = QUESTIONS[current]
  const progress = (current / QUESTIONS.length) * 100

  async function handleNext() {
    if (selected === null) return
    const score = q.options[selected].score
    const newAnswers = [...answers, score]
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 >= QUESTIONS.length) {
      const total = newAnswers.reduce((a, b) => a + b, 0)
      const max   = QUESTIONS.length * 4
      const pct   = Math.round((total / max) * 100)
      localStorage.setItem('safepath_post_score', JSON.stringify({ score: pct, answers: newAnswers, timestamp: Date.now() }))
      if (authStatus === 'authenticated') {
        try {
          const res = await fetch('/api/assessments/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'POST', score: pct }),
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
    const max   = QUESTIONS.length * 4
    const pct   = Math.round((total / max) * 100)
    const improvement = preScore !== null ? pct - preScore : null
    const level = pct >= 75 ? 'Advanced' : pct >= 50 ? 'Developing' : pct >= 25 ? 'Emerging' : 'Foundational'

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'var(--grad-hero)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, boxShadow: '0 8px 32px rgba(123,29,58,0.3)',
            }}>🎉</div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>Training complete.</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
              Here&apos;s what your SafePath training achieved.
            </p>

            {improvement !== null && (
              <div style={{
                padding: '28px', borderRadius: 16, marginBottom: 32,
                background: improvement >= 0 ? 'rgba(21,128,61,0.05)' : 'rgba(123,29,58,0.05)',
                border: `1.5px solid ${improvement >= 0 ? 'rgba(21,128,61,0.2)' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Before → After Training</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: 'var(--text-muted)' }}>{preScore}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pre-Test</div>
                  </div>
                  <div style={{ fontSize: 24, color: 'var(--border)' }}>→</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: 'var(--wine)' }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Post-Test</div>
                  </div>
                </div>
                <div style={{
                  marginTop: 16, padding: '8px 16px', borderRadius: 100,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: improvement >= 0 ? 'rgba(21,128,61,0.1)' : 'rgba(123,29,58,0.1)',
                  color: improvement >= 0 ? '#15803d' : 'var(--wine)',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
                }}>
                  {improvement >= 0 ? '▲' : '▼'} {Math.abs(improvement)}% {improvement >= 0 ? 'improvement' : 'to work on'}
                </div>
              </div>
            )}

            <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(123,29,58,0.04)', border: '1px solid var(--border)', marginBottom: 32, textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>Your level: {level}</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {pct >= 75
                  ? "Strong cognitive preparedness. Continue with advanced scenarios to maintain and deepen this awareness."
                  : pct >= 50
                  ? "You're developing solid safety instincts. Keep training — the hardest scenarios will push your skills further."
                  : "Your safety awareness is growing. Each scenario you complete builds real preparedness. Keep going."
                }
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/dashboard" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Dashboard</Link>
              <StarBorder as={Link} href="/dashboard" color="#ffb0d6" speed="7s" style={{ flex: 2 }}>
                Continue Training →
              </StarBorder>
            </div>
            {savedToDb && (
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                Post-assessment saved to your account.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 600, width: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--wine)' }}>📊 Post-Assessment</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{current + 1} / {QUESTIONS.length}</div>
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
          {preScore !== null && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              Pre-test baseline: <strong style={{ color: 'var(--wine)' }}>{preScore}%</strong> — let&apos;s see your growth.
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '36px 32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.4, marginBottom: 28 }}>
            {q.q}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => setSelected(i)} style={{
                padding: '14px 18px', borderRadius: 10,
                border: `1.5px solid ${selected === i ? 'var(--wine)' : 'var(--border)'}`,
                background: selected === i ? 'rgba(123,29,58,0.06)' : 'var(--bg-card)',
                color: selected === i ? 'var(--wine)' : 'var(--text)',
                fontSize: 14, textAlign: 'left', cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
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
            {current + 1 === QUESTIONS.length ? 'See My Results →' : 'Next →'}
          </StarBorder>
        </div>
      </div>
    </div>
  )
}
