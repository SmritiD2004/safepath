import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import ScenarioCore from '@/app/scenario/[id]/ScenarioCore'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/scenarios', () => ({
  default: {
    'sim-1': {
      id: 'sim-1',
      title: 'Unit Test Scenario',
      category: 'Public Spaces',
      mode: 'Simulation',
      icon: 'A',
      difficulty: 1,
      duration: '5 min',
      color: '#ff6f91',
      triggerWarnings: [],
      estimatedMinutes: 5,
      tags: ['test'],
      intensity: 'low',
      context: 'Context',
      backgroundMood: 'linear-gradient(135deg, #111, #222)',
      startNodeId: 'n1',
      nodes: {
        n1: {
          id: 'n1',
          description: 'What do you do?',
          mood: 'neutral',
          choices: [
            {
              id: 'c1',
              text: 'Set boundary clearly',
              riskImpact: -2,
              eqImpact: 2,
              nextNodeId: 'n2',
              aiCoachNote: 'Boundary helps.',
            },
          ],
        },
        n2: {
          id: 'n2',
          description: 'End node',
          mood: 'resolved',
          isEnd: true,
          endType: 'safe',
          choices: [],
        },
      },
    },
  },
}))

describe('ScenarioCore', () => {
  beforeEach(() => {
    mockPush.mockReset()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) => {
        if (input.includes('/api/scenario-runs/start')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ runId: 'run-1' }),
          }) as Promise<Response>
        }

        if (input.includes('/api/coach/feedback')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              feedback: 'Great boundary setting.',
              hint: 'Stay near public support.',
              riskDelta: -2,
              eqDelta: 2,
              coachMood: 'encouraging',
            }),
          }) as Promise<Response>
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        }) as Promise<Response>
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts scenario and shows coaching feedback after choice', async () => {
    render(<ScenarioCore scenarioId="sim-1" />)

    expect(screen.getByText('Unit Test Scenario')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /begin/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /set boundary clearly/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /set boundary clearly/i }))

    await waitFor(() => {
      expect(screen.getByText(/safepath ai coach/i)).toBeInTheDocument()
      expect(screen.getByText(/great boundary setting\./i)).toBeInTheDocument()
    })
  })
})
