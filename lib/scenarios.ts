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
      n2_safe: {
        id: 'n2_safe',
        description:
          'Your first move lowered immediate risk. The other person pauses, and bystanders are nearby. What is your next step to secure the situation?',
        mood: 'neutral',
        choices: [
          {
            id: 'c2_safe_layered',
            text: 'Add a second safety layer: move to staff/security and update a trusted contact.',
            riskImpact: -10,
            eqImpact: 11,
            nextNodeId: 'n_safe',
            aiCoachNote: 'Layered safety decisions create strong outcomes.',
          },
          {
            id: 'c2_safe_fast_exit',
            text: 'Exit quickly to a safer space and monitor from distance.',
            riskImpact: -6,
            eqImpact: 8,
            nextNodeId: 'n_partial',
            aiCoachNote: 'Quick exit is useful; add reporting when possible.',
          },
          {
            id: 'c2_safe_reengage',
            text: 'Re-engage directly to “settle” the issue one-to-one.',
            riskImpact: 5,
            eqImpact: 1,
            nextNodeId: 'n_learning',
            aiCoachNote: 'Re-engaging can reopen risk after initial safety.',
          },
        ],
      },
      n2_assert: {
        id: 'n2_assert',
        description:
          'Your boundary was clear. The situation is mixed: not fully resolved, but you have some control. What do you do next?',
        mood: 'tense',
        choices: [
          {
            id: 'c2_assert_support',
            text: 'Escalate appropriately: involve authority/support and document details.',
            riskImpact: -9,
            eqImpact: 10,
            nextNodeId: 'n_safe',
            aiCoachNote: 'Assertiveness plus support usually gives better protection.',
          },
          {
            id: 'c2_assert_hold',
            text: 'Maintain distance and leave without further interaction.',
            riskImpact: -5,
            eqImpact: 7,
            nextNodeId: 'n_partial',
            aiCoachNote: 'A valid stabilizing step; consider reporting if pattern repeats.',
          },
          {
            id: 'c2_assert_argue',
            text: 'Continue argument in place to prove a point.',
            riskImpact: 7,
            eqImpact: 0,
            nextNodeId: 'n_learning',
            aiCoachNote: 'Prolonged confrontation can increase exposure.',
          },
        ],
      },
      n2_risky: {
        id: 'n2_risky',
        description:
          'Risk has increased. You still have a chance to recover if you act now with a focused safety step.',
        mood: 'escalated',
        choices: [
          {
            id: 'c2_risky_recover',
            text: 'Pause, seek visible support, and move to a controlled/public zone.',
            riskImpact: -12,
            eqImpact: 10,
            nextNodeId: 'n_partial',
            aiCoachNote: 'Recovery choices matter; late correction still helps.',
          },
          {
            id: 'c2_risky_report',
            text: 'Immediately report and request active intervention.',
            riskImpact: -14,
            eqImpact: 11,
            nextNodeId: 'n_safe',
            aiCoachNote: 'Escalating to formal support can reset safety quickly.',
          },
          {
            id: 'c2_risky_continue',
            text: 'Continue same path and avoid taking additional steps.',
            riskImpact: 8,
            eqImpact: -2,
            nextNodeId: 'n_learning',
            aiCoachNote: 'Inaction after warning signs often worsens outcomes.',
          },
        ],
      },
      n_safe: {
        id: 'n_safe',
        description:
          'You used layered safety: awareness, support, and controlled action. The risk dropped and you stayed in control.',
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n_partial: {
        id: 'n_partial',
        description:
          'You handled the moment with confidence. Next time, add one more protective step for an even safer outcome.',
        mood: 'relieved',
        isEnd: true,
        endType: 'partial',
        choices: [],
      },
      n_learning: {
        id: 'n_learning',
        description:
          'You got through the situation, but this path increased uncertainty. Use this as practice for stronger safety decisions next time.',
        mood: 'escalated',
        isEnd: true,
        endType: 'learning',
        choices: [],
      },
    },
  }
}

