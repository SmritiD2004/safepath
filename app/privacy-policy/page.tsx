'use client'

import Link from 'next/link'
import { Chakra_Petch } from 'next/font/google'
import '../landing-game.css'

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function PrivacyPolicyPage() {
  return (
    <main className={`game-page ${chakra.className}`}>
      <div className="space-bg" aria-hidden="true" />

      <header className="hud-nav scrolled">
        <div className="hud-inner">
          <div className="brand">
            <span className="brand-dot" />
            <span>SafePath Arena</span>
          </div>
          <nav className="hud-links" style={{ display: 'inline-flex', position: 'static', background: 'transparent', border: 'none', padding: 0 }}>
            <Link href="/">Home</Link>
            <Link href="/safety-knowledge">Safety Knowledge</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      <section className="section" style={{ paddingTop: 110 }}>
        <div className="section-title">
          <h2>Privacy Policy</h2>
          <p>We collect only what we need to personalize learning and track progress.</p>
        </div>

        <div className="knowledge-block">
          <div className="module-card" style={{ padding: 18 }}>
            <div className="module-title">Data We Store</div>
            <ul className="module-points">
              <li>Account details (name, email, avatar).</li>
              <li>Scenario runs and assessment scores.</li>
              <li>Progress insights (streaks, averages, achievements).</li>
            </ul>
          </div>
        </div>

        <div className="knowledge-block">
          <div className="module-card" style={{ padding: 18 }}>
            <div className="module-title">How We Use It</div>
            <ul className="module-points">
              <li>Personalize feedback and recommendations.</li>
              <li>Generate certificates and progress reports.</li>
              <li>Improve safety content and experience quality.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
