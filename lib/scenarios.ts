export interface Choice {
  id: string
  text: string
  riskImpact: number    // -20 to +20
  eqImpact: number      // -10 to +15
  nextNodeId: string | null
  aiCoachNote: string   // hint shown before AI response
}

export interface ScenarioNode {
  id: string
  description: string
  mood: 'tense' | 'neutral' | 'relieved' | 'escalated' | 'resolved'
  choices: Choice[]
  isEnd?: boolean
  endType?: 'safe' | 'partial' | 'learning'
  interactionType?: 'mcq' | 'red-flag' | 'match' | 'drag-drop' | 'whack-a-mole' | 'strategy-grid' | 'chat' | 'avatar-path'
  interactionData?: {
    text?: string
    targets?: string[]
    pairs?: Array<{ key: string; value: string }>
    correctBox?: string[]
    npcInitial?: string
    keywords?: string[]
    safeOption?: string
    riskyOption?: string
  }
}

export interface Scenario {
  id: string
  title: string
  category: string
  mode: 'Simulation' | 'Puzzle' | 'Role-Play' | 'Strategy' | 'Story'
  icon: string
  difficulty: number
  duration: string
  color: string
  triggerWarnings: string[]
  estimatedMinutes: number
  tags: string[]
  intensity: 'low' | 'medium' | 'high'
  context: string          // scene-setting paragraph
  backgroundMood: string   // CSS gradient for the background
  startNodeId: string
  nodes: Record<string, ScenarioNode>
}

type MiniScenarioSeed = {
  id: string
  title: string
  category: string
  mode: Scenario['mode']
  icon: string
  difficulty: number
  duration: string
  color: string
  triggerWarnings: string[]
  estimatedMinutes?: number
  tags?: string[]
  intensity?: Scenario['intensity']
  context: string
  backgroundMood: string
  prompt: string
  npcInitial?: string
  saferChoice: string
  assertiveChoice: string
  riskyChoice: string
  tip: string
}

