'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Chakra_Petch } from 'next/font/google'
import { useEffect, useState } from 'react'
import StarBorder from './components/StarBorder'
import DecryptedText from './components/DecryptedText'
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
  },
  {
    id: 'night-walk',
    title: 'Night Walk',
    danger: 'High',
    reward: '+300 XP',
    desc: 'Route planning, suspicious pattern detection, and response practice.',
  },
  {
    id: 'chat-trap',
    title: 'Chat Trap',
    danger: 'Medium',
    reward: '+220 XP',
    desc: 'Detect manipulation in chat threads and set strong boundaries.',
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
  'Quick safety check-in',
  'Play interactive mission',
  'Get AI coach feedback',
  'Level up confidence score',
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMission, setActiveMission] = useState(MISSIONS[0].id)
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

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SAFETY GAME UNIVERSE</p>
          <h1>
            <DecryptedText
              text="Play Bold."
              animateOn="view"
              sequential
              speed={32}
              className="text-current"
              encryptedClassName="text-[var(--accent-2)]"
            />
            <span>
              <DecryptedText
                text="Stay Unstoppable."
                animateOn="view"
                sequential
                speed={28}
                className="text-current"
                encryptedClassName="text-[var(--accent-2)]"
                parentClassName="whitespace-nowrap"
              />
            </span>
          </h1>
          <p>
            Enter a feminine, high-energy mission world where every choice levels up your confidence, awareness,
            and real-life safety instincts.
          </p>
          <div className="hero-ctas">
            <StarBorder as={Link} href="/signup" color="#89f7ff" thickness={1.2}>
              Start Mission
            </StarBorder>
            <StarBorder as={Link} href="/assessment/pre" color="#ffc06b" speed="8s" thickness={1.2}>
              Skill Check
            </StarBorder>
          </div>
          <div className="hero-stats">
            <span>4 Modes</span>
            <span>AI Coach Online</span>
            <span>Instant XP Feedback</span>
          </div>
        </div>
        <div className="hero-side">
          <div className="hero-panel">
            <div className="radar">
              <span className="pulse" />
            </div>
            <div className="panel-copy">
              <p>Current Objective</p>
              <h3>Reach Confidence Rank A</h3>
              <p>Complete 3 missions this week and unlock your certificate badge.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="missions" className="section">
        <div className="section-title">
          <h2>Choose Your Mission</h2>
          <p>Each mission feels like a game level with challenge, outcome, and reward.</p>
        </div>
        <div className="mission-grid">
          {MISSIONS.map((m) => (
            <article
              key={m.id}
              className={`mission-card ${activeMission === m.id ? 'active' : ''}`}
              onMouseEnter={() => setActiveMission(m.id)}
            >
              <div className="mission-head">
                <h3>{m.title}</h3>
                <span>{m.danger}</span>
              </div>
              <p>{m.desc}</p>
              <div className="mission-foot">
                <strong>{m.reward}</strong>
                <Link href="/role-play">Play</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="squad" className="section">
        <div className="section-title">
          <h2>Women Squad Avatars</h2>
          <p>Character cards designed to feel like a game team selection screen.</p>
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

      <section id="loop" className="section loop">
        <div className="section-title">
          <h2>Gameplay Loop</h2>
        </div>
        <div className="loop-row">
          {FLOW.map((step, i) => (
            <div key={step} className="loop-step">
              <span>{`0${i + 1}`}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
        <div className="final-cta">
          <StarBorder as={Link} href="/role-play" color="#95f5c6" speed="7s" thickness={1.2}>
            Enter Role-Play Arena
          </StarBorder>
        </div>
      </section>
    </main>
  )
}