const EXPANSION_SCENARIOS: Record<string, Scenario> = {
  'placeholder-1': createMiniScenario({
    id: 'placeholder-1',
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
  'placeholder-2': createMiniScenario({
    id: 'placeholder-2',
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
  'placeholder-3': createMiniScenario({
    id: 'placeholder-3',
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
  'placeholder-4': createMiniScenario({
    id: 'placeholder-4',
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
    saferChoice: 'Report to manager and request another trainer immediately.',
    assertiveChoice: 'State clear boundary: keep feedback exercise-focused.',
    riskyChoice: 'Laugh it off to avoid awkwardness.',
    tip: 'Clear boundaries plus documentation protect future interactions.',
  }),
  'placeholder-5': createMiniScenario({
    id: 'placeholder-5',
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
  'placeholder-6': createMiniScenario({
    id: 'placeholder-6',
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
  'placeholder-7': createMiniScenario({
    id: 'placeholder-7',
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
  'placeholder-8': createMiniScenario({
    id: 'placeholder-8',
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
  'placeholder-9': createMiniScenario({
    id: 'placeholder-9',
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
  'placeholder-10': createMiniScenario({
    id: 'placeholder-10',
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
  'placeholder-11': createMiniScenario({
    id: 'placeholder-11',
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
    saferChoice: 'Move to staffed desk area and inform co-working reception.',
    assertiveChoice: 'Set direct boundary and mention formal complaint option.',
    riskyChoice: 'Continue engaging to avoid appearing rude.',
    tip: 'Respectful firmness is appropriate in repeated boundary tests.',
  }),
  'placeholder-12': createMiniScenario({
    id: 'placeholder-12',
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
  'placeholder-13': createMiniScenario({
    id: 'placeholder-13',
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
  'placeholder-14': createMiniScenario({
    id: 'placeholder-14',
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
  'placeholder-15': createMiniScenario({
    id: 'placeholder-15',
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
    saferChoice: 'Document messages and escalate through internship coordinator.',
    assertiveChoice: 'Set communication boundary to official channels only.',
    riskyChoice: 'Reply casually to keep opportunities open.',
    tip: 'Career opportunities should never depend on personal compliance.',
  }),
  'placeholder-18': createMiniScenario({
    id: 'placeholder-18',
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
    saferChoice: 'Decline firmly, alert driver support, and exit near a visible point.',
    assertiveChoice: 'State clear boundary and message trusted contact with trip details.',
    riskyChoice: 'Share details to avoid awkwardness.',
    tip: 'You never owe personal details to strangers in transit.',
  }),
  'placeholder-19': createMiniScenario({
    id: 'placeholder-19',
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
    saferChoice: 'Refuse private meeting and escalate to event coordinator if pressure continues.',
    assertiveChoice: 'Set boundary: communicate only in official group channels.',
    riskyChoice: 'Agree to meet because it may help your profile.',
    tip: 'Professional opportunities should stay transparent and verifiable.',
  }),
  'placeholder-16': createMiniScenario({
    id: 'placeholder-16',
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
  'placeholder-17': createMiniScenario({
    id: 'placeholder-17',
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
        choices: [
          { id: 'c2c1', text: 'Trust your instincts — speak up now', riskImpact: -12, eqImpact: 14, nextNodeId: 'n3_confront', aiCoachNote: 'Delayed but important: trusting gut feeling' },
          { id: 'c2c2', text: 'Move away and activate bystander', riskImpact: -14, eqImpact: 10, nextNodeId: 'n3_help', aiCoachNote: 'Recovery from freeze response' },
        ],
      },
      n2d: {
        id: 'n2d',
        description: "The bus goes quieter. Heads turn. The person steps back, face reddening. A few passengers look at you - one gives a small nod. Your heart is racing but the space is clear.",
        mood: 'relieved',
        choices: [
          { id: 'c2d1', text: 'Stay near the front, remain alert', riskImpact: -5, eqImpact: 10, nextNodeId: 'n2e', aiCoachNote: 'Appropriate follow-through after assertion' },
          { id: 'c2d2', text: 'Continue your journey calmly - you handled it', riskImpact: -8, eqImpact: 12, nextNodeId: 'n_end_strong', aiCoachNote: 'Resolution through confident action' },
        ],
      },
      n2e: {
        id: 'n2e',
        description: "You have regained control, but the bus remains crowded and dynamic. Do you close the loop now or just continue?",
        mood: 'neutral',
        choices: [
          { id: 'c2e1', text: 'Quietly inform conductor with route/time details', riskImpact: -8, eqImpact: 11, nextNodeId: 'n3_report', aiCoachNote: 'Reporting creates accountability and helps others.' },
          { id: 'c2e2', text: 'Maintain distance and continue without reporting', riskImpact: -4, eqImpact: 7, nextNodeId: 'n3_vigilant', aiCoachNote: 'Still safe, but less systemic follow-through.' },
        ],
      },
      n3_help: {
        id: 'n3_help',
        description: "The woman understands instantly. She moves next to you and starts chatting naturally — 'Hi! Didn't see you there!' The behaviour stops. You feel a wave of relief.",
        mood: 'relieved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_front: {
        id: 'n3_front',
        description: "Near the driver, you have visibility and a witness. The person doesn't follow. You reach your stop safely. The driver notices your expression and nods — they've seen this before.",
        mood: 'relieved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_phone: {
        id: 'n3_phone',
        description: "You call a friend and speak naturally. The perceived social connection shifts the dynamic. The person moves away by the next stop. You arrive safely.",
        mood: 'relieved',
        isEnd: true,
        endType: 'partial',
        choices: [],
      },
      n3_confront: {
        id: 'n3_confront',
        description: "Your firm words land. The person steps back, avoiding eye contact. Other passengers are now aware. You ride the rest of the route with your head high and your space intact.",
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_exit: {
        id: 'n3_exit',
        description: "You exit at the next stop, one stop early. In the fresh air, you feel safe. You make a note to document the incident on the city transport app. Your safety was worth the detour.",
        mood: 'relieved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_report: {
        id: 'n3_report',
        description: "The conductor speaks to the person — who exits at the next stop. A formal complaint is logged. You continue your journey in a cleared space, having protected yourself and potentially others after you.",
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_vigilant: {
        id: 'n3_vigilant',
        description: "You stay alert, positioned near the driver. The person keeps distance for the rest of the journey. You arrive safely. Vigilance after assertion is smart — not paranoia.",
        mood: 'relieved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n_end_strong: {
        id: 'n_end_strong',
        description: "You acted quickly, spoke clearly, and protected your space. The rest of the journey passes without incident. This is exactly what cognitive preparedness looks like in action.",
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
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
        description: "HR acknowledges your concern and opens an inquiry under POSH Act. Rohan is spoken to. He's professionally civil afterward. You have a record, a witness, and institutional protection.",
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_peer: {
        id: 'n3_peer',
        description: "Your colleague validates what you felt: 'He did the same with Priya last year.' Together, you consider a joint complaint to HR. Collective action is more powerful.",
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_direct: {
        id: 'n3_direct',
        description: "Your direct conversation was professional and clear. Rohan backs off. You continue documenting in case the pattern recurs. You've handled this with exceptional composure.",
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_document: {
        id: 'n3_document',
        description: "Your documentation is a powerful tool. You have dates, words, and witnesses. Whether you act now or later, you're protected. This record is yours to use as needed.",
        mood: 'resolved',
        isEnd: true,
        endType: 'partial',
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
        description: "You've blocked and reported the account. Your verification skills prevented a phishing attempt. The platform reviews the report. You've also protected others who might have received the same message.",
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_smart: {
        id: 'n3_smart',
        description: "Your digital literacy is sharp. You identified the manipulation pattern before any personal data was shared. You report the account. Pattern recognition is a critical safety skill online.",
        mood: 'resolved',
        isEnd: true,
        endType: 'safe',
        choices: [],
      },
      n3_disengage: {
        id: 'n3_disengage',
        description: "You stopped engaging and trusted your instincts. No data was shared. The account likely moves on to another target — but not you. Quiet disengagement is always a valid choice.",
        mood: 'relieved',
        isEnd: true,
        endType: 'partial',
        choices: [],
      },
      n3_confront: {
        id: 'n3_confront',
        description: "They deny everything, then become hostile. They may have noted your engagement pattern. Block them immediately after this — confrontation with online manipulators rarely ends well.",
        mood: 'tense',
        isEnd: true,
        endType: 'learning',
        choices: [],
      },
      n3_risk: {
        id: 'n3_risk',
        description: "You shared your details. Within 24 hours, you receive suspicious calls. Your number may have been sold. Report the account, contact your carrier about spam filtering, and review your privacy settings immediately.",
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



