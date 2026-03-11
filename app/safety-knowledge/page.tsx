'use client'

import Link from 'next/link'
import { Chakra_Petch } from 'next/font/google'
import StarBorder from '../components/StarBorder'
import '../landing-game.css'

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const HELPLINES = [
  { number: '112', title: 'Emergency Services', desc: 'All-India emergency number (police, fire, ambulance)', badge: '24/7' },
  { number: '181', title: 'Women Helpline', desc: 'Women in distress helpline', badge: '24/7' },
  { number: '1091', title: 'Women in Distress', desc: 'Police women helpline', badge: '24/7' },
  { number: '1930', title: 'Cyber Crime Helpline', desc: 'Report online harassment, stalking, fraud', badge: '24/7' },
  { number: '181', title: 'Domestic Violence', desc: 'National Commission for Women', badge: '24/7' },
  { number: '1098', title: 'Child Helpline', desc: 'For children in distress (under 18)', badge: '24/7' },
]

const SAFETY_MODULES = [
  {
    id: 'transport',
    title: 'Transport Safety',
    subtitle: 'Stay safe while commuting via bus, train, auto, or cab in Indian cities.',
    points: [
      'Use app-based rides where driver identity and route are tracked.',
      'Verify vehicle number, driver photo, and driver name before boarding.',
      'Share live location with a trusted contact for every ride.',
      'Ask the driver to tell you your name — never share it first.',
      'Sit behind the driver in cabs for easier exit.',
      'In buses and trains, stay near other women or families when possible.',
      'Trust your instincts — if something feels wrong, exit at a safe, populated area.',
      'Keep emergency numbers saved and accessible: 112, 181, 1091.',
    ],
    tips: [
      'Save your regular routes on GPS for quick comparison if a driver deviates.',
      'Keep your phone charged before traveling — carry a power bank.',
      'Identify well-lit, populated landmarks along your regular routes.',
    ],
    icon: '🚌',
  },
  {
    id: 'workplace',
    title: 'Workplace Safety',
    subtitle: 'Know your rights against workplace harassment under the POSH Act.',
    points: [
      'POSH Act 2013 mandates an Internal Complaints Committee (ICC) for organizations with 10+ employees.',
      'Sexual harassment includes physical contact, sexual advances, remarks, showing pornography, and unwelcome behavior.',
      'File a complaint with the ICC within 3 months of the incident (extendable to 6 months).',
      'Your identity is kept confidential through the process.',
      'The ICC must complete the inquiry within 90 days.',
      'If your organization lacks an ICC, approach the Local Complaints Committee (LCC) via the District Officer.',
      'Retaliation for filing a complaint is a violation.',
      'You can request interim measures like transfer of the respondent during inquiry.',
    ],
    tips: [
      'Document every incident with date, time, location, witnesses, and exact details.',
      'Save messages, emails, and screenshots as evidence.',
      'Identify trusted colleagues who can serve as witnesses.',
    ],
    icon: '🏢',
  },
  {
    id: 'digital',
    title: 'Online Safety',
    subtitle: 'Protect yourself from cyberstalking, online harassment, and digital threats.',
    points: [
      'Never share OTPs, passwords, or financial details over calls or DMs.',
      'Verify identities before responding to offers or meeting requests.',
      'Use two-factor authentication (2FA) on email and social accounts.',
      'Keep social profiles private and remove public location tags.',
      'Report harassment and block accounts early — do not engage.',
      'Use strong, unique passwords for each account.',
      'Review app permissions and revoke unnecessary access.',
      'Document and save evidence before reporting.',
    ],
    tips: [
      'Pause before replying to urgent or manipulative messages.',
      'Reverse image search profile photos if something feels off.',
      'Share suspicious patterns with trusted friends to warn others.',
    ],
    icon: '🔒',
  },
  {
    id: 'domestic',
    title: 'Domestic Safety',
    subtitle: 'Understanding domestic violence laws and how to seek help safely.',
    points: [
      'Domestic violence includes physical, emotional, sexual, and financial abuse.',
      'You have the right to protection orders and safe residence under the DV Act.',
      'Document incidents with dates, photos, and witnesses when safe to do so.',
      'Reach out to trusted friends/family and create a safety plan.',
      'Use helplines to get confidential guidance and legal support.',
      'If in immediate danger, call emergency services and move to a safe place.',
    ],
    tips: [
      'Keep important documents, cash, and essentials ready in a safe place.',
      'Set a code word with a trusted contact to signal distress.',
      'Identify safe exits and trusted neighbors you can reach quickly.',
    ],
    icon: '🏠',
  },
  {
    id: 'public',
    title: 'Public Space Safety',
    subtitle: 'Handle harassment in public spaces — streets, markets, events.',
    points: [
      'Move toward well-lit, populated areas when you feel unsafe.',
      'Use assertive, loud statements to draw attention if needed.',
      'Seek help from nearby staff, security, or families.',
      'Avoid isolated shortcuts; prefer main routes with visibility.',
      'Trust your instincts and leave early if a situation feels off.',
      'Keep emergency numbers saved and accessible on your phone.',
    ],
    tips: [
      'Keep one earphone out to stay aware of surroundings.',
      'Stand near exits in crowded spaces for a faster exit.',
      'Let someone know your location if you feel uncomfortable.',
    ],
    icon: '🏙️',
  },
]

