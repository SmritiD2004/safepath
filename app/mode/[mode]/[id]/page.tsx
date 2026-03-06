import { notFound } from 'next/navigation'
import SCENARIOS from '@/lib/scenarios'
import ScenarioCore from '@/app/scenario/[id]/ScenarioCore'
import { modeToSlug, slugToMode, type ModeSlug } from '@/lib/mode'

const MODE_SURFACES: Record<ModeSlug, string> = {
  simulation: 'linear-gradient(180deg, rgba(255, 111, 145, 0.08), transparent 35%)',
  puzzle: 'linear-gradient(180deg, rgba(167, 139, 250, 0.12), transparent 35%)',
  'role-play': 'linear-gradient(180deg, rgba(255, 148, 194, 0.12), transparent 35%)',
  strategy: 'linear-gradient(180deg, rgba(200, 162, 200, 0.12), transparent 35%)',
  story: 'linear-gradient(180deg, rgba(255, 111, 145, 0.1), transparent 35%)',
}

export default async function ModeScenarioPage({
  params,
}: {
  params: Promise<{ mode: string; id: string }>
}) {
  const { mode, id } = await params
  const scenario = SCENARIOS[id]
  const modeFromSlug = slugToMode(mode)

  if (!scenario || !modeFromSlug || scenario.mode !== modeFromSlug) {
    notFound()
  }

  const modeSlug = modeToSlug(scenario.mode)

  return (
    <section
      className={`mode-shell mode-${modeSlug}`}
      style={{ minHeight: '100vh', backgroundImage: MODE_SURFACES[modeSlug] }}
    >
      <ScenarioCore scenarioId={id} routeVariant="mode" />
    </section>
  )
}
