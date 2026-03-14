'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Chakra_Petch } from 'next/font/google'
import { useEffect, useState } from 'react'
import StarBorder from './StarBorder'
import DecryptedText from './DecryptedText'

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function Hero() {
  const [glowActive, setGlowActive] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setGlowActive(v => !v), 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className={`${chakra.className} hero`}>

      {/* ── Copy side ── */}
      <div className="hero-copy">
        <p className="eyebrow">SAFETY GAME UNIVERSE</p>
        <h1>
          <DecryptedText
            text="Play Bold."
            animateOn="hover"
            revealDirection="start"
            sequential={true}
            speed={50}
            className="text-[#ff7faa]"
            encryptedClassName="text-[#ffc4dd] opacity-40"
          />
          <span>
            <DecryptedText
              text="Stay Unstoppable."
              animateOn="hover"
              revealDirection="start"
              sequential={true}
              speed={40}
              className="text-current"
              encryptedClassName="text-[#ffc4dd] opacity-40"
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

      {/* ── Avatar side ── */}
      <div className="hero-side">
        {/*
          The outer .ha-scene is the coordinate system for all overlays.
          It's sized to match the image so chips/badge are always ON the image.
        */}
        <div className="ha-scene">

          {/* Ambient bloom behind image */}
          <div
            className="ha-bloom"
            aria-hidden="true"
            style={{ opacity: glowActive ? 1 : 0.5, transition: 'opacity 2.2s ease'  }}
          />

          {/* The image */}
          <Image
            src="/Hero-avatar.png"
            alt="SafePath Arena hero"
            width={720}
            height={920}
            priority
            className="ha-img"
            style={{
              filter: glowActive
                ? 'drop-shadow(0 0 40px rgba(137,247,255,0.6)) drop-shadow(0 0 70px rgba(255,127,170,0.45)) brightness(1.07)'
                : 'drop-shadow(0 0 16px rgba(137,247,255,0.25)) drop-shadow(0 0 32px rgba(255,127,170,0.18)) brightness(1.02)',
              transition: 'filter 2.2s ease',
            }}
          />

          {/* CRT scan-lines */}
          <div className="ha-scanlines" aria-hidden="true" />

          {/* ── Floating chips — positioned relative to image corners ── */}
          <div className="ha-chip ha-chip--a" style={{ animationDelay: '0s' }}>
            <span className="ha-dot" style={{ background: '#89f7ff' }} />
            +180 XP
          </div>
          <div className="ha-chip ha-chip--b" style={{ animationDelay: '0.8s' }}>
            <span className="ha-dot" style={{ background: '#ffc4dd' }} />
            Confidence ↑
          </div>
          <div className="ha-chip ha-chip--c" style={{ animationDelay: '1.6s' }}>
            <span className="ha-dot" style={{ background: '#ffc06b' }} />
            EQ +12
          </div>

          {/* Level badge — bottom-left of the image */}
          <div className="ha-badge">
            <span className="ha-badge-label">LVL</span>
            <span className="ha-badge-num">12</span>
          </div>

        </div>
      </div>

      <style>{`
        /* ─────────────────────────────────────────
           hero-side: fill the right grid column,
           centre its content vertically
        ───────────────────────────────────────── */
        .hero-side {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          /* allow image to overflow upward into nav padding */
          overflow: visible;
        }

        /* ─────────────────────────────────────────
           ha-scene: the coordinate system.
           It takes the natural size of the image,
           so every % position is relative to the image.
        ───────────────────────────────────────── */
        .ha-scene {
          position: relative;
          /* shrink-wrap around the image */
          display: inline-flex;
          align-items: flex-end;
          justify-content: center;
          width: 100%;
          /* let it grow to fill the column */
          max-width: 100%;
        }

        /* ─────────────────────────────────────────
           The image itself — tall, full column width
        ───────────────────────────────────────── */
        .ha-img {
          display: block;
          /* fill the column */
          width: 100%;
          max-width: none;
          height: auto;
          /* nudge up — the image has empty space at bottom */
          margin-bottom: -20px;
          margin-top: -120px;
          object-fit: contain;
          position: relative;
          z-index: 2;
          /* fade left edge so it bleeds into copy column */
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 16%, black 100%);
                  mask-image: linear-gradient(to right, transparent 0%, black 16%, black 100%);
        }

        html[data-theme='light'] .ha-img {
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%);
                  mask-image: linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%);
        }

        /* ─────────────────────────────────────────
           Atmospheric bloom
        ───────────────────────────────────────── */
        .ha-bloom {
          position: absolute;
          inset: -15% -15%;
          background: radial-gradient(
            ellipse 72% 68% at 52% 55%,
            rgba(137,247,255,0.16) 0%,
            rgba(255,127,170,0.12) 42%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        html[data-theme='light'] .ha-bloom {
          background: radial-gradient(
            ellipse 72% 68% at 52% 55%,
            rgba(255,111,145,0.12) 0%,
            rgba(180,124,255,0.09) 42%,
            transparent 70%
          );
        }

        /* ─────────────────────────────────────────
           CRT scan-lines overlay
        ───────────────────────────────────────── */
        .ha-scanlines {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(137,247,255,0.016) 3px,
            rgba(137,247,255,0.016) 4px
          );
        }

        /* ─────────────────────────────────────────
           Floating stat chips
           Positioned relative to the IMAGE bounds.
           Keep them well inside (never near right=0)
           so they can't overflow the viewport.
        ───────────────────────────────────────── */
        .ha-chip {
          position: absolute;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #f0f4ff;
          background: rgba(4,9,20,0.80);
          border: 1px solid rgba(255,176,214,0.38);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          white-space: nowrap;
          pointer-events: none;
          animation: haFloat 3.4s ease-in-out infinite;
        }

        /* +180 XP — upper-right area of the image */
        .ha-chip--a { top: 14%;  right: 8%; }
        /* Confidence ↑ — mid-right */
        .ha-chip--b { top: 44%;  right: 5%; }
        /* EQ +12 — lower-right */
        .ha-chip--c { bottom: 28%; right: 10%; }

        .ha-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        html[data-theme='light'] .ha-chip {
          background: rgba(255,246,251,0.92);
          border-color: rgba(202,126,172,0.45);
          color: #2b1430;
        }

        /* ─────────────────────────────────────────
           Level badge — lower-left of image
        ───────────────────────────────────────── */
        .ha-badge {
          position: absolute;
          z-index: 10;
          bottom: 22%;
          left: 14%;
          width: 58px; height: 58px;
          border-radius: 50%;
          background: rgba(4,9,20,0.88);
          border: 2px solid rgba(137,247,255,0.6);
          box-shadow: 0 0 22px rgba(137,247,255,0.4), inset 0 0 12px rgba(137,247,255,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          animation: haFloat 3.4s ease-in-out 1.1s infinite;
        }

        .ha-badge-label {
          font-size: 8px;
          letter-spacing: 0.12em;
          color: rgba(137,247,255,0.75);
          font-family: var(--font-orbitron, monospace);
          line-height: 1;
        }

        .ha-badge-num {
          font-size: 21px;
          font-weight: 900;
          color: #89f7ff;
          font-family: var(--font-orbitron, monospace);
          line-height: 1.1;
          text-shadow: 0 0 14px rgba(137,247,255,0.85);
        }

        html[data-theme='light'] .ha-badge {
          background: rgba(255,246,251,0.92);
          border-color: rgba(255,111,145,0.65);
          box-shadow: 0 0 18px rgba(255,111,145,0.3);
        }
        html[data-theme='light'] .ha-badge-label { color: #b05070; }
        html[data-theme='light'] .ha-badge-num {
          color: #ff4f7a;
          text-shadow: 0 0 12px rgba(255,79,122,0.5);
        }

        @keyframes haFloat {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-7px); }
        }

        /* ─────────────────────────────────────────
           Mobile: hide decorations
        ───────────────────────────────────────── */
        @media (max-width: 899px) {
          .ha-chip, .ha-badge, .ha-scanlines { display: none; }
          .ha-img { max-width: 88vw; margin-bottom: 0; }
        }
      `}</style>
    </section>
  )
}
