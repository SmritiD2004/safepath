'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Chakra_Petch } from 'next/font/google'
import { useEffect, useState } from 'react'
import StarBorder from './components/StarBorder'
import DecryptedText from './components/DecryptedText'
import Hero from './components/Hero'
import './landing-game.css'

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const MISSIONS = [
  {
    id: 'metro',
    title: 'Metro Rush',
    danger: 'Medium',
    reward: '+180 XP',
    desc: 'Crowded platform simulation with timing-based choices.',
    icon: '🚇',
  },
  {
    id: 'night-walk',
    title: 'Night Walk',
    danger: 'High',
    reward: '+300 XP',
    desc: 'Route planning, suspicious pattern detection, and response practice.',
    icon: '🌙',
  },
  {
    id: 'chat-trap',
    title: 'Chat Trap',
    danger: 'Medium',
    reward: '+220 XP',
    desc: 'Detect manipulation in chat threads and set strong boundaries.',
    icon: '📱',
  },
]

const AVATARS = [
  {
    name: 'Aanya',
    role: 'Guardian',
    level: 12,
    color: '#ff6c8c',
    glow: '#ffb3cf',
    xp: 84,
    traitA: 'Calm',
    traitB: 'Alert',
    avatar: '/avatars/aanya.svg',
  },
  {
    name: 'Zoya',
    role: 'Strategist',
    level: 10,
    color: '#8f8bff',
    glow: '#c6c4ff',
    xp: 70,
    traitA: 'Sharp',
    traitB: 'Planner',
    avatar: '/avatars/zoya.svg',
  },
  {
    name: 'Meera',
    role: 'Navigator',
    level: 8,
    color: '#ff9ecf',
    glow: '#ffd0e8',
    xp: 61,
    traitA: 'Quick',
    traitB: 'Empath',
    avatar: '/avatars/meera.svg',
  },
  {
    name: 'Kavya',
    role: 'Defender',
    level: 11,
    color: '#6ec6ff',
    glow: '#afe5ff',
    xp: 78,
    traitA: 'Bold',
    traitB: 'Protective',
    avatar: '/avatars/kavya.svg',
  },
]

