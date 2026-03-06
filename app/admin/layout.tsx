import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AdminNavActions from './AdminNavActions'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role ?? 'USER'

  if (!session?.user?.id) {
    redirect('/login')
  }
  if (role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 10% 10%, rgba(123,29,58,0.08), transparent 35%), radial-gradient(circle at 90% 20%, rgba(212,120,154,0.10), transparent 32%), var(--bg)',
      }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--wine)', boxShadow: '0 0 0 6px rgba(123,29,58,0.16)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--wine)', letterSpacing: '0.04em' }}>
            SafePath Admin Console
          </div>
        </div>
        <AdminNavActions />
      </nav>
      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px' }}>{children}</main>
    </div>
  )
}
