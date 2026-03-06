import { db } from '@/lib/db'

export default async function AdminUsersPage() {
  const [users, totalUsers, verifiedUsers, anonymousUsers, adminUsers] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isAnonymous: true,
        createdAt: true,
      },
      take: 200,
    }),
    db.user.count(),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.user.count({ where: { isAnonymous: true } }),
    db.user.count({ where: { role: 'ADMIN' } }),
  ])

  return (
    <div>
      <div
        className="card"
        style={{
          padding: 18,
          marginBottom: 16,
          background: 'linear-gradient(120deg, rgba(123,29,58,0.10), rgba(196,83,122,0.08))',
          border: '1px solid rgba(123,29,58,0.25)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 4 }}>User Control Center</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Overview of all accounts, verification health, and admin distribution.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        <Metric label="Total Users" value={totalUsers} />
        <Metric label="Verified" value={verifiedUsers} />
        <Metric label="Anonymous" value={anonymousUsers} />
        <Metric label="Admins" value={adminUsers} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8f5f6' }}>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Verified</Th>
              <Th>Type</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <Td>{u.name ?? '-'}</Td>
                <Td>{u.email ?? '-'}</Td>
                <Td>{u.role}</Td>
                <Td>{u.emailVerified ? 'Yes' : 'No'}</Td>
                <Td>{u.isAnonymous ? 'Anonymous' : 'Registered'}</Td>
                <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ padding: 14, background: 'linear-gradient(180deg, #fff, #fbf8f9)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '10px 12px' }}>{children}</td>
}