function createMiniScenario(seed: MiniScenarioSeed): Scenario {
  const estimatedMinutes = seed.estimatedMinutes ?? (Number.parseInt(seed.duration, 10) || 7)
  const inferredIntensity: Scenario['intensity'] =
    seed.intensity ??
    (seed.difficulty >= 4 ? 'high' : seed.difficulty >= 2 ? 'medium' : 'low')
  const tags = seed.tags ?? [seed.category.toLowerCase().replace(/\s+/g, '-'), seed.mode.toLowerCase()]

  return {
    id: seed.id,
    title: seed.title,
    category: seed.category,
    mode: seed.mode,
    icon: seed.icon,
    difficulty: seed.difficulty,
    duration: seed.duration,
    color: seed.color,
    triggerWarnings: seed.triggerWarnings,
    estimatedMinutes,
    tags,
    intensity: inferredIntensity,
    context: seed.context,
    backgroundMood: seed.backgroundMood,
    startNodeId: 'n1',
    nodes: {
      n1: {
        id: 'n1',
        description: seed.prompt,
        mood: 'tense',
        interactionType: 
          seed.mode === 'Puzzle' ? (seed.id === 'interview-scam-call' ? 'red-flag' : 'match') :
          seed.mode === 'Strategy' ? 'strategy-grid' :
          seed.mode === 'Role-Play' ? 'chat' :
          seed.mode === 'Story' ? 'avatar-path' :
          seed.mode === 'Simulation' ? 'whack-a-mole' : 'mcq',
        interactionData: {
          text: seed.prompt,
          targets: seed.mode === 'Puzzle' && seed.id === 'interview-scam-call' ? ['scam', 'urgent', 'payment'] : 
                   seed.mode === 'Strategy' ? ['security', 'lights', 'crowd'] : undefined,
          pairs: seed.mode === 'Puzzle' && seed.id !== 'interview-scam-call' ? [
            { key: seed.title, value: seed.saferChoice },
            { key: 'Situational Awareness', value: seed.assertiveChoice }
          ] : undefined,
          npcInitial: seed.mode === 'Role-Play' ? (seed.npcInitial ?? `Hi there.`) : undefined,
          keywords: seed.mode === 'Role-Play' ? ['no', 'boundary', 'stop', 'respect'] : undefined,
          safeOption: seed.mode === 'Story' ? seed.saferChoice : undefined,
          riskyOption: seed.mode === 'Story' ? seed.riskyChoice : undefined,
        },
        choices: [
          {
            id: 'c1_safe',
            text: seed.saferChoice,
            riskImpact: -10,
            eqImpact: 12,
            nextNodeId: 'n2_safe',
            aiCoachNote: seed.tip,
          },
          {
            id: 'c1_assert',
            text: seed.assertiveChoice,
            riskImpact: -6,
            eqImpact: 9,
            nextNodeId: 'n2_assert',
            aiCoachNote: 'Assertive action helps when combined with situational awareness.',
          },
          {
            id: 'c1_risky',
            text: seed.riskyChoice,
            riskImpact: 9,
            eqImpact: 2,
            nextNodeId: 'n2_risky',
            aiCoachNote: 'This can feel easier in the moment but may increase exposure.',
          },
        ],
      },
      // ── Q2 ────────────────────────────────────────────────────────────
      n2_safe: {
        id: 'n2_safe',
        description:
          'Your first move lowered immediate risk. The other person pauses, and bystanders are nearby. What is your next step to secure the situation?',
        mood: 'neutral',
        interactionType: 'match',
        interactionData: {
          text: 'Combine safety layers for the best protection.',
          pairs: [
            { key: 'Staff Presence', value: 'Security Layer' },
            { key: 'Trusted Contact', value: 'Visibility Layer' }
          ]
        },
        choices: [
          {
            id: 'c2_safe_layered',
            text: 'Add a second safety layer: move to staff/security and update a trusted contact.',
            riskImpact: -10,
            eqImpact: 11,
            nextNodeId: 'n3_safe_a',
            aiCoachNote: 'Layered safety decisions create strong outcomes.',
          },
          {
            id: 'c2_safe_fast_exit',
            text: 'Exit quickly to a safer space and monitor from distance.',
            riskImpact: -6,
            eqImpact: 8,
            nextNodeId: 'n3_safe_b',
            aiCoachNote: 'Quick exit is useful; add reporting when possible.',
          },
          {
            id: 'c2_safe_reengage',
            text: 'Re-engage directly to "settle" the issue one-to-one.',
            riskImpact: 5,
            eqImpact: 1,
            nextNodeId: 'n3_safe_c',
            aiCoachNote: 'Re-engaging can reopen risk after initial safety.',
          },
        ],
      },
      n2_assert: {
        id: 'n2_assert',
        description:
          'Your boundary was clear. The situation is mixed: not fully resolved, but you have some control. What do you do next?',
        mood: 'tense',
        interactionType: 'match',
        interactionData: {
          text: 'Matching assertiveness with support structures.',
          pairs: [
            { key: 'Formal Support', value: 'Escalation' },
            { key: 'Distance', value: 'Stabilization' }
          ]
        },
        choices: [
          {
            id: 'c2_assert_support',
            text: 'Escalate appropriately: involve authority/support and document details.',
            riskImpact: -9,
            eqImpact: 10,
            nextNodeId: 'n3_assert_a',
            aiCoachNote: 'Assertiveness plus support usually gives better protection.',
          },
          {
            id: 'c2_assert_hold',
            text: 'Maintain distance and leave without further interaction.',
            riskImpact: -5,
            eqImpact: 7,
            nextNodeId: 'n3_assert_b',
            aiCoachNote: 'A valid stabilizing step; consider reporting if pattern repeats.',
          },
          {
            id: 'c2_assert_argue',
            text: 'Continue argument in place to prove a point.',
            riskImpact: 7,
            eqImpact: 0,
            nextNodeId: 'n3_assert_c',
            aiCoachNote: 'Prolonged confrontation can increase exposure.',
          },
        ],
      },
      n2_risky: {
        id: 'n2_risky',
        description:
          'Risk has increased. You still have a chance to recover if you act now with a focused safety step.',
        mood: 'escalated',
        interactionType: 'match',
        interactionData: {
          text: 'Identify recovery actions for high-risk situations.',
          pairs: [
            { key: 'Public Zone', value: 'Visibility' },
            { key: 'Formal Record', value: 'Report' }
          ]
        },
        choices: [
          {
            id: 'c2_risky_recover',
            text: 'Pause, seek visible support, and move to a controlled/public zone.',
            riskImpact: -12,
            eqImpact: 10,
            nextNodeId: 'n3_risky_a',
            aiCoachNote: 'Recovery choices matter; late correction still helps.',
          },
          {
            id: 'c2_risky_report',
            text: 'Immediately report and request active intervention.',
            riskImpact: -14,
            eqImpact: 11,
            nextNodeId: 'n3_risky_b',
            aiCoachNote: 'Escalating to formal support can reset safety quickly.',
          },
          {
            id: 'c2_risky_continue',
            text: 'Continue same path and avoid taking additional steps.',
            riskImpact: 8,
            eqImpact: -2,
            nextNodeId: 'n3_risky_c',
            aiCoachNote: 'Inaction after warning signs often worsens outcomes.',
          },
        ],
      },

      // ── Q3 ────────────────────────────────────────────────────────────
      n3_safe_a: {
        id: 'n3_safe_a',
        description:
          'Staff is present and your contact knows your location. A concerned bystander makes eye contact with you. Do you involve them?',
        mood: 'neutral',
        interactionType: 'mcq',
        choices: [
          { id: 'c3sa_1', text: 'Ask the bystander to stay close as a witness.', riskImpact: -8, eqImpact: 9, nextNodeId: 'n4_high', aiCoachNote: 'Witness presence is a strong deterrent and adds credibility.' },
          { id: 'c3sa_2', text: 'Handle it with staff only — keep it contained.', riskImpact: -4, eqImpact: 6, nextNodeId: 'n4_mid', aiCoachNote: 'Staff alone is still effective.' },
          { id: 'c3sa_3', text: 'Leave immediately without briefing anyone.', riskImpact: 4, eqImpact: 2, nextNodeId: 'n4_low', aiCoachNote: 'Leaving without a handoff can leave gaps in the safety loop.' },
        ],
      },
      n3_safe_b: {
        id: 'n3_safe_b',
        description:
          'You are in a safer area and your heart rate is settling. What do you do in the next 10 minutes to close the loop?',
        mood: 'relieved',
        interactionType: 'mcq',
        choices: [
          { id: 'c3sb_1', text: 'Log a formal report with location, time, and a description.', riskImpact: -9, eqImpact: 10, nextNodeId: 'n4_high', aiCoachNote: 'Documentation protects you and helps others in similar situations.' },
          { id: 'c3sb_2', text: 'Call a trusted friend and brief them on what happened.', riskImpact: -5, eqImpact: 8, nextNodeId: 'n4_mid', aiCoachNote: 'Social support aids processing and keeps you accountable.' },
          { id: 'c3sb_3', text: 'Ignore it — you are safe now, that is enough.', riskImpact: 3, eqImpact: 1, nextNodeId: 'n4_low', aiCoachNote: 'Skipping the debrief means the pattern may repeat for others.' },
        ],
      },
      n3_safe_c: {
        id: 'n3_safe_c',
        description:
          'Re-engaging escalated the tension. The person becomes verbally defensive. What is your recovery move?',
        mood: 'tense',
        interactionType: 'mcq',
        choices: [
          { id: 'c3sc_1', text: '"This conversation is over." Turn and walk away calmly.', riskImpact: -10, eqImpact: 11, nextNodeId: 'n4_mid', aiCoachNote: 'A clean exit after a misstep is still the right call.' },
          { id: 'c3sc_2', text: 'Call someone loudly so bystanders know you are not alone.', riskImpact: -7, eqImpact: 8, nextNodeId: 'n4_mid', aiCoachNote: 'Perceived social connection changes the dynamic quickly.' },
          { id: 'c3sc_3', text: 'Match their defensive tone to win the argument.', riskImpact: 9, eqImpact: -1, nextNodeId: 'n4_low', aiCoachNote: 'Matching aggression rarely de-escalates a situation.' },
        ],
      },
      n3_assert_a: {
        id: 'n3_assert_a',
        description:
          'The authority is now involved. They ask if you want to make a formal record. What do you decide?',
        mood: 'neutral',
        interactionType: 'mcq',
        choices: [
          { id: 'c3aa_1', text: 'Yes — provide full details and request a copy of the report.', riskImpact: -10, eqImpact: 12, nextNodeId: 'n4_high', aiCoachNote: 'A formal record is your strongest long-term protection.' },
          { id: 'c3aa_2', text: 'Verbal note only — keep it informal for now.', riskImpact: -5, eqImpact: 7, nextNodeId: 'n4_mid', aiCoachNote: 'Informal notes are better than nothing but give less legal protection.' },
          { id: 'c3aa_3', text: 'Decline — you do not want to make it a big deal.', riskImpact: 4, eqImpact: 2, nextNodeId: 'n4_low', aiCoachNote: 'Declining documentation leaves you unprotected if behaviour recurs.' },
        ],
      },
      n3_assert_b: {
        id: 'n3_assert_b',
        description:
          'You maintained distance, but later that day you receive an unexpected message from the same person. How do you respond?',
        mood: 'tense',
        interactionType: 'mcq',
        choices: [
          { id: 'c3ab_1', text: 'Do not reply. Screenshot and report to relevant authority.', riskImpact: -11, eqImpact: 11, nextNodeId: 'n4_high', aiCoachNote: 'Non-response plus evidence collection is the safest path.' },
          { id: 'c3ab_2', text: 'Reply once to set a final clear boundary, then block.', riskImpact: -6, eqImpact: 8, nextNodeId: 'n4_mid', aiCoachNote: 'One clear message then blocking is a reasonable response.' },
          { id: 'c3ab_3', text: 'Reply and try to resolve it over text.', riskImpact: 6, eqImpact: 2, nextNodeId: 'n4_low', aiCoachNote: 'Text conversations are hard to close cleanly.' },
        ],
      },
      n3_assert_c: {
        id: 'n3_assert_c',
        description:
          'The argument draws attention. A bystander steps in and asks if you need help. What do you do?',
        mood: 'escalated',
        interactionType: 'mcq',
        choices: [
          { id: 'c3ac_1', text: '"Yes, please stay with me."', riskImpact: -12, eqImpact: 12, nextNodeId: 'n4_mid', aiCoachNote: 'Accepting bystander support is smart, not a sign of weakness.' },
          { id: 'c3ac_2', text: 'Thank them, say you have it handled, then exit immediately.', riskImpact: -7, eqImpact: 7, nextNodeId: 'n4_mid', aiCoachNote: 'Self-exiting after acknowledgment is a strong recovery.' },
          { id: 'c3ac_3', text: 'Tell them to stay out of it and continue the argument.', riskImpact: 8, eqImpact: -2, nextNodeId: 'n4_low', aiCoachNote: 'Refusing help while escalating significantly increases risk.' },
        ],
      },
      n3_risky_a: {
        id: 'n3_risky_a',
        description:
          'You are in a visible zone and risk has dropped. A staff member approaches and asks if everything is okay. What do you say?',
        mood: 'neutral',
        interactionType: 'mcq',
        choices: [
          { id: 'c3ra_1', text: 'Explain what happened and ask them to stay visible nearby.', riskImpact: -10, eqImpact: 10, nextNodeId: 'n4_mid', aiCoachNote: 'Transparency with staff builds a reliable safety net.' },
          { id: 'c3ra_2', text: 'Say you are fine but move closer to the exit.', riskImpact: -4, eqImpact: 5, nextNodeId: 'n4_low', aiCoachNote: 'Partial action still helps but misses a support opportunity.' },
          { id: 'c3ra_3', text: 'Say nothing and walk away quickly.', riskImpact: 3, eqImpact: 1, nextNodeId: 'n4_low', aiCoachNote: 'Missed opportunity to activate an available support system.' },
        ],
      },
      n3_risky_b: {
        id: 'n3_risky_b',
        description:
          'Intervention is on the way. While waiting, the person approaches you again. What is your immediate action?',
        mood: 'escalated',
        interactionType: 'mcq',
        choices: [
          { id: 'c3rb_1', text: 'Stay visible and call out loudly if they come closer.', riskImpact: -11, eqImpact: 11, nextNodeId: 'n4_high', aiCoachNote: 'Visibility and noise are powerful protective tools.' },
          { id: 'c3rb_2', text: 'Move immediately toward the nearest group of people.', riskImpact: -8, eqImpact: 8, nextNodeId: 'n4_mid', aiCoachNote: 'Crowd proximity significantly reduces individual risk.' },
          { id: 'c3rb_3', text: 'Freeze and wait for them to pass.', riskImpact: 7, eqImpact: 0, nextNodeId: 'n4_low', aiCoachNote: 'Freezing in place is the least protective response.' },
        ],
      },
      n3_risky_c: {
        id: 'n3_risky_c',
        description:
          'The situation has escalated further and you feel unsafe. This is a critical moment. What is your immediate action?',
        mood: 'escalated',
        interactionType: 'mcq',
        choices: [
          { id: 'c3rc_1', text: 'Move urgently to the nearest staffed area and call for help loudly.', riskImpact: -14, eqImpact: 12, nextNodeId: 'n4_mid', aiCoachNote: 'Late action is still action — moving is always better than staying.' },
          { id: 'c3rc_2', text: 'Call someone loudly on your phone while moving away.', riskImpact: -9, eqImpact: 8, nextNodeId: 'n4_low', aiCoachNote: 'A live call signals you are connected and being monitored.' },
          { id: 'c3rc_3', text: 'Stay put and hope the situation resolves itself.', riskImpact: 10, eqImpact: -3, nextNodeId: 'n4_low', aiCoachNote: 'Passivity in escalated situations significantly increases risk.' },
        ],
      },

      // ── Q4 ────────────────────────────────────────────────────────────
      n4_high: {
        id: 'n4_high',
        description:
          'You are in a strong safety position. A witness who saw the incident asks if they should also report what they observed. What do you advise?',
        mood: 'neutral',
        interactionType: 'match',
        interactionData: {
          text: 'Match each witness action to its value.',
          pairs: [
            { key: 'Witness Report', value: 'Corroboration' },
            { key: 'Contact Details', value: 'Follow-up Support' }
          ]
        },
        choices: [
          { id: 'c4h_1', text: 'Yes — ask them to file a corroborating report and share their contact details.', riskImpact: -8, eqImpact: 10, nextNodeId: 'n5_final', aiCoachNote: 'Corroborating witnesses significantly strengthen a formal case.' },
          { id: 'c4h_2', text: 'It is up to them — you are already well protected.', riskImpact: -3, eqImpact: 6, nextNodeId: 'n5_final', aiCoachNote: 'Independent witness reports are valuable even when optional.' },
          { id: 'c4h_3', text: 'Ask them to stay out of it to avoid complications.', riskImpact: 2, eqImpact: 1, nextNodeId: 'n5_final', aiCoachNote: 'Declining witness support reduces your level of protection.' },
        ],
      },
      n4_mid: {
        id: 'n4_mid',
        description:
          'You are stable. The experience shook your confidence a little. What is your next step to rebuild?',
        mood: 'relieved',
        interactionType: 'mcq',
        choices: [
          { id: 'c4m_1', text: 'Speak to a counsellor, support group, or trusted mentor about it.', riskImpact: -6, eqImpact: 12, nextNodeId: 'n5_final', aiCoachNote: 'Processing difficult experiences strengthens long-term resilience.' },
          { id: 'c4m_2', text: 'Review your personal safety habits and update your plan.', riskImpact: -5, eqImpact: 9, nextNodeId: 'n5_final', aiCoachNote: 'Turning experience into preparation is a strong adaptive mindset.' },
          { id: 'c4m_3', text: 'Push through alone — you do not need help.', riskImpact: 2, eqImpact: 2, nextNodeId: 'n5_final', aiCoachNote: 'Avoiding support after stress can delay full recovery.' },
        ],
      },
      n4_low: {
        id: 'n4_low',
        description:
          'Risk remains elevated. You realize you need a clearer personal safety plan. What is your first concrete step?',
        mood: 'tense',
        interactionType: 'mcq',
        choices: [
          { id: 'c4l_1', text: 'Identify three safe zones you can reach quickly in your daily environment.', riskImpact: -10, eqImpact: 10, nextNodeId: 'n5_final', aiCoachNote: 'Pre-mapping safe zones dramatically improves your response speed.' },
          { id: 'c4l_2', text: 'Share your daily routes and schedule with a trusted contact.', riskImpact: -8, eqImpact: 9, nextNodeId: 'n5_final', aiCoachNote: 'Visibility to trusted people is a foundational safety layer.' },
          { id: 'c4l_3', text: 'Decide to be more careful next time, but make no specific changes.', riskImpact: 4, eqImpact: 1, nextNodeId: 'n5_final', aiCoachNote: 'Vague intentions without concrete action rarely change outcomes.' },
        ],
      },

      // ── Q5 ────────────────────────────────────────────────────────────
      n5_final: {
        id: 'n5_final',
        description:
          'Final step — safety debrief. Which statement best reflects what you have learned from this experience?',
        mood: 'neutral',
        interactionType: 'mcq',
        choices: [
          { id: 'c5_1', text: 'Early action, visibility, and layered support are my core safety toolkit.', riskImpact: -8, eqImpact: 12, nextNodeId: 'n_safe', aiCoachNote: 'This is the core insight of situational safety training. Well done.' },
          { id: 'c5_2', text: 'I need to practise recognizing warning signs before they escalate.', riskImpact: -5, eqImpact: 9, nextNodeId: 'n_partial', aiCoachNote: 'Pattern recognition is a learnable skill — keep practising.' },
          { id: 'c5_3', text: 'I am still unsure how I would handle this in real life.', riskImpact: 2, eqImpact: 4, nextNodeId: 'n_learning', aiCoachNote: 'Uncertainty is the beginning of learning. Replay to build confidence.' },
        ],
      },

      // ── END NODES ─────────────────────────────────────────────────────
      n_safe: {
        id: 'n_safe',
        description:
          'Excellent work across all five steps. You used layered safety — awareness, support structures, and controlled action — to stay in control throughout.',
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n_partial: {
        id: 'n_partial',
        description:
          'You handled the situation with growing confidence. A few decisions could be sharper, but your instincts are developing well. Keep building on this.',
        mood: 'relieved',
        isEnd: true,
        endType: 'partial',
        choices: [],
      },
      n_learning: {
        id: 'n_learning',
        description:
          'You completed all five steps. Some choices increased uncertainty, but finishing the full scenario is valuable practice. Replay to strengthen your safety instincts.',
        mood: 'escalated',
        isEnd: true,
        endType: 'learning',
        choices: [],
      },
    },
  }
}

const EXPANSION_SCENARIOS: Record<string, Scenario> = {
  'the-empty-elevator': createMiniScenario({
    id: 'the-empty-elevator',
    title: 'The Empty Elevator',
    category: 'Public Spaces',
    mode: 'Simulation',
    icon: '🏢',
    difficulty: 2,
    duration: '7 min',
    color: '#5a1228',
    triggerWarnings: ['Isolation anxiety'],
    context: 'You enter a nearly empty office building lift late in the evening.',
    backgroundMood: 'linear-gradient(135deg, #1a1a24 0%, #35213d 100%)',
    prompt: 'A stranger steps in and stands unusually close despite free space.',
    saferChoice: 'Step out at the next floor near security and wait.',
    assertiveChoice: 'Ask for personal space in a calm, firm tone.',
    riskyChoice: 'Ignore discomfort and continue silently.',
    tip: 'Distance and visible staff presence are powerful safety tools.',
  }),
  'hostel-gate-after-curfew': createMiniScenario({
    id: 'hostel-gate-after-curfew',
    title: 'Hostel Gate After Curfew',
    category: 'Campus Safety',
    mode: 'Strategy',
    icon: '🏫',
    difficulty: 2,
    duration: '8 min',
    color: '#7b1d3a',
    triggerWarnings: ['Night-time stress'],
    context: 'You return late and the hostel lane is quieter than usual.',
    backgroundMood: 'linear-gradient(135deg, #0f1123 0%, #2a1a38 100%)',
    prompt: 'Two unknown men are lingering near the gate, watching arrivals.',
    saferChoice: 'Call gate security before approaching and wait in a lit area.',
    assertiveChoice: 'Walk to a nearby shop and request escort support.',
    riskyChoice: 'Walk directly to the gate alone without alerting anyone.',
    tip: 'Pre-alerting trusted staff reduces uncertainty and response time.',
  }),
  'festival-crowd-pressure': createMiniScenario({
    id: 'festival-crowd-pressure',
    title: 'Festival Crowd Pressure',
    category: 'Public Events',
    mode: 'Simulation',
    icon: '🎪',
    difficulty: 3,
    duration: '9 min',
    color: '#a03c6f',
    triggerWarnings: ['Crowd pressure'],
    context: 'You are in a dense festival crowd near a temporary exit lane.',
    backgroundMood: 'linear-gradient(135deg, #2a1324 0%, #4d1c3e 100%)',
    prompt: 'Someone repeatedly pushes from behind and blocks your movement.',
    saferChoice: 'Move toward family/help desk and report crowd harassment.',
    assertiveChoice: 'Use loud voice to create space and request bystander support.',
    riskyChoice: 'Stay in the same pocket and hope it settles.',
    tip: 'In crowd scenarios, move toward controlled zones and officials.',
  }),
  'gym-trainer-boundaries': createMiniScenario({
    id: 'gym-trainer-boundaries',
    title: 'Gym Trainer Boundaries',
    category: 'Social Situations',
    mode: 'Role-Play',
    icon: '🏋️',
    difficulty: 2,
    duration: '7 min',
    color: '#8f2f4f',
    triggerWarnings: ['Boundary crossing'],
    context: 'During training, an instructor gives unsolicited personal comments.',
    backgroundMood: 'linear-gradient(135deg, #1d1f2c 0%, #3a2940 100%)',
    prompt: 'Comments shift from fitness guidance to appearance-focused remarks.',
    npcInitial: "Good set! You're really improving. You know honestly — you'd look even better if you dropped a bit around here. Just saying as your trainer, it's motivating feedback.",
    saferChoice: 'Report to manager and request another trainer immediately.',
    assertiveChoice: 'State clear boundary: keep feedback exercise-focused.',
    riskyChoice: 'Laugh it off to avoid awkwardness.',
    tip: 'Clear boundaries plus documentation protect future interactions.',
  }),
  'pg-owner-pressure': createMiniScenario({
    id: 'pg-owner-pressure',
    title: 'PG Owner Pressure',
    category: 'Accommodation',
    mode: 'Story',
    icon: '🏠',
    difficulty: 3,
    duration: '8 min',
    color: '#6b2d59',
    triggerWarnings: ['Power imbalance'],
    context: 'A paying-guest owner makes repeated intrusive personal questions.',
    backgroundMood: 'linear-gradient(135deg, #161828 0%, #30203b 100%)',
    prompt: 'The owner insists on entering your room without notice.',
    saferChoice: 'Document incidents and contact women’s hostel support network.',
    assertiveChoice: 'State tenancy boundaries and request written notice policy.',
    riskyChoice: 'Allow it to avoid conflict.',
    tip: 'Housing boundaries should be explicit and documented.',
  }),
  'interview-scam-call': createMiniScenario({
    id: 'interview-scam-call',
    title: 'Interview Scam Call',
    category: 'Online Safety',
    mode: 'Puzzle',
    icon: '📞',
    difficulty: 2,
    duration: '6 min',
    color: '#5d3d9a',
    triggerWarnings: ['Scam attempt'],
    context: 'You get a call claiming urgent interview processing fee payment.',
    backgroundMood: 'linear-gradient(135deg, #11172d 0%, #27345f 100%)',
    prompt: 'Caller pressures immediate payment using UPI to confirm your slot.',
    saferChoice: 'Verify company details independently before any payment.',
    assertiveChoice: 'Ask for official mail and disconnect pending verification.',
    riskyChoice: 'Pay quickly to avoid “missing the opportunity”.',
    tip: 'Urgency + payment demand is a classic scam marker.',
  }),
  'cafe-wifi-trap': createMiniScenario({
    id: 'cafe-wifi-trap',
    title: 'Cafe Wi-Fi Trap',
    category: 'Digital Security',
    mode: 'Puzzle',
    icon: '📶',
    difficulty: 2,
    duration: '6 min',
    color: '#2f5c88',
    triggerWarnings: ['Data theft risk'],
    context: 'A free Wi-Fi portal asks extra permissions and OTP verification.',
    backgroundMood: 'linear-gradient(135deg, #0f1f31 0%, #1f4567 100%)',
    prompt: 'A nearby stranger offers to “help” by taking your phone.',
    saferChoice: 'Disconnect and use mobile data for sensitive tasks.',
    assertiveChoice: 'Decline help and verify network name with staff.',
    riskyChoice: 'Share device and OTP to finish quickly.',
    tip: 'Never share OTP/device control in public networks.',
  }),
  'friends-party-exit-plan': createMiniScenario({
    id: 'friends-party-exit-plan',
    title: 'Friend’s Party Exit Plan',
    category: 'Social Situations',
    mode: 'Strategy',
    icon: '🎉',
    difficulty: 2,
    duration: '7 min',
    color: '#9a3f63',
    triggerWarnings: ['Peer pressure'],
    context: 'At a house party, your ride cancels and the group insists you stay late.',
    backgroundMood: 'linear-gradient(135deg, #241427 0%, #4a2041 100%)',
    prompt: 'Someone offers a ride but your intuition flags uncertainty.',
    saferChoice: 'Book verified transport and wait with trusted friend.',
    assertiveChoice: 'Share live location and trip details before leaving.',
    riskyChoice: 'Accept unknown ride due to social pressure.',
    tip: 'Have an independent exit plan before high-social settings.',
  }),
  'market-lane-shortcut': createMiniScenario({
    id: 'market-lane-shortcut',
    title: 'Market Lane Shortcut',
    category: 'Travel',
    mode: 'Simulation',
    icon: '🛍️',
    difficulty: 2,
    duration: '7 min',
    color: '#7d3b2f',
    triggerWarnings: ['Route safety'],
    context: 'A vendor suggests a shortcut through a less lit lane.',
    backgroundMood: 'linear-gradient(135deg, #2b1a16 0%, #4c2c25 100%)',
    prompt: 'You are carrying bags and it is getting dark.',
    saferChoice: 'Take the longer main road with active foot traffic.',
    assertiveChoice: 'Request directions from verified police/help booth.',
    riskyChoice: 'Take the isolated shortcut to save time.',
    tip: 'Predictable busy routes often reduce risk exposure.',
  }),
  'office-cab-group-drop': createMiniScenario({
    id: 'office-cab-group-drop',
    title: 'Office Cab Group Drop',
    category: 'Work Commute',
    mode: 'Strategy',
    icon: '🚐',
    difficulty: 3,
    duration: '8 min',
    color: '#3d4a8a',
    triggerWarnings: ['Commute vulnerability'],
    context: 'You are last in a shared office cab and route changes unexpectedly.',
    backgroundMood: 'linear-gradient(135deg, #14192f 0%, #29346c 100%)',
    prompt: 'Driver says company app is “glitching” and ignores mapped route.',
    saferChoice: 'Call company transport desk and request route correction.',
    assertiveChoice: 'Share trip tracking with family and request public stop.',
    riskyChoice: 'Stay silent because drop point is “almost there”.',
    tip: 'When route deviates, create immediate external visibility.',
  }),
  'co-working-space-stranger': createMiniScenario({
    id: 'co-working-space-stranger',
    title: 'Co-working Space Stranger',
    category: 'Workplace',
    mode: 'Role-Play',
    icon: '💻',
    difficulty: 2,
    duration: '6 min',
    color: '#6c3665',
    triggerWarnings: ['Persistent approach'],
    context: 'A stranger repeatedly interrupts your table despite polite refusal.',
    backgroundMood: 'linear-gradient(135deg, #18182a 0%, #322648 100%)',
    prompt: 'They ask personal questions and try to sit close repeatedly.',
    npcInitial: "Hey! You look really focused — what do you do? Which company? Do you live around here? I'm Arjun, I run a small startup. Can I sit here for a bit?",
    saferChoice: 'Move to staffed desk area and inform co-working reception.',
    assertiveChoice: 'Set direct boundary and mention formal complaint option.',
    riskyChoice: 'Continue engaging to avoid appearing rude.',
    tip: 'Respectful firmness is appropriate in repeated boundary tests.',
  }),
  'apartment-delivery-check': createMiniScenario({
    id: 'apartment-delivery-check',
    title: 'Apartment Delivery Check',
    category: 'Home Safety',
    mode: 'Simulation',
    icon: '📦',
    difficulty: 2,
    duration: '6 min',
    color: '#7a5a2d',
    triggerWarnings: ['Impersonation risk'],
    context: 'Someone claims to deliver a parcel but the app shows no order.',
    backgroundMood: 'linear-gradient(135deg, #2a2214 0%, #5a4a2a 100%)',
    prompt: 'The person insists you open the door to “verify address.”',
    saferChoice: 'Confirm via app and ask security to handle the interaction.',
    assertiveChoice: 'Speak through door camera/intercom only.',
    riskyChoice: 'Open the door to check quickly.',
    tip: 'Verification before access is essential for home safety.',
  }),
  'classroom-group-chat-leak': createMiniScenario({
    id: 'classroom-group-chat-leak',
    title: 'Classroom Group Chat Leak',
    category: 'Online Safety',
    mode: 'Story',
    icon: '🧩',
    difficulty: 2,
    duration: '7 min',
    color: '#3f5c9b',
    triggerWarnings: ['Privacy breach'],
    context: 'A private screenshot from your class group appears on another page.',
    backgroundMood: 'linear-gradient(135deg, #13203a 0%, #274681 100%)',
    prompt: 'A classmate asks you not to report because it could “create drama.”',
    saferChoice: 'Report with evidence and ask admin to enforce guidelines.',
    assertiveChoice: 'Address breach directly in moderated group setting.',
    riskyChoice: 'Ignore it and hope the issue fades.',
    tip: 'Timely reporting limits spread and protects others.',
  }),
  'railway-platform-delay': createMiniScenario({
    id: 'railway-platform-delay',
    title: 'Railway Platform Delay',
    category: 'Public Transport',
    mode: 'Simulation',
    icon: '🚉',
    difficulty: 3,
    duration: '8 min',
    color: '#8b2f40',
    triggerWarnings: ['Night wait anxiety'],
    context: 'Your train is delayed and platform footfall drops late at night.',
    backgroundMood: 'linear-gradient(135deg, #1b1218 0%, #3d1e2a 100%)',
    prompt: 'A person repeatedly circles your area and stares at your phone.',
    saferChoice: 'Move near RPF help desk and avoid isolated sections.',
    assertiveChoice: 'Join a family group nearby and stay visible.',
    riskyChoice: 'Remain seated alone in the same isolated spot.',
    tip: 'At transit hubs, prioritize staffed and visible zones.',
  }),
  'internship-mentor-messages': createMiniScenario({
    id: 'internship-mentor-messages',
    title: 'Internship Mentor Messages',
    category: 'Workplace',
    mode: 'Role-Play',
    icon: '📚',
    difficulty: 3,
    duration: '8 min',
    color: '#7a2e58',
    triggerWarnings: ['Professional boundary crossing'],
    context: 'A mentor starts messaging late night with personal comments.',
    backgroundMood: 'linear-gradient(135deg, #211225 0%, #431f44 100%)',
    prompt: 'They imply project opportunities depend on being “friendly.”',
    npcInitial: "You did really well in today's client meeting. I think you have genuine potential here. Why don't we catch up this weekend over coffee — just the two of us?",
    saferChoice: 'Document messages and escalate through internship coordinator.',
    assertiveChoice: 'Set communication boundary to official channels only.',
    riskyChoice: 'Reply casually to keep opportunities open.',
    tip: 'Career opportunities should never depend on personal compliance.',
  }),
  'cab-co-passenger-pressure': createMiniScenario({
    id: 'cab-co-passenger-pressure',
    title: 'Cab Co-Passenger Pressure',
    category: 'Travel',
    mode: 'Role-Play',
    icon: '🚕',
    difficulty: 2,
    duration: '7 min',
    color: '#8c2f66',
    triggerWarnings: ['Personal boundary pressure'],
    context: 'A co-passenger in a shared cab keeps asking personal details and drop location.',
    backgroundMood: 'linear-gradient(135deg, #1f1224 0%, #3f1f44 100%)',
    prompt: 'They insist on walking you to your gate and ask you to unlock location sharing.',
    npcInitial: "Hey, where are you headed? Koramangala? Me too — maybe we can share the drop? Actually where exactly do you stay? I know that area really well.",
    saferChoice: 'Decline firmly, alert driver support, and exit near a visible point.',
    assertiveChoice: 'State clear boundary and message trusted contact with trip details.',
    riskyChoice: 'Share details to avoid awkwardness.',
    tip: 'You never owe personal details to strangers in transit.',
  }),
  'campus-event-follow-up': createMiniScenario({
    id: 'campus-event-follow-up',
    title: 'Campus Event Follow-up',
    category: 'Campus Safety',
    mode: 'Role-Play',
    icon: '🎓',
    difficulty: 2,
    duration: '7 min',
    color: '#9a3d74',
    triggerWarnings: ['Repeated contact'],
    context: 'After a campus event, someone repeatedly messages and pushes for a private meetup.',
    backgroundMood: 'linear-gradient(135deg, #221329 0%, #442647 100%)',
    prompt: 'They claim they can help with opportunities if you meet alone tonight.',
    npcInitial: "You were honestly the best at the panel today — I’ve been looking for someone like you. Can we meet tonight, just for an hour? I have a contact who can seriously accelerate your career.",
    saferChoice: 'Refuse private meeting and escalate to event coordinator if pressure continues.',
    assertiveChoice: 'Set boundary: communicate only in official group channels.',
    riskyChoice: 'Agree to meet because it may help your profile.',
    tip: 'Professional opportunities should stay transparent and verifiable.',
  }),
  'ride-share-otp-trick': createMiniScenario({
    id: 'ride-share-otp-trick',
    title: 'Ride-Share OTP Trick',
    category: 'Travel',
    mode: 'Strategy',
    icon: '🚖',
    difficulty: 3,
    duration: '8 min',
    color: '#2f4f7a',
    triggerWarnings: ['Social engineering', 'Travel risk'],
    context: 'A person claims your booked ride is delayed and asks for your trip OTP to "reassign quickly."',
    backgroundMood: 'linear-gradient(135deg, #141c2f 0%, #2d4468 100%)',
    prompt: 'They mention your pickup area correctly, making the request seem legitimate.',
    saferChoice: 'Refuse sharing OTP and verify only through the official app.',
    assertiveChoice: 'Report suspicious contact to platform support immediately.',
    riskyChoice: 'Share OTP to avoid waiting longer.',
    tip: 'Trip OTP is equivalent to ride control. Never share outside app flow.',
  }),
  'library-study-corner': createMiniScenario({
    id: 'library-study-corner',
    title: 'Library Study Corner',
    category: 'Campus Safety',
    mode: 'Simulation',
    icon: '📚',
    difficulty: 2,
    duration: '7 min',
    color: '#6b3c6f',
    triggerWarnings: ['Persistent attention'],
    context: 'You are studying in a quiet library wing when someone repeatedly tries to sit too close.',
    backgroundMood: 'linear-gradient(135deg, #1f1730 0%, #3f2752 100%)',
    prompt: 'Even after moving once, the person follows and starts personal conversation.',
    saferChoice: 'Move to staffed desk area and inform library security.',
    assertiveChoice: 'State clearly that you want to study alone and need space.',
    riskyChoice: 'Continue engaging to avoid appearing impolite.',
    tip: 'In quiet spaces, involving staff early is safer than repeated relocation.',
  }),
}

const SCENARIOS: Record<string, Scenario> = {
  'bus-harassment': {
    id: 'bus-harassment',
    title: 'The Crowded Bus',
    category: 'Public Transport',
    mode: 'Simulation',
    icon: '🚌',
    difficulty: 2,
    duration: '12 min',
    color: '#7b1d3a',
    triggerWarnings: ['Physical proximity', 'Verbal harassment'],
    estimatedMinutes: 12,
    tags: ['public-transport', 'bystander-support', 'boundary-setting'],
    intensity: 'medium',
    backgroundMood: 'linear-gradient(135deg, #1a0a0f 0%, #3d1020 100%)',
    context: "It's 8:45 AM. The bus is packed — every handle taken, bodies pressed close. You have 20 minutes until your stop. You notice the person behind you is standing uncomfortably close, despite there being slight room to shift.",
    startNodeId: 'n1',
    nodes: {
      n1: {
        id: 'n1',
        description: "The bus lurches. The person behind you uses the movement to press closer. You feel their hand graze your back — it could be accidental. It happens again. Other passengers are absorbed in their phones.",
        mood: 'tense',
        interactionType: 'whack-a-mole',
        interactionData: {
          text: "Identify the subtle signs of physical harassment in this crowded space.",
          targets: ['physical proximity', 'hand graze', 'repeated contact']
        },
        choices: [
          { id: 'c1a', text: 'Shift forward and create distance', riskImpact: -10, eqImpact: 8, nextNodeId: 'n2a', aiCoachNote: 'Assertive repositioning without confrontation' },
          { id: 'c1b', text: 'Turn and make eye contact, then look away firmly', riskImpact: -8, eqImpact: 10, nextNodeId: 'n2b', aiCoachNote: 'Non-verbal boundary signal' },
          { id: 'c1c', text: 'Stay still — might be accidental', riskImpact: 5, eqImpact: 2, nextNodeId: 'n2c', aiCoachNote: 'Inaction in ambiguous situations' },
          { id: 'c1d', text: 'Loudly say "Could you please step back?"', riskImpact: -15, eqImpact: 12, nextNodeId: 'n2d', aiCoachNote: 'Public assertion — effective but requires confidence' },
        ],
      },
      n2a: {
        id: 'n2a',
        description: "You move forward. The person follows within seconds. The behaviour was not accidental. A woman nearby notices and meets your eyes briefly.",
        mood: 'tense',
        interactionType: 'chat',
        interactionData: {
          npcInitial: "I saw that... do you need some help or should I call the conductor?",
          keywords: ['help', 'yes', 'please', 'front', 'thank you']
        },
        choices: [
          { id: 'c2a1', text: 'Make eye contact with the woman — signal for help', riskImpact: -15, eqImpact: 14, nextNodeId: 'n3_help', aiCoachNote: 'Bystander activation — highly effective' },
          { id: 'c2a2', text: 'Move to the front of the bus near the driver', riskImpact: -12, eqImpact: 8, nextNodeId: 'n3_front', aiCoachNote: 'Seeking visible authority presence' },
          { id: 'c2a3', text: 'Take out your phone and appear to call someone', riskImpact: -8, eqImpact: 6, nextNodeId: 'n3_phone', aiCoachNote: 'De-escalation through perceived social connection' },
        ],
      },
      n2b: {
        id: 'n2b',
        description: "Your eye contact registered. They pause briefly, then the contact resumes. They're testing boundaries. You have information now — this is deliberate.",
        mood: 'escalated',
        interactionType: 'red-flag',
        interactionData: {
          text: "Testing boundaries. Deliberate contact. Resumes after eye contact. Heart racing.",
          targets: ['testing boundaries', 'deliberate contact', 'resumes']
        },
        choices: [
          { id: 'c2b1', text: 'Speak firmly: "I need you to step back. Now."', riskImpact: -18, eqImpact: 15, nextNodeId: 'n3_confront', aiCoachNote: 'Direct verbal boundary — you have read the situation correctly' },
          { id: 'c2b2', text: 'Walk to the door and wait for the next stop', riskImpact: -10, eqImpact: 7, nextNodeId: 'n3_exit', aiCoachNote: 'Choosing safety over convenience' },
          { id: 'c2b3', text: 'Tell the bus conductor or driver', riskImpact: -16, eqImpact: 12, nextNodeId: 'n3_report', aiCoachNote: 'Involving authority — reduces personal risk' },
        ],
      },
      n2c: {
        id: 'n2c',
        description: "The contact continues — more deliberate now. Your discomfort is real. A voice in your head says 'don't make a scene.' But your body is telling you something important.",
        mood: 'escalated',
        interactionType: 'match',
        interactionData: {
          text: 'Trust your body over social conditioning.',
          pairs: [
            { key: 'Discomfort', value: 'Boundary Violation' },
            { key: 'Instinct', value: 'Safety Signal' }
          ]
        },
        choices: [
          { id: 'c2c1', text: 'Trust your instincts — speak up now', riskImpact: -12, eqImpact: 14, nextNodeId: 'n3_confront', aiCoachNote: 'Delayed but important: trusting gut feeling' },
          { id: 'c2c2', text: 'Move away and activate bystander', riskImpact: -14, eqImpact: 10, nextNodeId: 'n3_help', aiCoachNote: 'Recovery from freeze response' },
        ],
      },
      n2d: {
        id: 'n2d',
        description: "The bus goes quieter. Heads turn. The person steps back, face reddening. A few passengers look at you - one gives a small nod. Your heart is racing but the space is clear.",
        mood: 'relieved',
        interactionType: 'red-flag',
        interactionData: {
          text: "The person steps back. Space is clear. Handled the moment.",
          targets: ['steps back', 'space is clear', 'handled']
        },
        choices: [
          { id: 'c2d1', text: 'Stay near the front, remain alert', riskImpact: -5, eqImpact: 10, nextNodeId: 'n2e', aiCoachNote: 'Appropriate follow-through after assertion' },
          { id: 'c2d2', text: 'Continue your journey calmly - you handled it', riskImpact: -8, eqImpact: 12, nextNodeId: 'n_end_strong', aiCoachNote: 'Resolution through confident action' },
        ],
      },
      n2e: {
        id: 'n2e',
        description: "You have regained control, but the bus remains crowded and dynamic. Do you close the loop now or just continue?",
        mood: 'neutral',
        interactionType: 'match',
        interactionData: {
          text: 'Closing the safety loop.',
          pairs: [
            { key: 'Formal Record', value: 'Accountability' },
            { key: 'Vigilance', value: 'Preparedness' }
          ]
        },
        choices: [
          { id: 'c2e1', text: 'Quietly inform conductor with route/time details', riskImpact: -8, eqImpact: 11, nextNodeId: 'n3_report', aiCoachNote: 'Reporting creates accountability and helps others.' },
          { id: 'c2e2', text: 'Maintain distance and continue without reporting', riskImpact: -4, eqImpact: 7, nextNodeId: 'n3_vigilant', aiCoachNote: 'Still safe, but less systemic follow-through.' },
        ],
      },
      n3_help: {
        id: 'n3_help',
        description: "The woman understands instantly. She moves next to you and starts chatting naturally — 'Hi! Didn't see you there!' The behaviour stops. You feel a wave of relief. What do you do next to close the loop?",
        mood: 'relieved',
        interactionType: 'mcq',
        choices: [
          { id: 'nh_1', text: 'Thank her, then file a report so the incident is on record.', riskImpact: -8, eqImpact: 10, nextNodeId: 'bus_q4', aiCoachNote: 'Bystander support + reporting is the full protective loop.' },
          { id: 'nh_2', text: 'Stay near her for the rest of the journey, then continue your day.', riskImpact: -5, eqImpact: 7, nextNodeId: 'bus_q4', aiCoachNote: 'Continued proximity to support is a smart choice.' },
          { id: 'nh_3', text: 'Get off at the next stop even though it is early.', riskImpact: -3, eqImpact: 5, nextNodeId: 'bus_q4', aiCoachNote: 'Prioritizing safety over inconvenience is always valid.' },
        ],
      },
      n3_front: {
        id: 'n3_front',
        description: "Near the driver, you have visibility and a witness. The person does not follow. You reach your stop safely. The driver notices your expression and nods. What is your next step?",
        mood: 'relieved',
        interactionType: 'mcq',
        choices: [
          { id: 'nf_1', text: 'Tell the driver what happened before you get off.', riskImpact: -8, eqImpact: 10, nextNodeId: 'bus_q4', aiCoachNote: 'The driver can alert authorities or flag the route.' },
          { id: 'nf_2', text: 'Exit calmly and message a trusted contact about the incident.', riskImpact: -5, eqImpact: 7, nextNodeId: 'bus_q4', aiCoachNote: 'Keeping someone informed is a key safety habit.' },
          { id: 'nf_3', text: 'Exit and continue your day — you handled it.', riskImpact: -2, eqImpact: 5, nextNodeId: 'bus_q4', aiCoachNote: 'You did well, though a brief report adds systemic protection.' },
        ],
      },
      n3_phone: {
        id: 'n3_phone',
        description: "The perceived social connection shifted the dynamic. The person moves away by the next stop. You arrive safely. Reflecting on it, what do you want to do before the day ends?",
        mood: 'relieved',
        interactionType: 'mcq',
        choices: [
          { id: 'np_1', text: 'Log the incident on the city transport harassment report portal.', riskImpact: -8, eqImpact: 10, nextNodeId: 'bus_q4', aiCoachNote: 'Digital reporting portals exist specifically for this — use them.' },
          { id: 'np_2', text: 'Brief a trusted friend in detail so someone knows.', riskImpact: -5, eqImpact: 8, nextNodeId: 'bus_q4', aiCoachNote: 'Verbal debrief aids processing and creates a social record.' },
          { id: 'np_3', text: 'Move on — you did not directly confront, so it probably was not serious.', riskImpact: 3, eqImpact: 2, nextNodeId: 'bus_q4', aiCoachNote: 'Dismissing your discomfort can prevent you from taking protective steps next time.' },
        ],
      },
      n3_confront: {
        id: 'n3_confront',
        description: "Your firm words land. The person steps back. Other passengers are aware. You ride with your head high and space intact. Now that you have asserted yourself, what is your follow-through?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'nc_1', text: 'Quietly report to the conductor with route and time details.', riskImpact: -8, eqImpact: 10, nextNodeId: 'bus_q4', aiCoachNote: 'Reporting after confrontation creates accountability.' },
          { id: 'nc_2', text: 'Stay alert and near other passengers until your stop.', riskImpact: -5, eqImpact: 7, nextNodeId: 'bus_q4', aiCoachNote: 'Sustained vigilance after assertion is smart, not paranoid.' },
          { id: 'nc_3', text: 'Relax completely — it is over.', riskImpact: 1, eqImpact: 5, nextNodeId: 'bus_q4', aiCoachNote: 'It may be over, but staying mildly alert is still wise.' },
        ],
      },
      n3_exit: {
        id: 'n3_exit',
        description: "You exit one stop early. In the fresh air, you feel safe. You pull out your phone. What do you do in the next five minutes?",
        mood: 'relieved',
        interactionType: 'mcq',
        choices: [
          { id: 'ne_1', text: 'Document the incident on the city transport app with time and route.', riskImpact: -9, eqImpact: 10, nextNodeId: 'bus_q4', aiCoachNote: 'Documentation immediately after is most accurate and impactful.' },
          { id: 'ne_2', text: 'Call a friend to process what happened.', riskImpact: -5, eqImpact: 8, nextNodeId: 'bus_q4', aiCoachNote: 'Social processing reduces stress and reinforces your instincts.' },
          { id: 'ne_3', text: 'Walk quickly to your destination and forget it.', riskImpact: 2, eqImpact: 3, nextNodeId: 'bus_q4', aiCoachNote: 'Not reporting means the pattern continues for the next person.' },
        ],
      },
      n3_report: {
        id: 'n3_report',
        description: "The conductor speaks to the person, who exits at the next stop. A formal complaint is logged. You continue in a cleared space. As you near your stop, what do you do?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'nr_1', text: 'Request a copy of the complaint reference for your records.', riskImpact: -8, eqImpact: 11, nextNodeId: 'bus_q4', aiCoachNote: 'Having a complaint reference number protects you for any follow-up.' },
          { id: 'nr_2', text: 'Thank the conductor and continue your journey mindfully.', riskImpact: -4, eqImpact: 7, nextNodeId: 'bus_q4', aiCoachNote: 'You acted well — staying grounded is the right follow-through.' },
          { id: 'nr_3', text: 'Exit quickly and hope the process takes care of itself.', riskImpact: 0, eqImpact: 4, nextNodeId: 'bus_q4', aiCoachNote: 'Formal processes work better when you follow through.' },
        ],
      },
      n3_vigilant: {
        id: 'n3_vigilant',
        description: "You stay alert near the driver. The person keeps distance. You arrive safely. Vigilance after assertion is smart. At your stop, how do you close this out?",
        mood: 'relieved',
        interactionType: 'mcq',
        choices: [
          { id: 'nv_1', text: 'File a brief incident note via the transport helpline.', riskImpact: -7, eqImpact: 9, nextNodeId: 'bus_q4', aiCoachNote: 'A helpline report adds an official record with minimal effort.' },
          { id: 'nv_2', text: 'Tell a friend in detail — social records matter too.', riskImpact: -5, eqImpact: 7, nextNodeId: 'bus_q4', aiCoachNote: 'Your story told to trusted people becomes a form of safety record.' },
          { id: 'nv_3', text: 'Put it behind you — you stayed safe, that is enough.', riskImpact: 1, eqImpact: 4, nextNodeId: 'bus_q4', aiCoachNote: 'Understandable, but reporting helps protect others on the same route.' },
        ],
      },
      n_end_strong: {
        id: 'n_end_strong',
        description: "You acted quickly, spoke clearly, and protected your space. The journey continues without incident. Now: what do you do to reinforce this win?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'nes_1', text: 'Write down what worked so you can remember it for next time.', riskImpact: -6, eqImpact: 12, nextNodeId: 'bus_q4', aiCoachNote: 'Capturing what worked turns a one-off win into a repeatable skill.' },
          { id: 'nes_2', text: 'Share the experience with a friend to normalise speaking up.', riskImpact: -4, eqImpact: 9, nextNodeId: 'bus_q4', aiCoachNote: 'Sharing builds collective awareness and encourages others.' },
          { id: 'nes_3', text: 'Nothing — it worked out, that is enough.', riskImpact: 0, eqImpact: 4, nextNodeId: 'bus_q4', aiCoachNote: 'Reflection turns experience into lasting preparedness.' },
        ],
      },

      // ── Q4 + Q5 shared nodes for bus-harassment ────────────────────
      bus_q4: {
        id: 'bus_q4',
        description: 'Reflecting on the full journey: you faced a real threat and responded. Which element of your response do you think was most effective?',
        mood: 'neutral',
        interactionType: 'match',
        interactionData: {
          text: 'Match each action to its safety impact.',
          pairs: [
            { key: 'Creating Distance', value: 'Reduces Immediate Risk' },
            { key: 'Involving Others', value: 'Builds a Safety Net' }
          ]
        },
        choices: [
          { id: 'bq4_1', text: 'Creating distance and seeking visible authority.', riskImpact: -6, eqImpact: 9, nextNodeId: 'bus_q5', aiCoachNote: 'Physical repositioning is the fastest risk reducer in transit.' },
          { id: 'bq4_2', text: 'Involving a bystander or staff member.', riskImpact: -7, eqImpact: 11, nextNodeId: 'bus_q5', aiCoachNote: 'Social support turns individual risk into shared accountability.' },
          { id: 'bq4_3', text: 'Speaking up firmly and clearly.', riskImpact: -8, eqImpact: 12, nextNodeId: 'bus_q5', aiCoachNote: 'Verbal assertion signals confidence and often stops behaviour immediately.' },
        ],
      },
      bus_q5: {
        id: 'bus_q5',
        description: 'Final debrief. What single habit will you build from this experience to make future journeys safer?',
        mood: 'neutral',
        interactionType: 'mcq',
        choices: [
          { id: 'bq5_1', text: 'Always identify two exit points when boarding public transport.', riskImpact: -8, eqImpact: 12, nextNodeId: 'bus_end_safe', aiCoachNote: 'Pre-scanning exits is a core situational awareness habit.' },
          { id: 'bq5_2', text: 'Keep a trusted contact informed of my route in real time.', riskImpact: -6, eqImpact: 10, nextNodeId: 'bus_end_partial', aiCoachNote: 'Live location sharing adds a passive safety layer at zero cost.' },
          { id: 'bq5_3', text: 'Try to stay calm and hope situations resolve themselves.', riskImpact: 3, eqImpact: 3, nextNodeId: 'bus_end_learning', aiCoachNote: 'Passive hope is not a safety plan. Active habits make the difference.' },
        ],
      },
      bus_end_safe: {
        id: 'bus_end_safe',
        description: 'Outstanding. You navigated five decision points with strong situational awareness, support-seeking, and follow-through. You are building real safety skills.',
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      bus_end_partial: {
        id: 'bus_end_partial',
        description: 'Well done. You made solid decisions and finished with a useful habit. A few steps could be sharper, but your confidence and instincts are growing.',
        mood: 'relieved',
        isEnd: true,
        endType: 'partial',
        choices: [],
      },
      bus_end_learning: {
        id: 'bus_end_learning',
        description: 'You completed the full scenario. Some choices left risk higher than needed, but every run builds awareness. Replay to sharpen the decisions that felt uncertain.',
        mood: 'escalated',
        isEnd: true,
        endType: 'learning',
        choices: [],
      },
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // Workplace Boundary scenario (unchanged)
  // ──────────────────────────────────────────────────────────────────────
  'workplace-boundary': {
    id: 'workplace-boundary',
    title: 'The Senior Colleague',
    category: 'Workplace',
    mode: 'Simulation',
    icon: '💼',
    difficulty: 3,
    duration: '15 min',
    color: '#9b3060',
    triggerWarnings: ['Workplace harassment', 'Power imbalance'],
    estimatedMinutes: 15,
    tags: ['workplace', 'posh', 'documentation'],
    intensity: 'high',
    backgroundMood: 'linear-gradient(135deg, #0f1729 0%, #1e2d4a 100%)',
    context: "You've been at this company for 3 months. Rohan, your team lead — 10 years your senior — has been gradually making comments that feel off. Today in the post-meeting coffee area, with only one other person present, he says: 'You always dress so professionally. Better than the other girls on the team.'",
    startNodeId: 'n1',
    nodes: {
      n1: {
        id: 'n1',
        description: "Rohan smiles after saying it. The other person nearby looks at their phone. The comment sits in your chest — you know it was inappropriate, but you're new, and he controls your project allocation. What do you do?",
        mood: 'tense',
        interactionType: 'chat',
        interactionData: {
          npcInitial: "You always dress so professionally Rohan says, leaning in slightly. Better than the other girls on the team, don't you think?",
          keywords: ['boundary', 'work', 'professional', 'uncomfortable', 'stop']
        },
        choices: [
          { id: 'c1a', text: 'Smile politely and change the subject', riskImpact: 8, eqImpact: 3, nextNodeId: 'n2a', aiCoachNote: 'Common response — but signals the behaviour is acceptable' },
          { id: 'c1b', text: "Say calmly: \"I'd prefer you focus on my work, not my appearance\"", riskImpact: -12, eqImpact: 15, nextNodeId: 'n2b', aiCoachNote: 'Assertive, professional boundary-setting' },
          { id: 'c1c', text: 'Document it mentally — note date, time, witness', riskImpact: -5, eqImpact: 12, nextNodeId: 'n2c', aiCoachNote: 'Evidence gathering without confrontation' },
          { id: 'c1d', text: "Ask: \"What do you mean by that exactly?\"", riskImpact: -8, eqImpact: 13, nextNodeId: 'n2d', aiCoachNote: 'Socratic deflection — makes them articulate the comment' },
        ],
      },
      n2a: {
        id: 'n2a',
        description: "Rohan takes your politeness as acceptance. A week later, the comments continue — now about your 'smile' and 'energy'. He messages you outside work hours about non-urgent tasks.",
        mood: 'escalated',
        interactionType: 'red-flag',
        interactionData: {
          text: "Pattern of energy comments. Messages outside work hours. Persistent boundary testing.",
          targets: ['pattern', 'outside work hours', 'boundary testing']
        },
        choices: [
          { id: 'c2a1', text: 'Speak to HR confidentially about the pattern', riskImpact: -15, eqImpact: 14, nextNodeId: 'n3_hr', aiCoachNote: 'Formal channel — protected under POSH Act' },
          { id: 'c2a2', text: 'Talk to a trusted colleague to reality-check', riskImpact: -8, eqImpact: 10, nextNodeId: 'n3_peer', aiCoachNote: 'Peer support and witness building' },
          { id: 'c2a3', text: 'Set a clear boundary now — one direct conversation', riskImpact: -12, eqImpact: 13, nextNodeId: 'n3_direct', aiCoachNote: 'Delayed but still valid — better late than never' },
        ],
      },
      n2b: {
        id: 'n2b',
        description: "Rohan looks surprised, then slightly flustered. 'Of course, of course,' he says, moving away. The other person heard you. You feel the adrenaline — but also a clarity.",
        mood: 'relieved',
        interactionType: 'match',
        interactionData: {
          text: 'Documentation is your legal shield.',
          pairs: [
            { key: 'Formal Record', value: 'Evidence' },
            { key: 'HR Record', value: 'Protection' }
          ]
        },
        choices: [
          { id: 'c2b1', text: 'Document what happened — date, witnesses, exact words', riskImpact: -10, eqImpact: 12, nextNodeId: 'n3_document', aiCoachNote: 'Evidence preservation after a boundary event' },
          { id: 'c2b2', text: 'Speak to HR as a precaution — create a record', riskImpact: -14, eqImpact: 13, nextNodeId: 'n3_hr', aiCoachNote: 'Proactive documentation' },
        ],
      },
      n2c: {
        id: 'n2c',
        description: "Smart. You have a record. It happens twice more over two weeks. You have dates, times, the witness present. This pattern is now documented. What next?",
        mood: 'neutral',
        choices: [
          { id: 'c2c1', text: 'File a formal complaint with HR — you have evidence', riskImpact: -18, eqImpact: 15, nextNodeId: 'n3_hr', aiCoachNote: 'Evidence-backed formal action — protected by law' },
          { id: 'c2c2', text: 'Confront Rohan directly with your documented record', riskImpact: -10, eqImpact: 13, nextNodeId: 'n3_direct', aiCoachNote: 'Direct confrontation backed by evidence' },
        ],
      },
      n2d: {
        id: 'n2d',
        description: "'I just meant it as a compliment,' Rohan says, defensive now. 'You're too sensitive.' This is a classic DARVO response — Deny, Attack, Reverse Victim and Offender.",
        mood: 'escalated',
        choices: [
          { id: 'c2d1', text: '"I understand you meant well. The impact was uncomfortable for me."', riskImpact: -10, eqImpact: 15, nextNodeId: 'n2e', aiCoachNote: 'Intent vs impact framing — powerful and professional' },
          { id: 'c2d2', text: 'Walk away calmly — this conversation is not productive', riskImpact: -8, eqImpact: 10, nextNodeId: 'n3_document', aiCoachNote: 'Disengaging from DARVO without escalating' },
        ],
      },
      n2e: {
        id: 'n2e',
        description: "Rohan goes quiet and says, 'Fine, understood.' The immediate moment de-escalates, but this is a critical point for follow-through so the boundary holds over time.",
        mood: 'neutral',
        choices: [
          { id: 'c2e1', text: 'Send a brief follow-up email summarizing the boundary', riskImpact: -12, eqImpact: 13, nextNodeId: 'n3_document', aiCoachNote: 'Creates a contemporaneous record in your own words' },
          { id: 'c2e2', text: 'Request a confidential HR check-in to log the incident', riskImpact: -16, eqImpact: 15, nextNodeId: 'n3_hr', aiCoachNote: 'Converts one incident into institutional awareness' },
        ],
      },
      n3_hr: {
        id: 'n3_hr',
        description: "HR acknowledges your concern and opens a POSH inquiry. Rohan is spoken to. You have institutional protection. Now, how do you want to protect yourself going forward?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'whr_1', text: 'Request regular check-ins with HR until the inquiry is resolved.', riskImpact: -8, eqImpact: 11, nextNodeId: 'work_q4', aiCoachNote: 'Active follow-up ensures the process does not stall.' },
          { id: 'whr_2', text: 'Continue documenting any new incidents as additional evidence.', riskImpact: -7, eqImpact: 10, nextNodeId: 'work_q4', aiCoachNote: 'Ongoing documentation protects you if behaviour resurfaces.' },
          { id: 'whr_3', text: 'Step back and let HR handle it without further involvement.', riskImpact: 2, eqImpact: 5, nextNodeId: 'work_q4', aiCoachNote: 'Disengaging from the process can slow resolution and leave gaps.' },
        ],
      },
      n3_peer: {
        id: 'n3_peer',
        description: "Your colleague says 'He did the same with Priya last year.' You consider a joint complaint. Collective action is more powerful. What is your next move?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'wpe_1', text: 'Meet with Priya together and file a joint HR complaint.', riskImpact: -10, eqImpact: 13, nextNodeId: 'work_q4', aiCoachNote: 'Joint complaints carry significantly more weight under POSH.' },
          { id: 'wpe_2', text: 'File separately but cite the pattern of repeated behaviour.', riskImpact: -8, eqImpact: 11, nextNodeId: 'work_q4', aiCoachNote: 'Separate complaints that reference a pattern are still very effective.' },
          { id: 'wpe_3', text: 'Wait to see if Priya files first before doing anything.', riskImpact: 3, eqImpact: 3, nextNodeId: 'work_q4', aiCoachNote: 'Delay reduces the window for timely action and may signal inaction.' },
        ],
      },
      n3_direct: {
        id: 'n3_direct',
        description: "Your direct conversation was clear. Rohan backs off. You continue documenting. A week later, a colleague asks how you handled it so well. What do you say?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'wdi_1', text: 'Explain the boundary-setting process and share your documentation approach.', riskImpact: -6, eqImpact: 12, nextNodeId: 'work_q4', aiCoachNote: 'Sharing strategies builds collective workplace safety culture.' },
          { id: 'wdi_2', text: 'Mention that you have spoken to HR as a precaution — normalise it.', riskImpact: -5, eqImpact: 10, nextNodeId: 'work_q4', aiCoachNote: 'Destigmatising HR reports encourages others to use formal channels.' },
          { id: 'wdi_3', text: 'Keep it private — you do not want to create drama.', riskImpact: 1, eqImpact: 4, nextNodeId: 'work_q4', aiCoachNote: 'Silence can protect short-term comfort but slow cultural change.' },
        ],
      },
      n3_document: {
        id: 'n3_document',
        description: "Your documentation is a powerful tool. You have dates, words, and witnesses. Now you need to decide: act on this record now or hold it?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'wdo_1', text: 'Share the documented record with HR now as a precautionary log.', riskImpact: -9, eqImpact: 12, nextNodeId: 'work_q4', aiCoachNote: 'A logged record at HR is protected even if no immediate action is taken.' },
          { id: 'wdo_2', text: 'Hold the record and set a personal trigger: if it happens once more, escalate.', riskImpact: -5, eqImpact: 8, nextNodeId: 'work_q4', aiCoachNote: 'A clear trigger plan turns passive documentation into an action framework.' },
          { id: 'wdo_3', text: 'Keep the record private for now and continue as normal.', riskImpact: 2, eqImpact: 5, nextNodeId: 'work_q4', aiCoachNote: 'Holding without a plan can leave you vulnerable if escalation is needed quickly.' },
        ],
      },

      // ── Q4 + Q5 shared nodes for workplace-boundary ─────────────────
      work_q4: {
        id: 'work_q4',
        description: 'Stepping back: workplace boundary violations are a pattern, not a one-off. Which structural protection do you want to put in place going forward?',
        mood: 'neutral',
        interactionType: 'match',
        interactionData: {
          text: 'Match each protection type to what it safeguards.',
          pairs: [
            { key: 'Written Communication Trail', value: 'Legal Evidence' },
            { key: 'Trusted Ally at Work', value: 'Witness Network' }
          ]
        },
        choices: [
          { id: 'wq4_1', text: 'Move key work conversations to email so everything is documented by default.', riskImpact: -8, eqImpact: 11, nextNodeId: 'work_q5', aiCoachNote: 'Written trails are your strongest passive protection in professional settings.' },
          { id: 'wq4_2', text: 'Build a small trusted network of colleagues who know your situation.', riskImpact: -7, eqImpact: 10, nextNodeId: 'work_q5', aiCoachNote: 'Allies who are aware can act as informal witnesses if needed.' },
          { id: 'wq4_3', text: 'Focus on the work — let HR handle the structural side.', riskImpact: 2, eqImpact: 4, nextNodeId: 'work_q5', aiCoachNote: 'HR is important, but personal protective habits add another layer.' },
        ],
      },
      work_q5: {
        id: 'work_q5',
        description: 'Final debrief. The POSH Act gives you the right to a safe workplace free from harassment. Which statement best reflects how you will carry this forward?',
        mood: 'neutral',
        interactionType: 'mcq',
        choices: [
          { id: 'wq5_1', text: 'I know my rights, I document consistently, and I will use formal channels without hesitation.', riskImpact: -8, eqImpact: 14, nextNodeId: 'work_end_safe', aiCoachNote: 'That is the complete toolkit. Rights, records, and willingness to act.' },
          { id: 'wq5_2', text: 'I need to practise setting boundaries earlier, before patterns develop.', riskImpact: -5, eqImpact: 10, nextNodeId: 'work_end_partial', aiCoachNote: 'Early boundary-setting is a skill — replay earlier nodes to practise.' },
          { id: 'wq5_3', text: 'I am not sure I would handle the power imbalance confidently in real life.', riskImpact: 2, eqImpact: 5, nextNodeId: 'work_end_learning', aiCoachNote: 'That is honest. Power dynamics are hard. More practice and support will build your confidence.' },
        ],
      },
      work_end_safe: {
        id: 'work_end_safe',
        description: 'Exceptional. Across five steps you demonstrated boundary-setting, evidence gathering, formal escalation, and long-term protection planning. You are ready for this in real life.',
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      work_end_partial: {
        id: 'work_end_partial',
        description: 'Strong run. You handled the core moments well and finished with useful habits. Replay the early nodes to practise setting boundaries faster next time.',
        mood: 'relieved',
        isEnd: true,
        endType: 'partial',
        choices: [],
      },
      work_end_learning: {
        id: 'work_end_learning',
        description: 'You completed the scenario. Power dynamics are genuinely difficult to navigate. Each replay builds more confidence — do not stop practising.',
        mood: 'escalated',
        isEnd: true,
        endType: 'learning',
        choices: [],
      },
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // Online Manipulation scenario (unchanged)
  // ──────────────────────────────────────────────────────────────────────
  'online-manipulation': {
    id: 'online-manipulation',
    title: 'The DM Campaign',
    category: 'Online Safety',
    mode: 'Puzzle',
    icon: '📱',
    difficulty: 2,
    duration: '10 min',
    color: '#c4537a',
    triggerWarnings: ['Online manipulation', 'Social engineering'],
    estimatedMinutes: 10,
    tags: ['online-safety', 'scam-detection', 'verification'],
    intensity: 'medium',
    backgroundMood: 'linear-gradient(135deg, #0a0f1a 0%, #1a1040 100%)',
    context: "You received a DM from someone who says they're a talent scout for a fashion brand. They found your profile through a friend. The messages are friendly, complimentary, and the account looks professional. Something feels slightly off.",
    startNodeId: 'n1',
    nodes: {
      n1: {
        id: 'n1',
        description: "Their first message: 'Hi! I came across your profile through [mutual friend]. We're looking for brand ambassadors in your city — your aesthetic is exactly what we need. Interested in learning more? 🙂' The account has 847 followers, a professional bio, and 3 posts.",
        mood: 'neutral',
        interactionType: 'red-flag',
        interactionData: {
          text: "Talent scout for fashion brand. Looking for brand ambassadors. Aesthetically pleasing. Interested in learning more?",
          targets: ['brand ambassadors', 'Aesthetically', 'scout', 'fashion']
        },
        choices: [
          { id: 'c1a', text: 'Check if the mutual friend actually knows them first', riskImpact: -15, eqImpact: 14, nextNodeId: 'n2a', aiCoachNote: 'Verification before engagement — excellent instinct' },
          { id: 'c1b', text: 'Ask for their official website or company registration', riskImpact: -12, eqImpact: 12, nextNodeId: 'n2b', aiCoachNote: 'Requesting verifiable credentials' },
          { id: 'c1c', text: 'Reply positively — this sounds exciting', riskImpact: 10, eqImpact: 4, nextNodeId: 'n2c', aiCoachNote: 'Unverified engagement with stranger' },
          { id: 'c1d', text: 'Reverse image search their profile photo', riskImpact: -14, eqImpact: 13, nextNodeId: 'n2d', aiCoachNote: 'Technical verification method' },
        ],
      },
      n2a: {
        id: 'n2a',
        description: "Your mutual friend replies: 'Who? I don't know anyone by that name. I never referred anyone.' Red flag confirmed. The account used your public follower list to fabricate a connection.",
        mood: 'tense',
        choices: [
          { id: 'c2a1', text: 'Block and report the account immediately', riskImpact: -18, eqImpact: 14, nextNodeId: 'n3_block', aiCoachNote: 'Correct response after confirming manipulation' },
          { id: 'c2a2', text: "Confront them — \"My friend doesn't know you\"", riskImpact: -5, eqImpact: 10, nextNodeId: 'n2e', aiCoachNote: 'Engagement risk — manipulators may escalate' },
        ],
      },
      n2e: {
        id: 'n2e',
        description: "They reply instantly: 'Your friend is lying. Send your number now and I'll prove it.' The pressure escalates with guilt and urgency, which is a classic manipulation pattern.",
        mood: 'escalated',
        choices: [
          { id: 'c2e1', text: 'Do not engage further — block and report immediately', riskImpact: -16, eqImpact: 14, nextNodeId: 'n3_block', aiCoachNote: 'Fast disengagement cuts attacker leverage' },
          { id: 'c2e2', text: 'Argue and demand proof in chat', riskImpact: 4, eqImpact: 6, nextNodeId: 'n3_confront', aiCoachNote: 'Continued engagement usually increases exposure' },
        ],
      },
      n2b: {
        id: 'n2b',
        description: "They send a PDF 'portfolio' and a website link. The site looks professional but the domain was registered 6 days ago. The PDF asks for your phone number, home city, and availability.",
        mood: 'tense',
        choices: [
          { id: 'c2b1', text: 'Check domain registration date — 6 days is suspicious', riskImpact: -14, eqImpact: 15, nextNodeId: 'n3_smart', aiCoachNote: 'Critical thinking applied to digital verification' },
          { id: 'c2b2', text: "Don't share personal details — disengage politely", riskImpact: -12, eqImpact: 10, nextNodeId: 'n3_disengage', aiCoachNote: 'Smart disengagement without confrontation' },
          { id: 'c2b3', text: 'Fill in the PDF — they provided documentation', riskImpact: 15, eqImpact: 3, nextNodeId: 'n3_risk', aiCoachNote: 'Trusting appearance over verification — dangerous' },
        ],
      },
      n2c: {
        id: 'n2c',
        description: "They escalate quickly — asking for photos 'for the portfolio', then your phone number 'to connect with the team'. The urgency is manufactured: 'We need to confirm by tonight!'",
        mood: 'escalated',
        choices: [
          { id: 'c2c1', text: 'Recognise the urgency tactic — pause and verify', riskImpact: -10, eqImpact: 13, nextNodeId: 'n3_smart', aiCoachNote: 'Identifying manufactured urgency as a red flag' },
          { id: 'c2c2', text: 'Stop responding — trust your discomfort', riskImpact: -14, eqImpact: 12, nextNodeId: 'n3_disengage', aiCoachNote: 'Gut feeling as valid data' },
        ],
      },
      n2d: {
        id: 'n2d',
        description: "The reverse image search returns results: the profile photo belongs to a real European model with no connection to India. The account is using a stolen identity.",
        mood: 'tense',
        choices: [
          { id: 'c2d1', text: 'Block, report, and warn the model whose photo was stolen', riskImpact: -18, eqImpact: 15, nextNodeId: 'n3_block', aiCoachNote: 'Full protective response — protecting yourself and others' },
          { id: 'c2d2', text: 'Screenshot and report to platform with evidence', riskImpact: -16, eqImpact: 14, nextNodeId: 'n3_block', aiCoachNote: 'Evidence-based reporting' },
        ],
      },
      n3_block: {
        id: 'n3_block',
        description: "You blocked and reported the account. Your verification skills prevented a phishing attempt. What do you do next to strengthen your digital safety?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'ob1_1', text: 'Review privacy settings on all your social accounts right now.', riskImpact: -8, eqImpact: 11, nextNodeId: 'online_q4', aiCoachNote: 'Proactive privacy audits prevent future targeted attacks.' },
          { id: 'ob1_2', text: 'Warn mutual connections that a scam account used their name.', riskImpact: -7, eqImpact: 10, nextNodeId: 'online_q4', aiCoachNote: 'Warning others stops the same scam from spreading.' },
          { id: 'ob1_3', text: 'Move on — the report has been filed, that is enough.', riskImpact: 1, eqImpact: 5, nextNodeId: 'online_q4', aiCoachNote: 'Filing is good, but hardening your settings adds lasting protection.' },
        ],
      },
      n3_smart: {
        id: 'n3_smart',
        description: "Your digital literacy identified the manipulation before any data was shared. You report the account. Now: how do you turn this near-miss into a lasting habit?",
        mood: 'resolved',
        interactionType: 'mcq',
        choices: [
          { id: 'osm_1', text: 'Add domain registration age to your personal verification checklist.', riskImpact: -8, eqImpact: 12, nextNodeId: 'online_q4', aiCoachNote: 'A personal checklist codifies learned skills into repeatable process.' },
          { id: 'osm_2', text: 'Share the scam pattern with your network so others can spot it.', riskImpact: -6, eqImpact: 10, nextNodeId: 'online_q4', aiCoachNote: 'Community education is one of the most effective anti-scam tools.' },
          { id: 'osm_3', text: 'Feel good about this win — you handled it on instinct.', riskImpact: 1, eqImpact: 6, nextNodeId: 'online_q4', aiCoachNote: 'Good instincts are valuable, but codifying them makes them reliable.' },
        ],
      },
      n3_disengage: {
        id: 'n3_disengage',
        description: "You stopped engaging and trusted your instincts. No data was shared. Now: what makes you confident you will spot a similar attempt next time?",
        mood: 'relieved',
        interactionType: 'mcq',
        choices: [
          { id: 'odi_1', text: 'Memorise the red flags: urgency, unverifiable identity, unusual requests.', riskImpact: -7, eqImpact: 11, nextNodeId: 'online_q4', aiCoachNote: 'Knowing the pattern is the first line of digital defence.' },
          { id: 'odi_2', text: 'Make a habit of always verifying before engaging with new DMs.', riskImpact: -6, eqImpact: 9, nextNodeId: 'online_q4', aiCoachNote: 'A consistent verification habit removes guesswork.' },
          { id: 'odi_3', text: 'Trust that you will know it when you see it again.', riskImpact: 3, eqImpact: 4, nextNodeId: 'online_q4', aiCoachNote: 'Vague confidence is less reliable than a specific checklist.' },
        ],
      },
      n3_confront: {
        id: 'n3_confront',
        description: "They deny everything, then turn hostile. Block them immediately. This is a learning moment — what will you do differently when this happens again?",
        mood: 'tense',
        interactionType: 'mcq',
        choices: [
          { id: 'ocf_1', text: 'Block and report without responding, no matter how convincing their story sounds.', riskImpact: -10, eqImpact: 11, nextNodeId: 'online_q4', aiCoachNote: 'The fastest exit is always the safest one with online manipulators.' },
          { id: 'ocf_2', text: 'Run a verification step (reverse image search, domain check) before any reply.', riskImpact: -8, eqImpact: 10, nextNodeId: 'online_q4', aiCoachNote: 'Verify first, engage never — that is the online safety order of operations.' },
          { id: 'ocf_3', text: 'Be more careful next time but continue to engage to gather evidence.', riskImpact: 4, eqImpact: 3, nextNodeId: 'online_q4', aiCoachNote: 'Continued engagement with manipulators increases your exposure, not your evidence.' },
        ],
      },
      n3_risk: {
        id: 'n3_risk',
        description: "You shared details and now receive suspicious calls. Your number may have been sold. You take immediate action. What is your most important protective step right now?",
        mood: 'escalated',
        interactionType: 'mcq',
        choices: [
          { id: 'ori_1', text: 'Contact your carrier to filter spam calls and register on DND.', riskImpact: -10, eqImpact: 10, nextNodeId: 'online_q4', aiCoachNote: 'Carrier-level filtering is the fastest way to stop spam calls from a leaked number.' },
          { id: 'ori_2', text: 'Change all passwords and review active sessions on key accounts.', riskImpact: -9, eqImpact: 11, nextNodeId: 'online_q4', aiCoachNote: 'If your number was leaked, associated accounts may be at risk too.' },
          { id: 'ori_3', text: 'Block the numbers as they come in and hope it stops.', riskImpact: 4, eqImpact: 3, nextNodeId: 'online_q4', aiCoachNote: 'Reactive blocking does not stop new numbers. Proactive steps are needed.' },
        ],
      },

      // ── Q4 + Q5 shared nodes for online-manipulation ──────────────
      online_q4: {
        id: 'online_q4',
        description: 'Digital safety check. Which of these three verification steps would you use first when you receive an unsolicited DM from someone claiming to offer an opportunity?',
        mood: 'neutral',
        interactionType: 'match',
        interactionData: {
          text: 'Match each verification action to what it confirms.',
          pairs: [
            { key: 'Reverse Image Search', value: 'Real Identity' },
            { key: 'Domain Registration Age', value: 'Legitimate Organisation' }
          ]
        },
        choices: [
          { id: 'oq4_1', text: 'Verify through the mutual contact before any reply.', riskImpact: -8, eqImpact: 12, nextNodeId: 'online_q5', aiCoachNote: 'Source verification is the fastest way to confirm or deny legitimacy.' },
          { id: 'oq4_2', text: 'Reverse image search the profile photo.', riskImpact: -7, eqImpact: 11, nextNodeId: 'online_q5', aiCoachNote: 'Stolen photos are the most common identity fraud technique online.' },
          { id: 'oq4_3', text: 'Check how many posts and followers the account has.', riskImpact: -3, eqImpact: 6, nextNodeId: 'online_q5', aiCoachNote: 'Surface metrics can be easily faked — go deeper with technical checks.' },
        ],
      },
      online_q5: {
        id: 'online_q5',
        description: 'Final debrief. Online manipulation attempts use three core tactics: urgency, fabricated trust, and information pressure. Which habit will you build from this session?',
        mood: 'neutral',
        interactionType: 'mcq',
        choices: [
          { id: 'oq5_1', text: 'Pause for 60 seconds before responding to any unsolicited DM with an offer.', riskImpact: -8, eqImpact: 13, nextNodeId: 'online_end_safe', aiCoachNote: 'A deliberate pause breaks the urgency trap that drives most scam compliance.' },
          { id: 'oq5_2', text: 'Always verify at least two independent data points before engaging.', riskImpact: -6, eqImpact: 11, nextNodeId: 'online_end_partial', aiCoachNote: 'Two-point verification is a simple habit that catches most impersonation attempts.' },
          { id: 'oq5_3', text: 'Trust your gut — if something feels off, you will know.', riskImpact: 2, eqImpact: 5, nextNodeId: 'online_end_learning', aiCoachNote: 'Gut feelings are useful signals but are not a reliable substitute for verification habits.' },
        ],
      },
      online_end_safe: {
        id: 'online_end_safe',
        description: 'Outstanding digital safety performance. You verified, disengaged, reported, and built a lasting habit across five decision points. Your online instincts are sharp.',
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      online_end_partial: {
        id: 'online_end_partial',
        description: 'Good run. You demonstrated solid verification skills and finished with a useful habit. Practice the early identification nodes to catch red flags even faster.',
        mood: 'relieved',
        isEnd: true,
        endType: 'partial',
        choices: [],
      },
      online_end_learning: {
        id: 'online_end_learning',
        description: 'You completed all five steps. Some choices increased exposure, but you now understand the pattern. Replay to build faster, more automatic verification habits.',
        mood: 'escalated',
        isEnd: true,
        endType: 'learning',
        choices: [],
      },
    },
  },
  ...EXPANSION_SCENARIOS,
}

