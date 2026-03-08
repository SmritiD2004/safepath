'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const NAV_ITEMS = [
  { label: 'Missions', href: '#missions' },
  { label: 'Squad',    href: '#squad'    },
  { label: 'Game Loop',href: '#loop'     },
  { label: 'Dashboard',href: '/dashboard'},
]

export default function LimelightNav() {
  const [active, setActive]     = useState(0)
  const [spotStyle, setSpot]    = useState({ left: 0, width: 0 })
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef   = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  function updateSpot(idx: number) {
    const el  = itemRefs.current[idx]
    const nav = navRef.current
    if (!el || !nav) return
    const navRect = nav.getBoundingClientRect()
    const elRect  = el.getBoundingClientRect()
    setSpot({ left: elRect.left - navRect.left, width: elRect.width })
  }

  useEffect(() => {
    updateSpot(active)
    const onResize = () => updateSpot(active)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
        borderBottom: scrolled ? '1px solid rgba(255,176,214,0.2)' : '1px solid transparent',
        background: scrolled ? 'rgba(3,9,20,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.25s ease',
      }}>
        <div style={{
          maxWidth: 1120, margin: '0 auto', padding: '22px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          {/* Brand */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text)',
          }}>
            <span style={{
              width: 11, height: 11, borderRadius: '50%',
              background: '#ff7faa', boxShadow: '0 0 18px #ff7faa',
              display: 'inline-block', flexShrink: 0,
            }} />
            SafePath Arena
          </div>

          {/* Desktop nav with limelight spotlight */}
          <nav
            ref={navRef}
            aria-label="Main navigation"
            className="lml-desktop-nav"
            style={{ position: 'relative', alignItems: 'center', gap: 4, display: 'none' }}
          >
            {/* Animated spotlight underbar + cone */}
            <span aria-hidden="true" style={{
              position: 'absolute',
              left: spotStyle.left,
              width: spotStyle.width,
              top: 0, bottom: 0,
              pointerEvents: 'none',
              transition: 'left 0.3s cubic-bezier(.4,0,.2,1), width 0.3s cubic-bezier(.4,0,.2,1)',
              zIndex: 0,
            }}>
              <span style={{
                position: 'absolute', bottom: 0, left: '10%', right: '10%',
                height: 2, borderRadius: 999,
                background: 'linear-gradient(90deg, transparent, #ff7faa, transparent)',
              }} />
              <span style={{
                position: 'absolute', bottom: 2, left: '15%', right: '15%',
                height: 32,
                background: 'linear-gradient(180deg, rgba(255,127,170,0.18) 0%, transparent 100%)',
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
              }} />
            </span>

            {NAV_ITEMS.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                ref={el => { itemRefs.current[i] = el }}
                onClick={() => setActive(i)}
                style={{
                  position: 'relative', zIndex: 1,
                  padding: '8px 16px', borderRadius: 8,
                  fontSize: 13, letterSpacing: '0.04em',
                  fontWeight: active === i ? 700 : 500,
                  color: active === i ? '#f0f4ff' : 'rgba(210,170,199,0.7)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            type="button"
            className="lml-burger-btn"
            style={{
              background: 'rgba(20,32,54,0.7)',
              border: '1px solid rgba(255,176,214,0.25)',
              borderRadius: 12, padding: '8px 14px',
              color: 'var(--text)', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.08em', cursor: 'pointer',
            }}
          >
            MENU
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav style={{
            position: 'absolute', top: '100%', right: 16,
            background: 'rgba(4,11,22,0.97)',
            border: '1px solid rgba(255,176,214,0.2)',
            borderRadius: 12, padding: 10,
            display: 'flex', flexDirection: 'column', gap: 4,
            zIndex: 30,
          }}>
            {NAV_ITEMS.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => { setActive(i); setMenuOpen(false) }}
                style={{
                  color: active === i ? '#ff7faa' : 'var(--text)',
                  textDecoration: 'none', fontSize: 13,
                  padding: '8px 14px', borderRadius: 8,
                  fontWeight: active === i ? 700 : 400,
                  background: active === i ? 'rgba(255,127,170,0.08)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <style>{`
        @media (min-width: 900px) {
          .lml-desktop-nav { display: inline-flex !important; }
          .lml-burger-btn  { display: none !important; }
        }
      `}</style>
    </>
  )
}