const FLOW = [
  { step: '01', title: 'Quick safety check-in', desc: 'Assess your current situation and mindset' },
  { step: '02', title: 'Play interactive mission', desc: 'Make real-time decisions in immersive scenarios' },
  { step: '03', title: 'Get AI coach feedback', desc: 'Instant analysis of your safety strategy' },
  { step: '04', title: 'Level up confidence score', desc: 'Track your growth and unlock achievements' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className={`game-page ${chakra.className}`}>
      <div className="space-bg" aria-hidden="true" />

      {/* ── NAV ── */}
      <header className={`hud-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="hud-inner">
          <div className="brand">
            <span className="brand-dot" />
            <span>SafePath Arena</span>
          </div>
          <button className="hud-menu-btn" onClick={() => setMenuOpen((v) => !v)} type="button">
            MENU
          </button>
          <nav className={`hud-links ${menuOpen ? 'open' : ''}`}>
            <a href="#missions">Missions</a>
            <a href="#squad">Squad</a>
            <a href="#loop">Game Loop</a>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      {/* ── HERO (uses Hero component) ── */}
      <Hero />

      {/* ── MISSIONS ── */}
      <section id="missions" className="section">
        <div className="section-title">
          <h2>Choose Your Mission</h2>
          <p>Each mission feels like a game level — challenge, outcome, and reward.</p>
        </div>
        <div className="mission-grid">
          {MISSIONS.map((m) => (
            <article key={m.id} className="mission-card">
              <div className="mission-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <h3>{m.title}</h3>
                </div>
                <span>{m.danger}</span>
              </div>
              <p>{m.desc}</p>
              <div className="mission-foot">
                <strong>{m.reward}</strong>
                <Link href="/role-play">Play →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── SQUAD ── */}
      <section id="squad" className="section">
        <div className="section-title">
          <h2>Women Squad Avatars</h2>
          <p>Character cards designed like a game team selection screen.</p>
        </div>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <article key={a.name} className="avatar-card">
              <div className="avatar-top">
                <span className="avatar-status">Ready</span>
                <span className="avatar-level">{`LVL ${a.level}`}</span>
              </div>
              <div
                className="avatar-visual"
                style={{
                  ['--avatar-accent' as string]: a.color,
                  ['--avatar-glow' as string]: a.glow,
                  ['--avatar-xp' as string]: `${a.xp}%`,
                }}
              >
                <span className="avatar-aura" />
                <div className="avatar-portrait">
                  <Image src={a.avatar} alt={`${a.name} avatar`} fill sizes="120px" />
                </div>
                <span className="avatar-charm">+</span>
              </div>
              <h3 className="avatar-name">{a.name}</h3>
              <p className="avatar-role">{a.role}</p>
              <div className="avatar-xp-row">
                <span>XP</span>
                <div className="avatar-xp-track">
                  <div className="avatar-xp-fill" />
                </div>
                <span>{`${a.xp}%`}</span>
              </div>
              <div className="avatar-tags">
                <span>{a.traitA}</span>
                <span>{a.traitB}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── GAME LOOP ── */}
      <section id="loop" className="section">
        <div className="section-title">
          <h2>Gameplay Loop</h2>
          <p>Four steps that build real-world safety instincts through play.</p>
        </div>
        <div className="loop-row">
          {FLOW.map((step) => (
            <div key={step.step} className="loop-step">
              <span>{step.step}</span>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{step.title}</p>
              <p style={{ fontSize: '0.82rem' }}>{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="final-cta">
          <StarBorder as={Link} href="/role-play" color="#95f5c6" speed="7s" thickness={1.2}>
            Enter Role-Play Arena
          </StarBorder>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        {/* top glow line */}
        <div className="footer-glow-line" aria-hidden="true" />

        <div className="footer-inner">

          {/* ── Brand column ── */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-dot" />
              <span className="footer-logo-name">SafePath</span>
              <span className="footer-logo-tag">Arena</span>
            </div>
            <p className="footer-tagline">
              Train before the danger.<br />
              Every choice builds real-world resilience.
            </p>
            <div className="footer-socials">
              {[
                { label: 'Twitter / X', href: '#', icon: '𝕏' },
                { label: 'Instagram', href: '#', icon: '◈' },
                { label: 'LinkedIn', href: '#', icon: 'in' },
              ].map(s => (
                <a key={s.label} href={s.href} aria-label={s.label} className="footer-social-btn">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Nav columns ── */}
          <div className="footer-nav-grid">
            <div className="footer-col">
              <h4 className="footer-col-title">Play</h4>
              <ul>
                <li><Link href="/role-play">Role-Play Arena</Link></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/assessment/pre">Skill Check</Link></li>
                <li><Link href="/scenario">Scenarios</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Modes</h4>
              <ul>
                <li><Link href="/mode/simulation">Simulation</Link></li>
                <li><Link href="/mode/puzzle">Puzzle</Link></li>
                <li><Link href="/mode/strategy">Strategy</Link></li>
                <li><Link href="/mode/story">Story</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Account</h4>
              <ul>
                <li><Link href="/signup">Sign Up</Link></li>
                <li><Link href="/login">Log In</Link></li>
                <li><Link href="/settings">Settings</Link></li>
                <li><Link href="/certificate">Certificate</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">About</h4>
              <ul>
                <li><a href="#">Our Mission</a></li>
                <li><a href="#">Safety Research</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <div className="footer-status">
              <span className="footer-status-dot" />
              <span>AI Coach Online</span>
            </div>
            <p className="footer-copy">
              © {new Date().getFullYear()} SafePath Arena. Built for women's safety.
            </p>
            <div className="footer-badges">
              <span>Trauma-Informed</span>
              <span>Privacy-First</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        /* ══════════════════════════════════════════
           FOOTER
        ══════════════════════════════════════════ */
        .site-footer {
          position: relative;
          margin-top: 80px;
        }

        /* Thin neon line at the very top of the footer */
        .footer-glow-line {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 127, 170, 0.6) 30%,
            rgba(137, 247, 255, 0.6) 70%,
            transparent 100%
          );
          box-shadow: 0 0 18px rgba(255, 127, 170, 0.35);
        }

        .footer-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 56px 24px 40px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
        }

        /* ── Brand ── */
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .footer-logo-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--accent, #ff7faa);
          box-shadow: 0 0 16px var(--accent, #ff7faa);
          flex-shrink: 0;
        }

        .footer-logo-name {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--text, #ffeefd);
        }

        .footer-logo-tag {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent, #ff7faa);
          background: rgba(255, 127, 170, 0.1);
          border: 1px solid rgba(255, 127, 170, 0.3);
          border-radius: 999px;
          padding: 2px 8px;
        }

        .footer-tagline {
          font-size: 13px;
          line-height: 1.65;
          color: var(--muted, #d2aac7);
          max-width: 26ch;
          margin-bottom: 20px;
        }

        .footer-socials {
          display: flex;
          gap: 10px;
        }

        .footer-social-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255, 176, 214, 0.28);
          background: rgba(9, 18, 36, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--muted, #d2aac7);
          text-decoration: none;
          transition: all 0.2s ease;
          backdrop-filter: blur(6px);
        }

        .footer-social-btn:hover {
          border-color: var(--accent, #ff7faa);
          color: var(--accent, #ff7faa);
          background: rgba(255, 127, 170, 0.1);
          box-shadow: 0 0 14px rgba(255, 127, 170, 0.25);
          transform: translateY(-2px);
        }

        /* ── Nav grid ── */
        .footer-nav-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px 24px;
        }

        .footer-col-title {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent, #ff7faa);
          margin-bottom: 14px;
          font-family: var(--font-orbitron, monospace);
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-col ul li a {
          font-size: 13px;
          color: var(--muted, #d2aac7);
          text-decoration: none;
          transition: color 0.18s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .footer-col ul li a::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 176, 214, 0.35);
          flex-shrink: 0;
          transition: background 0.18s ease;
        }

        .footer-col ul li a:hover {
          color: var(--text, #ffeefd);
        }

        .footer-col ul li a:hover::before {
          background: var(--accent, #ff7faa);
        }

        /* ── Bottom bar ── */
        .footer-bottom {
          border-top: 1px solid rgba(255, 176, 214, 0.1);
        }

        .footer-bottom-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 18px 24px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .footer-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: var(--muted, #d2aac7);
          letter-spacing: 0.06em;
        }

        .footer-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00ffcc;
          box-shadow: 0 0 10px #00ffcc;
          animation: statusPulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #00ffcc; }
          50%       { opacity: 0.55; box-shadow: 0 0 4px #00ffcc; }
        }

        .footer-copy {
          font-size: 12px;
          color: rgba(210, 170, 199, 0.5);
        }

        .footer-badges {
          display: flex;
          gap: 8px;
        }

        .footer-badges span {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted, #d2aac7);
          border: 1px solid rgba(255, 176, 214, 0.2);
          border-radius: 999px;
          padding: 3px 9px;
          background: rgba(255, 127, 170, 0.05);
        }

        /* ── Light theme overrides ── */
        html[data-theme='light'] .footer-social-btn {
          background: rgba(255, 246, 251, 0.8);
          border-color: rgba(202, 126, 172, 0.3);
          color: #7f4f86;
        }

        html[data-theme='light'] .footer-col ul li a {
          color: #7f4f86;
        }

        html[data-theme='light'] .footer-col ul li a:hover {
          color: #2b1430;
        }

        html[data-theme='light'] .footer-copy {
          color: rgba(127, 79, 134, 0.55);
        }

        html[data-theme='light'] .footer-badges span {
          border-color: rgba(202, 126, 172, 0.3);
          color: #7f4f86;
        }

        html[data-theme='light'] .footer-bottom {
          border-top-color: rgba(202, 126, 172, 0.18);
        }

        html[data-theme='light'] .footer-glow-line {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 111, 145, 0.5) 30%,
            rgba(180, 124, 255, 0.5) 70%,
            transparent 100%
          );
          box-shadow: 0 0 14px rgba(255, 111, 145, 0.25);
        }

        /* ── Desktop: side-by-side brand + nav ── */
        @media (min-width: 760px) {
          .footer-inner {
            grid-template-columns: 240px 1fr;
            gap: 40px;
          }

          .footer-nav-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
          }
        }
      `}</style>
    </main>
  )
}
