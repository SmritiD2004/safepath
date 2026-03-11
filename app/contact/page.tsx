'use client'

import Link from 'next/link'
import { Chakra_Petch } from 'next/font/google'
import '../landing-game.css'

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function ContactPage() {
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
          <h2>Contact</h2>
          <p>Questions, feedback, or partnership ideas — reach us here.</p>
        </div>

        <div className="knowledge-block">
          <div className="module-card" style={{ padding: 18 }}>
            <div className="module-title">Email</div>
            <div className="module-sub">support@safepath.local</div>
          </div>
        </div>

        <div className="knowledge-block">
          <div className="module-card" style={{ padding: 18 }}>
            <div className="module-title">Community</div>
            <div className="module-sub">We respond within 24–48 hours on weekdays.</div>
          </div>
        </div>
      </section>
    </main>
  )
}
