import type { Metadata } from 'next'
import { Playfair_Display, Inter, Poppins, Orbitron, Space_Mono } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import './globals.css'
import ThemeToggle from './ThemeToggle'
import BackgroundEffects from './components/BackgroundEffects'
import GlobalChatWidget from './components/GlobalChatWidget'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SafePath — Train Before the Danger',
  description: "A trauma-informed serious game platform for women's safety training.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${inter.variable} ${poppins.variable} ${orbitron.variable} ${spaceMono.variable}`}>
      <body
        suppressHydrationWarning
        style={{
          fontFamily: 'var(--font-body)',
          background: 'var(--bg)',
          color: 'var(--text)',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        <SessionProvider>
          <BackgroundEffects />
          <div style={{ position: 'relative', zIndex: 10 }}>
            {children}
            <ThemeToggle />
            <GlobalChatWidget />
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
