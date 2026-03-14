import { headers } from 'next/headers'
import AccessCodeCard from './AccessCodeCard'

type MemberStat = {
  userId: string
  name: string
  email: string
  jobRole: string
  department: string
  completedScenarios: number
  avgConfidence: number
  avgEq: number
  avgRisk: number
}

type AnalyticsResponse = {
  totalMembers: number
  completionRate: number
  avgOrgConfidence: number
  avgOrgEq: number
  avgOrgRisk: number
  memberStats: MemberStat[]
}

async function fetchAnalytics(orgId: string): Promise<AnalyticsResponse> {
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const cookie = hdrs.get('cookie') ?? ''
  const res = await fetch(`${proto}://${host}/api/org/${orgId}/analytics`, {
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  })
  if (!res.ok) {
    return {
      totalMembers: 0,
      completionRate: 0,
      avgOrgConfidence: 0,
      avgOrgEq: 0,
      avgOrgRisk: 0,
      memberStats: [],
    }
  }
  return res.json()
}

export default async function OrgDashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const analytics = await fetchAnalytics(orgId)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f9ff', padding: '24px 0' }}>
      <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto', color: '#0f172a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
          Org Dashboard
        </div>
        <h1 style={{ fontSize: 30, margin: 0, color: '#0f172a' }}>Training Overview</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Members', value: analytics.totalMembers },
          { label: 'Completion Rate', value: `${analytics.completionRate}%` },
          { label: 'Avg Confidence', value: `${analytics.avgOrgConfidence}%` },
          { label: 'Avg EQ', value: `${analytics.avgOrgEq}%` },
          { label: 'Avg Risk', value: `${analytics.avgOrgRisk}%` },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              border: '1px solid #dbeafe',
              borderRadius: 12,
              padding: 18,
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
              boxShadow: '0 6px 18px rgba(37,99,235,0.08)',
            }}
          >
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{card.value}</div>
          </div>
          ))}
      </div>

      <AccessCodeCard orgId={orgId} />

      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0, color: '#0f172a' }}>Members</h2>
          <div style={{ fontSize: 12, color: '#64748b' }}>Aggregate stats only</div>
        </div>

        <div style={{ border: '1px solid #dbeafe', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#eff6ff' }}>
              <tr>
                {[
                  'User',
                  'Email',
                  'Department',
                  'Job Role',
                  'Completed',
                  'Avg Confidence',
                  'Avg EQ',
                  'Avg Risk',
                ].map((head) => (
                  <th
                    key={head}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      fontSize: 12,
                      color: '#1d4ed8',
                      fontWeight: 600,
                      borderBottom: '1px solid #dbeafe',
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.memberStats.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 16, fontSize: 13, color: '#64748b' }}>
                    No members found.
                  </td>
                </tr>
              ) : (
                analytics.memberStats.map((member) => (
                  <tr key={member.userId}>
                    <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                      {member.name || member.userId}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                      {member.email || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                      {member.department}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                      {member.jobRole || 'Employee'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                      {member.completedScenarios}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                      {member.avgConfidence}%
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                      {member.avgEq}%
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                      {member.avgRisk}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  )
}
