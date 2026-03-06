'use client'

import { useParams } from 'next/navigation'
import ScenarioCore from './ScenarioCore'

export default function ScenarioPage() {
  const params = useParams<{ id: string }>()
  const scenarioId = params?.id ?? ''
  return <ScenarioCore scenarioId={scenarioId} />
}