const LEGAL_RIGHTS = [
  {
    id: 'ipc-354',
    title: 'Assault on Women',
    ref: 'IPC Section 354',
    desc: 'Assault or criminal force to woman with intent to outrage her modesty.',
    punishment: 'Imprisonment of not less than 1 year, may extend to 5 years, and fine.',
    example: 'Unwanted physical contact, grabbing, pushing in public transport.',
  },
  {
    id: 'ipc-354a',
    title: 'Sexual Harassment',
    ref: 'IPC Section 354A',
    desc: 'Unwelcome physical contact, sexual advances, demands for sexual favors, or pornography.',
    punishment: 'Imprisonment up to 3 years, or fine, or both.',
    example: 'Persistent sexual remarks at work or online.',
  },
  {
    id: 'ipc-354d',
    title: 'Stalking',
    ref: 'IPC Section 354D',
    desc: 'Following or contacting a woman repeatedly despite clear disinterest.',
    punishment: 'Imprisonment up to 3 years (first offence), up to 5 years (repeat) and fine.',
    example: 'Repeated calls, messages, or showing up near home/work.',
  },
  {
    id: 'ipc-354c',
    title: 'Voyeurism',
    ref: 'IPC Section 354C',
    desc: 'Watching or capturing images of a woman in a private act.',
    punishment: 'Imprisonment 1–3 years (first), 3–7 years (repeat) and fine.',
    example: 'Recording without consent in changing rooms or private spaces.',
  },
  {
    id: 'posh-2013',
    title: 'POSH Act, 2013',
    ref: 'Sexual Harassment of Women at Workplace Act',
    desc: 'Mandates ICC, complaint timelines, and protection against retaliation.',
    punishment: 'Employer penalties for non-compliance; disciplinary action for perpetrators.',
    example: 'Workplace sexual harassment reporting and inquiry process.',
  },
  {
    id: 'it-67',
    title: 'Cyber Offenses',
    ref: 'IT Act Section 67',
    desc: 'Publishing or transmitting obscene material online.',
    punishment: 'Imprisonment up to 3 years and fine for first offence.',
    example: 'Sharing obscene images or videos without consent.',
  },
  {
    id: 'dv-2005',
    title: 'Domestic Violence Protection',
    ref: 'Protection of Women from Domestic Violence Act, 2005',
    desc: 'Protection orders, residence orders, monetary relief, and custody orders.',
    punishment: 'Violations can lead to imprisonment and fines.',
    example: 'Physical, emotional, or financial abuse by partner or family.',
  },
]

export default function SafetyKnowledgePage() {
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
            <a href="#helplines">Helplines</a>
            <a href="#modules">Modules</a>
            <a href="#rights">Legal Rights</a>
          </nav>
        </div>
      </header>

      <section className="section" style={{ paddingTop: 110 }}>
        <div className="section-title">
          <h2>Safety Knowledge Hub</h2>
          <p>Trusted, bite-sized guidance for real-world safety decisions.</p>
        </div>

        <div id="helplines" className="knowledge-block">
          <h3>Emergency Helplines</h3>
          <div className="helpline-grid">
            {HELPLINES.map((h, i) => (
              <div key={`${h.number}-${i}`} className="helpline-card">
                <div className="helpline-pill">{h.number}</div>
                <div>
                  <div className="helpline-title">{h.title}</div>
                  <div className="helpline-desc">{h.desc}</div>
                  <div className="helpline-badge">{h.badge}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="modules" className="knowledge-block">
          <h3>Safety Modules</h3>
          <div className="module-list">
            {SAFETY_MODULES.map((m) => (
              <details key={m.id} className="module-card">
                <summary className="module-summary">
                  <div className="module-left">
                    <span className="module-icon">{m.icon}</span>
                    <div>
                      <div className="module-title">{m.title}</div>
                      <div className="module-sub">{m.subtitle}</div>
                    </div>
                  </div>
                  <span className="module-caret" aria-hidden="true">⌄</span>
                </summary>
                <div className="module-body">
                  <ul className="module-points">
                    {m.points.map((p, idx) => (
                      <li key={`${m.id}-p-${idx}`}>{p}</li>
                    ))}
                  </ul>
                  <div className="module-tips">
                    <div className="module-tips-title">Safety Tips</div>
                    <ul className="module-tips-list">
                      {m.tips.map((t, idx) => (
                        <li key={`${m.id}-t-${idx}`}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div id="rights" className="knowledge-block">
          <h3>Your Legal Rights</h3>
          <div className="legal-list">
            {LEGAL_RIGHTS.map((l) => (
              <details key={l.id} className="legal-card">
                <summary className="legal-summary">
                  <div>
                    <div className="legal-title">{l.title}</div>
                    <div className="legal-ref">{l.ref}</div>
                  </div>
                  <span className="legal-caret" aria-hidden="true">⌄</span>
                </summary>
                <div className="legal-body">
                  <p className="legal-desc">{l.desc}</p>
                  <div className="legal-panel">
                    <div className="legal-label">Punishment</div>
                    <div>{l.punishment}</div>
                  </div>
                  <div className="legal-panel">
                    <div className="legal-label">Example</div>
                    <div>{l.example}</div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="knowledge-cta">
          <StarBorder as={Link} href="/" color="#89f7ff" speed="7s" thickness={1.2} style={{ width: '100%' }}>
            ← Back to Home
          </StarBorder>
        </div>
      </section>
    </main>
  )
}
