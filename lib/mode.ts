import type { Scenario } from '@/lib/scenarios'

export type ModeSlug = 'simulation' | 'puzzle' | 'role-play' | 'strategy' | 'story'

const MODE_TO_SLUG: Record<Scenario['mode'], ModeSlug> = {
  Simulation: 'simulation',
  Puzzle: 'puzzle',
  'Role-Play': 'role-play',
  Strategy: 'strategy',
  Story: 'story',
}

const SLUG_TO_MODE: Record<ModeSlug, Scenario['mode']> = {
  simulation: 'Simulation',
  puzzle: 'Puzzle',
  'role-play': 'Role-Play',
  strategy: 'Strategy',
  story: 'Story',
}

export function modeToSlug(mode: Scenario['mode']): ModeSlug {
  return MODE_TO_SLUG[mode]
}

export function slugToMode(slug: string): Scenario['mode'] | null {
  return (SLUG_TO_MODE as Record<string, Scenario['mode'] | undefined>)[slug] ?? null
}
