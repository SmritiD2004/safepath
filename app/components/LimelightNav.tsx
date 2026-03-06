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
  const navRef  = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  /* update spotlight position */
  function updateSpot(idx: number) {
    const el = itemRefs.current[idx]
    const nav = navRef.current
    if (!el || !nav) return
    const navRect = nav.getBoundingClientRect()
    const elRect  = el.getBoundingClientRect()
    setSpot({
      left:  elRect.left - navRect.left,
      width: elRect.width,
    })
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
    <header className={`lml-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="lml-inner">

        {/* Brand */}
        <div className="lml-brand">
          <span className="lml-dot" />
          <span>SafePath Arena</span>
        </div>

        {/* Desktop nav with spotlight */}
        <nav className="lml-links" ref={navRef} aria-label="Main navigation">

          {/* Spotlight bar + light cone */}
          <span
            className="lml-spotlight"
            style={{
              left:  spotStyle.left,
              width: spotStyle.width,
            }}
            aria-hidden="true"
          >
            <span className="lml-bar" />
            <span className="lml-cone" />
          </span>

          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              ref={el => { itemRefs.current[i] = el }}
              className={`lml-item${active === i ? ' active' : ''}`}
              onClick={() => setActive(i)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="lml-burger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="lml-mobile">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={`lml-mobile-item${active === i ? ' active' : ''}`}
              onClick={() => { setActive(i); setMenuOpen(false) }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
