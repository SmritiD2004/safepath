import { db } from '@/lib/db'

export default async function AdminAnalyticsPage() {
  const [totalRuns, completedRuns, inProgressRuns, avgFinalScores, topScenarios, assessments] = await Promise.all([
    db.scenarioRun.count(),
    db.scenarioRun.count({ where: { status: 'COMPLETED' } }),
    db.scenarioRun.count({ where: { status: 'IN_PROGRESS' } }),
    db.scenarioRun.aggregate({
      where: { status: 'COMPLETED' },
      _avg: { finalConfidence: true, finalEq: true, finalRisk: true },
    }),
    db.scenarioRun.groupBy({
      by: ['scenarioId'],
      _count: { _all: true },
      orderBy: { _count: { scenarioId: 'desc' } },
      take: 10,
    }),
    db.assessment.groupBy({
      by: ['type'],
      _count: { _all: true },
      _avg: { score: true },
    }),
  ])

  const completionRate = totalRuns ? Math.round((completedRuns / totalRuns) * 100) : 0

  return (
    <div>
      <div
        className="card"
        style={{
          padding: 18,
          marginBottom: 16,
          background: 'linear-gradient(120deg, rgba(59,70,138,0.12), rgba(196,83,122,0.08))',
          border: '1px solid rgba(59,70,138,0.25)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, marginBottom: 4 }}>Training Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Run-level performance, completion behavior, and assessment trends.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        <Metric label="Total Runs" value={totalRuns} />
        <Metric label="Completed Runs" value={completedRuns} />
        <Metric label="In Progress" value={inProgressRuns} />
        <Metric label="Completion Rate" value={completionRate} suffix="%" />
        <Metric label="Avg Confidence" value={Math.round(avgFinalScores._avg.finalConfidence ?? 0)} suffix="%" />
        <Metric label="Avg EQ" value={Math.round(avgFinalScores._avg.finalEq ?? 0)} suffix="%" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 10 }}>Top Scenarios by Runs</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f5f6' }}>
                <Th>Scenario</Th>
                <Th>Runs</Th>
              </tr>
            </thead>
            <tbody>
              {topScenarios.map((row) => (
                <tr key={row.scenarioId} style={{ borderTop: '1px solid var(--border)' }}>
                  <Td>{row.scenarioId}</Td>
                  <Td>{row._count._all}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 10 }}>Assessments</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f5f6' }}>
                <Th>Type</Th>
                <Th>Attempts</Th>
                <Th>Avg Score</Th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.type} style={{ borderTop: '1px solid var(--border)' }}>
                  <Td>{a.type}</Td>
                  <Td>{a._count._all}</Td>
                  <Td>{Math.round(a._avg.score ?? 0)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="card" style={{ padding: 14, background: 'linear-gradient(180deg, #fff, #f9f9fc)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>
        {value}
        {suffix}
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '10px 12px' }}>{children}</td>
}
