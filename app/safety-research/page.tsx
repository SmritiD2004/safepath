'use client'

import Link from 'next/link'
import { Chakra_Petch } from 'next/font/google'
import '../landing-game.css'

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function SafetyResearchPage() {
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
          <h2>Safety Research</h2>
          <p>Evidence‑informed learning, distilled into practical actions.</p>
        </div>

        <div className="knowledge-block">
          <div className="module-card" style={{ padding: 18 }}>
            <div className="module-title">Our Approach</div>
            <div className="module-sub">
              We design scenarios based on documented safety principles, behavioral research, and trauma‑informed
              learning practices. The goal is simple: build reliable instincts under pressure.
            </div>
          </div>
        </div>

        <div className="knowledge-block">
          <div className="module-card" style={{ padding: 18 }}>
            <div className="module-title">What We Measure</div>
            <ul className="module-points">
              <li>Decision quality (confidence, EQ, and risk outcomes).</li>
              <li>Consistency over time (streaks and repetition).</li>
              <li>Skill breadth (unique scenarios completed).</li>
              <li>Growth patterns (pre‑ and post‑assessment).</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
