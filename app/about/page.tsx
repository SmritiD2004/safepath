'use client'

import Link from 'next/link'
import { Chakra_Petch } from 'next/font/google'
import '../landing-game.css'

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function AboutPage() {
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
          <h2>Our Mission</h2>
          <p>Training before danger — practical safety, confident choices, and measurable growth.</p>
        </div>

        <div className="knowledge-block">
          <div className="module-card" style={{ padding: 18 }}>
            <div className="module-title">Why SafePath</div>
            <div className="module-sub">
              SafePath Arena is a serious‑game platform designed to build real‑world safety instincts. We combine guided
              scenarios, AI coaching, and measurable progress so learners can grow skills that matter.
            </div>
          </div>
        </div>

        <div className="knowledge-block">
          <div className="module-card" style={{ padding: 18 }}>
            <div className="module-title">How We Help</div>
            <ul className="module-points">
              <li>Interactive scenarios that simulate real decisions.</li>
              <li>Immediate feedback to build confidence and EQ.</li>
              <li>Progress tracking to identify strengths and gaps.</li>
              <li>Accessible safety knowledge and helplines.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