type ScenarioValidationIssue = {
  scenarioId: string
  message: string
}

function validateScenario(scenario: Scenario): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = []
  const nodeIds = new Set(Object.keys(scenario.nodes))

  if (!nodeIds.has(scenario.startNodeId)) {
    issues.push({
      scenarioId: scenario.id,
      message: `startNodeId "${scenario.startNodeId}" does not exist in nodes.`,
    })
    return issues
  }

  const inboundCount = new Map<string, number>()
  for (const nodeId of nodeIds) inboundCount.set(nodeId, 0)

  for (const [nodeId, node] of Object.entries(scenario.nodes)) {
    if (!node.isEnd && node.choices.length === 0) {
      issues.push({
        scenarioId: scenario.id,
        message: `Node "${nodeId}" is non-terminal but has no choices.`,
      })
    }

    for (const choice of node.choices) {
      if (choice.nextNodeId === null) continue
      if (!nodeIds.has(choice.nextNodeId)) {
        issues.push({
          scenarioId: scenario.id,
          message: `Node "${nodeId}" choice "${choice.id}" points to missing node "${choice.nextNodeId}".`,
        })
        continue
      }
      inboundCount.set(choice.nextNodeId, (inboundCount.get(choice.nextNodeId) ?? 0) + 1)
    }
  }

  for (const [nodeId, count] of inboundCount.entries()) {
    if (nodeId !== scenario.startNodeId && count === 0) {
      issues.push({
        scenarioId: scenario.id,
        message: `Node "${nodeId}" is orphaned (no incoming edges).`,
      })
    }
  }

  const reachable = new Set<string>()
  const stack = [scenario.startNodeId]
  while (stack.length > 0) {
    const nodeId = stack.pop()!
    if (reachable.has(nodeId)) continue
    reachable.add(nodeId)
    const node = scenario.nodes[nodeId]
    for (const choice of node.choices) {
      if (choice.nextNodeId && !reachable.has(choice.nextNodeId)) {
        stack.push(choice.nextNodeId)
      }
    }
  }

  for (const nodeId of nodeIds) {
    if (!reachable.has(nodeId)) {
      issues.push({
        scenarioId: scenario.id,
        message: `Node "${nodeId}" is unreachable from start node "${scenario.startNodeId}".`,
      })
    }
  }

  const memo = new Map<string, boolean>()
  const dfsStack = new Set<string>()

  function canReachEnd(nodeId: string): boolean {
    const cached = memo.get(nodeId)
    if (cached !== undefined) return cached

    const node = scenario.nodes[nodeId]
    if (node.isEnd) {
      memo.set(nodeId, true)
      return true
    }

    if (dfsStack.has(nodeId)) {
      return false
    }

    dfsStack.add(nodeId)
    let result = false
    for (const choice of node.choices) {
      if (!choice.nextNodeId) continue
      if (canReachEnd(choice.nextNodeId)) {
        result = true
        break
      }
    }
    dfsStack.delete(nodeId)
    memo.set(nodeId, result)
    return result
  }

  for (const nodeId of reachable) {
    if (!canReachEnd(nodeId)) {
      issues.push({
        scenarioId: scenario.id,
        message: `Node "${nodeId}" cannot reach any terminal end node.`,
      })
    }
  }

  return issues
}

function validateScenarioCollection(scenarios: Record<string, Scenario>): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = []
  const seenIds = new Set<string>()

  for (const [key, scenario] of Object.entries(scenarios)) {
    if (scenario.id !== key) {
      issues.push({
        scenarioId: key,
        message: `Scenario key "${key}" does not match scenario.id "${scenario.id}".`,
      })
    }
    if (seenIds.has(scenario.id)) {
      issues.push({
        scenarioId: scenario.id,
        message: `Duplicate scenario id "${scenario.id}" found.`,
      })
    }
    seenIds.add(scenario.id)
    issues.push(...validateScenario(scenario))
  }

  return issues
}

if (process.env.NODE_ENV !== 'production') {
  const validationIssues = validateScenarioCollection(SCENARIOS)
  if (validationIssues.length > 0) {
    console.warn(
      '[SafePath] Scenario validation issues:\n' +
        validationIssues.map((i) => `- [${i.scenarioId}] ${i.message}`).join('\n')
    )
  }
}

export default SCENARIOS