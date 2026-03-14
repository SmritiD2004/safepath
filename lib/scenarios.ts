export interface Choice {
  id: string;
  text: string;
  riskImpact: number; // -20 to +20
  eqImpact: number; // -10 to +15
  nextNodeId: string | null;
  aiCoachNote: string; // hint shown before AI response
}

export interface ScenarioNode {
  id: string;
  description: string;
  mood: "tense" | "neutral" | "relieved" | "escalated" | "resolved";
  choices: Choice[];
  isEnd?: boolean;
  endType?: "safe" | "partial" | "learning";
  interactionType?:
    | "mcq"
    | "red-flag"
    | "match"
    | "drag-drop"
    | "whack-a-mole"
    | "strategy-grid"
    | "chat"
    | "avatar-path";
  interactionData?: {
    text?: string;
    targets?: string[];
    pairs?: Array<{ key: string; value: string }>;
    correctBox?: string[];
    npcInitial?: string;
    keywords?: string[];
    safeOption?: string;
    riskyOption?: string;
  };
}

export interface Scenario {
  id: string;
  title: string;
  category: string;
  mode: "Simulation" | "Puzzle" | "Role-Play" | "Strategy" | "Story";
  icon: string;
  difficulty: number;
  duration: string;
  color: string;
  triggerWarnings: string[];
  estimatedMinutes: number;
  tags: string[];
  intensity: "low" | "medium" | "high";
  context: string; // scene-setting paragraph
  backgroundMood: string; // CSS gradient for the background
  startNodeId: string;
  nodes: Record<string, ScenarioNode>;
}

type MiniScenarioSeed = {
  id: string;
  title: string;
  category: string;
  mode: Scenario["mode"];
  icon: string;
  difficulty: number;
  duration: string;
  color: string;
  triggerWarnings: string[];
  estimatedMinutes?: number;
  tags?: string[];
  intensity?: Scenario["intensity"];
  context: string;
  backgroundMood: string;
  prompt: string;
  npcInitial?: string;
  saferChoice: string;
  assertiveChoice: string;
  riskyChoice: string;
  tip: string;
  q2SafePrompt?: string      // shown after player picks the safe choice
  q2AssertPrompt?: string    // shown after player picks the assertive choice
  q2RiskyPrompt?: string     // shown after player picks the risky choice
  q2SafeChoice1?: string     // safe option text for n2_safe
  q2SafeChoice2?: string
  q2SafeChoice3?: string
  q2AssertChoice1?: string   // safe option text for n2_assert
  q2AssertChoice2?: string
  q2AssertChoice3?: string
  q2RiskyChoice1?: string    // recovery option text for n2_risky
  q2RiskyChoice2?: string
  q2RiskyChoice3?: string
};

// ─── Interaction-type maps per mode (Q1 → Q5, no two consecutive repeats) ────
//
//  Simulation : whack-a-mole | red-flag  | match        | mcq          | mcq
//  Puzzle     : red-flag     | match     | red-flag     | match        | mcq
//  Role-Play  : chat         | match     | chat         | mcq          | mcq
//  Strategy   : strategy-grid| match     | mcq          | strategy-grid| mcq
//  Story      : avatar-path  | mcq       | avatar-path  | match        | mcq
// ──────────────────────────────────────────────────────────────────────────────

function q2InteractionType(mode: Scenario["mode"]): ScenarioNode["interactionType"] {
  if (mode === "Simulation") return "red-flag";
  if (mode === "Puzzle")     return "match";
  if (mode === "Role-Play")  return "match";
  if (mode === "Strategy")   return "match";
  return "mcq"; // Story
}

function q3InteractionType(mode: Scenario["mode"]): ScenarioNode["interactionType"] {
  if (mode === "Simulation") return "match";
  if (mode === "Puzzle")     return "red-flag";
  if (mode === "Role-Play")  return "chat";
  if (mode === "Strategy")   return "mcq";
  return "avatar-path"; // Story
}

function q4InteractionType(mode: Scenario["mode"]): ScenarioNode["interactionType"] {
  if (mode === "Simulation") return "mcq";
  if (mode === "Puzzle")     return "match";
  if (mode === "Role-Play")  return "mcq";
  if (mode === "Strategy")   return "strategy-grid";
  return "match"; // Story
}

function createMiniScenario(seed: MiniScenarioSeed): Scenario {
  const estimatedMinutes =
    seed.estimatedMinutes ?? (Number.parseInt(seed.duration, 10) || 7);
  const inferredIntensity: Scenario["intensity"] =
    seed.intensity ??
    (seed.difficulty >= 4 ? "high" : seed.difficulty >= 2 ? "medium" : "low");
  const tags = seed.tags ?? [
    seed.category.toLowerCase().replace(/\s+/g, "-"),
    seed.mode.toLowerCase(),
  ];

  // Q1 interaction type — the opening widget for each mode
  const q1Type = (): ScenarioNode["interactionType"] => {
    if (seed.mode === "Puzzle")    return "red-flag";
    if (seed.mode === "Strategy")  return "strategy-grid";
    if (seed.mode === "Role-Play") return "chat";
    if (seed.mode === "Story")     return "avatar-path";
    return "whack-a-mole"; // Simulation
  };

  // Q2 interactionData varies by mode
  const q2SafeInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q2InteractionType(seed.mode);
    if (type === "red-flag") return { text: seed.q2SafePrompt ?? "Scan the scene for immediate risks.", targets: ["isolated", "threat", "danger"] };
    if (type === "match")    return { pairs: [{ key: "Staff Presence", value: "Security Layer" }, { key: "Trusted Contact", value: "Visibility Layer" }] };
    return undefined;
  };
  const q2AssertInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q2InteractionType(seed.mode);
    if (type === "red-flag") return { text: seed.q2AssertPrompt ?? "Read the situation for escalation cues.", targets: ["aggression", "pressure", "block"] };
    if (type === "match")    return { pairs: [{ key: "Formal Support", value: "Escalation" }, { key: "Distance", value: "Stabilization" }] };
    return undefined;
  };
  const q2RiskyInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q2InteractionType(seed.mode);
    if (type === "red-flag") return { text: seed.q2RiskyPrompt ?? "Identify warning signs you may have missed.", targets: ["exposed", "alone", "risky"] };
    if (type === "match")    return { pairs: [{ key: "Public Zone", value: "Visibility" }, { key: "Formal Record", value: "Report" }] };
    return undefined;
  };

  // Q3 interactionData for each branch
  const q3SafeAInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q3InteractionType(seed.mode);
    if (type === "match")       return { pairs: [{ key: "Witness Present", value: "Deterrence" }, { key: "Staff Alerted", value: "Backup" }] };
    if (type === "red-flag")    return { text: "Scan the bystander interaction for risks.", targets: ["distraction", "threat", "pressure"] };
    if (type === "chat")        return { npcInitial: "Are you okay? Can I help?", keywords: ["yes", "help", "stay", "witness"] };
    if (type === "avatar-path") return { safeOption: "Stay with bystander", riskyOption: "Leave alone" };
    return undefined;
  };
  const q3AssertAInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q3InteractionType(seed.mode);
    if (type === "match")       return { pairs: [{ key: "Full Report", value: "Formal Record" }, { key: "Verbal Note", value: "Informal Record" }] };
    if (type === "red-flag")    return { text: "Review the authority's questions for gaps.", targets: ["vague", "pressure", "skip"] };
    if (type === "chat")        return { npcInitial: "We can log this formally or keep it informal — what do you prefer?", keywords: ["formal", "record", "report", "document"] };
    if (type === "avatar-path") return { safeOption: "File formal record", riskyOption: "Skip documentation" };
    return undefined;
  };
  const q3RiskyAInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q3InteractionType(seed.mode);
    if (type === "match")       return { pairs: [{ key: "Explain to Staff", value: "Transparency" }, { key: "Move to Exit", value: "Self-protection" }] };
    if (type === "red-flag")    return { text: "Check the staff interaction for opportunities.", targets: ["dismiss", "ignore", "rush"] };
    if (type === "chat")        return { npcInitial: "Everything okay? You look a bit shaken.", keywords: ["help", "explain", "stay", "report"] };
    if (type === "avatar-path") return { safeOption: "Tell staff everything", riskyOption: "Say you're fine" };
    return undefined;
  };

  // Q4 interactionData
  const q4HighInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q4InteractionType(seed.mode);
    if (type === "match")          return { pairs: [{ key: "Witness Report", value: "Corroboration" }, { key: "Contact Details", value: "Follow-up Support" }] };
    if (type === "strategy-grid")  return { targets: ["document", "support", "report"] };
    return undefined;
  };
  const q4MidInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q4InteractionType(seed.mode);
    if (type === "match")          return { pairs: [{ key: "Counsellor", value: "Emotional Recovery" }, { key: "Safety Plan", value: "Future Readiness" }] };
    if (type === "strategy-grid")  return { targets: ["reflect", "support", "plan"] };
    return undefined;
  };
  const q4LowInteractionData = (): ScenarioNode["interactionData"] => {
    const type = q4InteractionType(seed.mode);
    if (type === "match")          return { pairs: [{ key: "Safe Zones", value: "Spatial Awareness" }, { key: "Trusted Contact", value: "Network Layer" }] };
    if (type === "strategy-grid")  return { targets: ["awareness", "contacts", "routes"] };
    return undefined;
  };

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
    startNodeId: "n1",
    nodes: {
      // ── Q1 ────────────────────────────────────────────────────────────
      n1: {
        id: "n1",
        description: seed.prompt,
        mood: "tense",
        interactionType: q1Type(),
        interactionData: {
          text: seed.prompt,
          targets:
            seed.mode === "Puzzle"
              ? ["scam", "urgent", "payment", "threat", "pressure"]
              : seed.mode === "Strategy"
                ? ["security", "lights", "crowd"]
                : undefined,
          pairs: undefined,
          npcInitial:
            seed.mode === "Role-Play"
              ? (seed.npcInitial ?? "Hi there.")
              : undefined,
          keywords:
            seed.mode === "Role-Play"
              ? ["no", "boundary", "stop", "respect"]
              : undefined,
          safeOption: seed.mode === "Story" ? seed.saferChoice : undefined,
          riskyOption: seed.mode === "Story" ? seed.riskyChoice : undefined,
        },
        choices: [
          {
            id: "c1_safe",
            text: seed.saferChoice,
            riskImpact: -10,
            eqImpact: 12,
            nextNodeId: "n2_safe",
            aiCoachNote: seed.tip,
          },
          {
            id: "c1_assert",
            text: seed.assertiveChoice,
            riskImpact: -6,
            eqImpact: 9,
            nextNodeId: "n2_assert",
            aiCoachNote: "Assertive action helps when combined with situational awareness.",
          },
          {
            id: "c1_risky",
            text: seed.riskyChoice,
            riskImpact: 9,
            eqImpact: 2,
            nextNodeId: "n2_risky",
            aiCoachNote: "This can feel easier in the moment but may increase exposure.",
          },
        ],
      },

      // ── Q2 ────────────────────────────────────────────────────────────
      n2_safe: {
        id: "n2_safe",
        description:
          seed.q2SafePrompt ??
          "Your first move lowered immediate risk. The other person pauses, and bystanders are nearby. What is your next step to secure the situation?",
        mood: "neutral",
        interactionType: q2InteractionType(seed.mode),
        interactionData: q2SafeInteractionData(),
        choices: [
          {
            id: "c2_safe_layered",
            text: seed.q2SafeChoice1 ?? "Add a second safety layer: move to staff/security and update a trusted contact.",
            riskImpact: -10, eqImpact: 11, nextNodeId: "n3_safe_a",
            aiCoachNote: "Layered safety decisions create strong outcomes.",
          },
          {
            id: "c2_safe_fast_exit",
            text: seed.q2SafeChoice2 ?? "Exit quickly to a safer space and monitor from distance.",
            riskImpact: -6, eqImpact: 8, nextNodeId: "n3_safe_b",
            aiCoachNote: "Quick exit is useful; add reporting when possible.",
          },
          {
            id: "c2_safe_reengage",
            text: seed.q2SafeChoice3 ?? "Re-engage directly to \"settle\" the issue one-to-one.",
            riskImpact: 5, eqImpact: 1, nextNodeId: "n3_safe_c",
            aiCoachNote: "Re-engaging can reopen risk after initial safety.",
          },
        ],
      },
      n2_assert: {
        id: "n2_assert",
        description:
          seed.q2AssertPrompt ??
          "Your boundary was clear. The situation is mixed: not fully resolved, but you have some control. What do you do next?",
        mood: "tense",
        interactionType: q2InteractionType(seed.mode),
        interactionData: q2AssertInteractionData(),
        choices: [
          {
            id: "c2_assert_support",
            text: seed.q2AssertChoice1 ?? "Escalate appropriately: involve authority/support and document details.",
            riskImpact: -9, eqImpact: 10, nextNodeId: "n3_assert_a",
            aiCoachNote: "Assertiveness plus support usually gives better protection.",
          },
          {
            id: "c2_assert_hold",
            text: seed.q2AssertChoice2 ?? "Maintain distance and leave without further interaction.",
            riskImpact: -5, eqImpact: 7, nextNodeId: "n3_assert_b",
            aiCoachNote: "A valid stabilizing step; consider reporting if pattern repeats.",
          },
          {
            id: "c2_assert_argue",
            text: seed.q2AssertChoice3 ?? "Continue argument in place to prove a point.",
            riskImpact: 7, eqImpact: 0, nextNodeId: "n3_assert_c",
            aiCoachNote: "Prolonged confrontation can increase exposure.",
          },
        ],
      },
      n2_risky: {
        id: "n2_risky",
        description:
          seed.q2RiskyPrompt ??
          "Risk has increased. You still have a chance to recover if you act now with a focused safety step.",
        mood: "escalated",
        interactionType: q2InteractionType(seed.mode),
        interactionData: q2RiskyInteractionData(),
        choices: [
          {
            id: "c2_risky_recover",
            text: seed.q2RiskyChoice1 ?? "Pause, seek visible support, and move to a controlled/public zone.",
            riskImpact: -12, eqImpact: 10, nextNodeId: "n3_risky_a",
            aiCoachNote: "Recovery choices matter; late correction still helps.",
          },
          {
            id: "c2_risky_report",
            text: seed.q2RiskyChoice2 ?? "Immediately report and request active intervention.",
            riskImpact: -14, eqImpact: 11, nextNodeId: "n3_risky_b",
            aiCoachNote: "Escalating to formal support can reset safety quickly.",
          },
          {
            id: "c2_risky_continue",
            text: seed.q2RiskyChoice3 ?? "Continue same path and avoid taking additional steps.",
            riskImpact: 8, eqImpact: -2, nextNodeId: "n3_risky_c",
            aiCoachNote: "Inaction after warning signs often worsens outcomes.",
          },
        ],
      },

      // ── Q3 ────────────────────────────────────────────────────────────
      n3_safe_a: {
        id: "n3_safe_a",
        description:
          "Staff is present and your contact knows your location. A concerned bystander makes eye contact with you. Do you involve them?",
        mood: "neutral",
        interactionType: q3InteractionType(seed.mode),
        interactionData: q3SafeAInteractionData(),
        choices: [
          {
            id: "c3sa_1",
            text: "Ask the bystander to stay close as a witness.",
            riskImpact: -8,
            eqImpact: 9,
            nextNodeId: "n4_high",
            aiCoachNote:
              "Witness presence is a strong deterrent and adds credibility.",
          },
          {
            id: "c3sa_2",
            text: "Handle it with staff only — keep it contained.",
            riskImpact: -4,
            eqImpact: 6,
            nextNodeId: "n4_mid",
            aiCoachNote: "Staff alone is still effective.",
          },
          {
            id: "c3sa_3",
            text: "Leave immediately without briefing anyone.",
            riskImpact: 4,
            eqImpact: 2,
            nextNodeId: "n4_low",
            aiCoachNote:
              "Leaving without a handoff can leave gaps in the safety loop.",
          },
        ],
      },
      n3_safe_b: {
        id: "n3_safe_b",
        description:
          "You are in a safer area and your heart rate is settling. What do you do in the next 10 minutes to close the loop?",
        mood: "relieved",
        interactionType: "mcq",
        choices: [
          {
            id: "c3sb_1",
            text: "Log a formal report with location, time, and a description.",
            riskImpact: -9,
            eqImpact: 10,
            nextNodeId: "n4_high",
            aiCoachNote:
              "Documentation protects you and helps others in similar situations.",
          },
          {
            id: "c3sb_2",
            text: "Call a trusted friend and brief them on what happened.",
            riskImpact: -5,
            eqImpact: 8,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "Social support aids processing and keeps you accountable.",
          },
          {
            id: "c3sb_3",
            text: "Ignore it — you are safe now, that is enough.",
            riskImpact: 3,
            eqImpact: 1,
            nextNodeId: "n4_low",
            aiCoachNote:
              "Skipping the debrief means the pattern may repeat for others.",
          },
        ],
      },
      n3_safe_c: {
        id: "n3_safe_c",
        description:
          "Re-engaging escalated the tension. The person becomes verbally defensive. What is your recovery move?",
        mood: "tense",
        interactionType: "mcq",
        choices: [
          {
            id: "c3sc_1",
            text: '"This conversation is over." Turn and walk away calmly.',
            riskImpact: -10,
            eqImpact: 11,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "A clean exit after a misstep is still the right call.",
          },
          {
            id: "c3sc_2",
            text: "Call someone loudly so bystanders know you are not alone.",
            riskImpact: -7,
            eqImpact: 8,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "Perceived social connection changes the dynamic quickly.",
          },
          {
            id: "c3sc_3",
            text: "Match their defensive tone to win the argument.",
            riskImpact: 9,
            eqImpact: -1,
            nextNodeId: "n4_low",
            aiCoachNote: "Matching aggression rarely de-escalates a situation.",
          },
        ],
      },
      n3_assert_a: {
        id: "n3_assert_a",
        description:
          "The authority is now involved. They ask if you want to make a formal record. What do you decide?",
        mood: "neutral",
        interactionType: q3InteractionType(seed.mode),
        interactionData: q3AssertAInteractionData(),
        choices: [
          {
            id: "c3aa_1",
            text: "Yes — provide full details and request a copy of the report.",
            riskImpact: -10,
            eqImpact: 12,
            nextNodeId: "n4_high",
            aiCoachNote:
              "A formal record is your strongest long-term protection.",
          },
          {
            id: "c3aa_2",
            text: "Verbal note only — keep it informal for now.",
            riskImpact: -5,
            eqImpact: 7,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "Informal notes are better than nothing but give less legal protection.",
          },
          {
            id: "c3aa_3",
            text: "Decline — you do not want to make it a big deal.",
            riskImpact: 4,
            eqImpact: 2,
            nextNodeId: "n4_low",
            aiCoachNote:
              "Declining documentation leaves you unprotected if behaviour recurs.",
          },
        ],
      },
      n3_assert_b: {
        id: "n3_assert_b",
        description:
          "You maintained distance, but later that day you receive an unexpected message from the same person. How do you respond?",
        mood: "tense",
        interactionType: "mcq",
        choices: [
          {
            id: "c3ab_1",
            text: "Do not reply. Screenshot and report to relevant authority.",
            riskImpact: -11,
            eqImpact: 11,
            nextNodeId: "n4_high",
            aiCoachNote:
              "Non-response plus evidence collection is the safest path.",
          },
          {
            id: "c3ab_2",
            text: "Reply once to set a final clear boundary, then block.",
            riskImpact: -6,
            eqImpact: 8,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "One clear message then blocking is a reasonable response.",
          },
          {
            id: "c3ab_3",
            text: "Reply and try to resolve it over text.",
            riskImpact: 6,
            eqImpact: 2,
            nextNodeId: "n4_low",
            aiCoachNote: "Text conversations are hard to close cleanly.",
          },
        ],
      },
      n3_assert_c: {
        id: "n3_assert_c",
        description:
          "The argument draws attention. A bystander steps in and asks if you need help. What do you do?",
        mood: "escalated",
        interactionType: "mcq",
        choices: [
          {
            id: "c3ac_1",
            text: '"Yes, please stay with me."',
            riskImpact: -12,
            eqImpact: 12,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "Accepting bystander support is smart, not a sign of weakness.",
          },
          {
            id: "c3ac_2",
            text: "Thank them, say you have it handled, then exit immediately.",
            riskImpact: -7,
            eqImpact: 7,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "Self-exiting after acknowledgment is a strong recovery.",
          },
          {
            id: "c3ac_3",
            text: "Tell them to stay out of it and continue the argument.",
            riskImpact: 8,
            eqImpact: -2,
            nextNodeId: "n4_low",
            aiCoachNote:
              "Refusing help while escalating significantly increases risk.",
          },
        ],
      },
      n3_risky_a: {
        id: "n3_risky_a",
        description:
          "You are in a visible zone and risk has dropped. A staff member approaches and asks if everything is okay. What do you say?",
        mood: "neutral",
        interactionType: q3InteractionType(seed.mode),
        interactionData: q3RiskyAInteractionData(),
        choices: [
          {
            id: "c3ra_1",
            text: "Explain what happened and ask them to stay visible nearby.",
            riskImpact: -10,
            eqImpact: 10,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "Transparency with staff builds a reliable safety net.",
          },
          {
            id: "c3ra_2",
            text: "Say you are fine but move closer to the exit.",
            riskImpact: -4,
            eqImpact: 5,
            nextNodeId: "n4_low",
            aiCoachNote:
              "Partial action still helps but misses a support opportunity.",
          },
          {
            id: "c3ra_3",
            text: "Say nothing and walk away quickly.",
            riskImpact: 3,
            eqImpact: 1,
            nextNodeId: "n4_low",
            aiCoachNote:
              "Missed opportunity to activate an available support system.",
          },
        ],
      },
      n3_risky_b: {
        id: "n3_risky_b",
        description:
          "Intervention is on the way. While waiting, the person approaches you again. What is your immediate action?",
        mood: "escalated",
        interactionType: "mcq",
        choices: [
          {
            id: "c3rb_1",
            text: "Stay visible and call out loudly if they come closer.",
            riskImpact: -11,
            eqImpact: 11,
            nextNodeId: "n4_high",
            aiCoachNote: "Visibility and noise are powerful protective tools.",
          },
          {
            id: "c3rb_2",
            text: "Move immediately toward the nearest group of people.",
            riskImpact: -8,
            eqImpact: 8,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "Crowd proximity significantly reduces individual risk.",
          },
          {
            id: "c3rb_3",
            text: "Freeze and wait for them to pass.",
            riskImpact: 7,
            eqImpact: 0,
            nextNodeId: "n4_low",
            aiCoachNote: "Freezing in place is the least protective response.",
          },
        ],
      },
      n3_risky_c: {
        id: "n3_risky_c",
        description:
          "The situation has escalated further and you feel unsafe. This is a critical moment. What is your immediate action?",
        mood: "escalated",
        interactionType: "mcq",
        choices: [
          {
            id: "c3rc_1",
            text: "Move urgently to the nearest staffed area and call for help loudly.",
            riskImpact: -14,
            eqImpact: 12,
            nextNodeId: "n4_mid",
            aiCoachNote:
              "Late action is still action — moving is always better than staying.",
          },
          {
            id: "c3rc_2",
            text: "Call someone loudly on your phone while moving away.",
            riskImpact: -9,
            eqImpact: 8,
            nextNodeId: "n4_low",
            aiCoachNote:
              "A live call signals you are connected and being monitored.",
          },
          {
            id: "c3rc_3",
            text: "Stay put and hope the situation resolves itself.",
            riskImpact: 10,
            eqImpact: -3,
            nextNodeId: "n4_low",
            aiCoachNote:
              "Passivity in escalated situations significantly increases risk.",
          },
        ],
      },

      // ── Q4 ────────────────────────────────────────────────────────────
      n4_high: {
        id: "n4_high",
        description:
          "You are in a strong safety position. A witness who saw the incident asks if they should also report what they observed. What do you advise?",
        mood: "neutral",
        interactionType: q4InteractionType(seed.mode),
        interactionData: q4HighInteractionData(),
        choices: [
          {
            id: "c4h_1",
            text: "Yes — ask them to file a corroborating report and share their contact details.",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Corroborating witnesses significantly strengthen a formal case.",
          },
          {
            id: "c4h_2",
            text: "It is up to them — you are already well protected.",
            riskImpact: -3,
            eqImpact: 6,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Independent witness reports are valuable even when optional.",
          },
          {
            id: "c4h_3",
            text: "Ask them to stay out of it to avoid complications.",
            riskImpact: 2,
            eqImpact: 1,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Declining witness support reduces your level of protection.",
          },
        ],
      },
      n4_mid: {
        id: "n4_mid",
        description:
          "You are stable. The experience shook your confidence a little. What is your next step to rebuild?",
        mood: "relieved",
        interactionType: q4InteractionType(seed.mode),
        interactionData: q4MidInteractionData(),
        choices: [
          {
            id: "c4m_1",
            text: "Speak to a counsellor, support group, or trusted mentor about it.",
            riskImpact: -6,
            eqImpact: 12,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Processing difficult experiences strengthens long-term resilience.",
          },
          {
            id: "c4m_2",
            text: "Review your personal safety habits and update your plan.",
            riskImpact: -5,
            eqImpact: 9,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Turning experience into preparation is a strong adaptive mindset.",
          },
          {
            id: "c4m_3",
            text: "Push through alone — you do not need help.",
            riskImpact: 2,
            eqImpact: 2,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Avoiding support after stress can delay full recovery.",
          },
        ],
      },
      n4_low: {
        id: "n4_low",
        description:
          "Risk remains elevated. You realize you need a clearer personal safety plan. What is your first concrete step?",
        mood: "tense",
        interactionType: q4InteractionType(seed.mode),
        interactionData: q4LowInteractionData(),
        choices: [
          {
            id: "c4l_1",
            text: "Identify three safe zones you can reach quickly in your daily environment.",
            riskImpact: -10,
            eqImpact: 10,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Pre-mapping safe zones dramatically improves your response speed.",
          },
          {
            id: "c4l_2",
            text: "Share your daily routes and schedule with a trusted contact.",
            riskImpact: -8,
            eqImpact: 9,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Visibility to trusted people is a foundational safety layer.",
          },
          {
            id: "c4l_3",
            text: "Decide to be more careful next time, but make no specific changes.",
            riskImpact: 4,
            eqImpact: 1,
            nextNodeId: "n5_final",
            aiCoachNote:
              "Vague intentions without concrete action rarely change outcomes.",
          },
        ],
      },

      // ── Q5 ────────────────────────────────────────────────────────────
      n5_final: {
        id: "n5_final",
        description:
          "Final step — safety debrief. Which statement best reflects what you have learned from this experience?",
        mood: "neutral",
        interactionType: "mcq",
        choices: [
          {
            id: "c5_1",
            text: "Early action, visibility, and layered support are my core safety toolkit.",
            riskImpact: -8,
            eqImpact: 12,
            nextNodeId: "n_safe",
            aiCoachNote:
              "This is the core insight of situational safety training. Well done.",
          },
          {
            id: "c5_2",
            text: "I need to practise recognizing warning signs before they escalate.",
            riskImpact: -5,
            eqImpact: 9,
            nextNodeId: "n_partial",
            aiCoachNote:
              "Pattern recognition is a learnable skill — keep practising.",
          },
          {
            id: "c5_3",
            text: "I am still unsure how I would handle this in real life.",
            riskImpact: 2,
            eqImpact: 4,
            nextNodeId: "n_learning",
            aiCoachNote:
              "Uncertainty is the beginning of learning. Replay to build confidence.",
          },
        ],
      },

      // ── END NODES ─────────────────────────────────────────────────────
      n_safe: {
        id: "n_safe",
        description:
          "Excellent work across all five steps. You used layered safety — awareness, support structures, and controlled action — to stay in control throughout.",
        mood: "resolved",
        isEnd: true,
        endType: "safe",
        choices: [],
      },
      n_partial: {
        id: "n_partial",
        description:
          "You handled the situation with growing confidence. A few decisions could be sharper, but your instincts are developing well. Keep building on this.",
        mood: "relieved",
        isEnd: true,
        endType: "partial",
        choices: [],
      },
      n_learning: {
        id: "n_learning",
        description:
          "You completed all five steps. Some choices increased uncertainty, but finishing the full scenario is valuable practice. Replay to strengthen your safety instincts.",
        mood: "escalated",
        isEnd: true,
        endType: "learning",
        choices: [],
      },
    },
  };
}

const EXPANSION_SCENARIOS: Record<string, Scenario> = {
  "the-empty-elevator": createMiniScenario({
    id: "the-empty-elevator",
    title: "The Empty Elevator",
    category: "Public Spaces",
    mode: "Simulation",
    icon: "🏢",
    difficulty: 2,
    duration: "7 min",
    color: "#5a1228",
    triggerWarnings: ["Isolation anxiety"],
    context:
      "You enter a nearly empty office building lift late in the evening.",
    backgroundMood: "linear-gradient(135deg, #1a1a24 0%, #35213d 100%)",
    prompt:
      "A stranger steps in and stands unusually close despite free space.",
    saferChoice: "Step out at the next floor near security and wait.",
    assertiveChoice: "Ask for personal space in a calm, firm tone.",
    riskyChoice: "Ignore discomfort and continue silently.",
    tip: "Distance and visible staff presence are powerful safety tools.",
    q2SafePrompt: 'You stepped out and security is nearby. The stranger follows to the same floor. What do you do now?',
q2SafeChoice1: 'Walk directly to the security desk and describe what happened.',
q2SafeChoice2: 'Call someone loudly so the stranger knows you are connected.',
q2SafeChoice3: 'Go back into the lift hoping they stay behind.',

q2AssertPrompt: 'They backed off slightly after your request. The lift is still moving. What is your next move?',
q2AssertChoice1: 'Exit at the next floor near reception and inform staff.',
q2AssertChoice2: 'Stand near the lift panel buttons and stay alert until your floor.',
q2AssertChoice3: 'Ignore further movement and stare at your phone.',

q2RiskyPrompt: 'You stayed silent and discomfort grew. The stranger is now speaking to you. How do you respond?',
q2RiskyChoice1: 'Exit immediately at the next floor and move toward visible staff.',
q2RiskyChoice2: 'Give short, firm replies and press the door-open button at next floor.',
q2RiskyChoice3: 'Respond politely to avoid escalation.',
  }),
  "hostel-gate-after-curfew": createMiniScenario({
    id: "hostel-gate-after-curfew",
    title: "Hostel Gate After Curfew",
    category: "Campus Safety",
    mode: "Strategy",
    icon: "🏫",
    difficulty: 2,
    duration: "8 min",
    color: "#7b1d3a",
    triggerWarnings: ["Night-time stress"],
    context: "You return late and the hostel lane is quieter than usual.",
    backgroundMood: "linear-gradient(135deg, #0f1123 0%, #2a1a38 100%)",
    prompt: "Two unknown men are lingering near the gate, watching arrivals.",
    saferChoice:
      "Call gate security before approaching and wait in a lit area.",
    assertiveChoice: "Walk to a nearby shop and request escort support.",
    riskyChoice: "Walk directly to the gate alone without alerting anyone.",
    tip: "Pre-alerting trusted staff reduces uncertainty and response time.",
  }),
  "festival-crowd-pressure": createMiniScenario({
    id: "festival-crowd-pressure",
    title: "Festival Crowd Pressure",
    category: "Public Events",
    mode: "Simulation",
    icon: "🎪",
    difficulty: 3,
    duration: "9 min",
    color: "#a03c6f",
    triggerWarnings: ["Crowd pressure"],
    context: "You are in a dense festival crowd near a temporary exit lane.",
    backgroundMood: "linear-gradient(135deg, #2a1324 0%, #4d1c3e 100%)",
    prompt: "Someone repeatedly pushes from behind and blocks your movement.",
    saferChoice: "Move toward family/help desk and report crowd harassment.",
    assertiveChoice:
      "Use loud voice to create space and request bystander support.",
    riskyChoice: "Stay in the same pocket and hope it settles.",
    tip: "In crowd scenarios, move toward controlled zones and officials.",
    q2SafePrompt: 'You reached the help desk and reported. They assign a volunteer to walk with you. The volunteer asks where you want to go. What do you say?',
q2SafeChoice1: 'Ask to be escorted to the nearest exit or a less crowded zone.',
q2SafeChoice2: 'Request to stay at the help desk until the crowd thins.',
q2SafeChoice3: 'Say you are fine now and head back into the crowd alone.',

q2AssertPrompt: 'You called out and created space. The person stopped but is still nearby. Bystanders are watching. What do you do?',
q2AssertChoice1: 'Keep moving toward the event exit while staying vocal if they follow.',
q2AssertChoice2: 'Ask a nearby bystander to walk with you to the help desk.',
q2AssertChoice3: 'Stay in place and wait to see if they move away.',

q2RiskyPrompt: 'You stayed and the pushing intensified. You feel trapped in the crowd. What is your best immediate action?',
q2RiskyChoice1: 'Move diagonally toward the crowd edge — never fight directly forward.',
q2RiskyChoice2: 'Shout loudly for space and make eye contact with event staff.',
q2RiskyChoice3: 'Crouch down to avoid the pressure and wait it out.',
  }),
  "gym-trainer-boundaries": createMiniScenario({
    id: "gym-trainer-boundaries",
    title: "Gym Trainer Boundaries",
    category: "Social Situations",
    mode: "Role-Play",
    icon: "🏋️",
    difficulty: 2,
    duration: "7 min",
    color: "#8f2f4f",
    triggerWarnings: ["Boundary crossing"],
    context:
      "During training, an instructor gives unsolicited personal comments.",
    backgroundMood: "linear-gradient(135deg, #1d1f2c 0%, #3a2940 100%)",
    prompt:
      "Comments shift from fitness guidance to appearance-focused remarks.",
    npcInitial:
      "Good set! You're really improving. You know honestly — you'd look even better if you dropped a bit around here. Just saying as your trainer, it's motivating feedback.",
    saferChoice: "Report to manager and request another trainer immediately.",
    assertiveChoice: "State clear boundary: keep feedback exercise-focused.",
    riskyChoice: "Laugh it off to avoid awkwardness.",
    tip: "Clear boundaries plus documentation protect future interactions.",
  }),
  "pg-owner-pressure": createMiniScenario({
    id: "pg-owner-pressure",
    title: "PG Owner Pressure",
    category: "Accommodation",
    mode: "Story",
    icon: "🏠",
    difficulty: 3,
    duration: "8 min",
    color: "#6b2d59",
    triggerWarnings: ["Power imbalance"],
    context:
      "A paying-guest owner makes repeated intrusive personal questions.",
    backgroundMood: "linear-gradient(135deg, #161828 0%, #30203b 100%)",
    prompt: "The owner insists on entering your room without notice.",
    saferChoice:
      "Document incidents and contact women’s hostel support network.",
    assertiveChoice:
      "State tenancy boundaries and request written notice policy.",
    riskyChoice: "Allow it to avoid conflict.",
    tip: "Housing boundaries should be explicit and documented.",
  }),
  "interview-scam-call": createMiniScenario({
    id: "interview-scam-call",
    title: "Interview Scam Call",
    category: "Online Safety",
    mode: "Puzzle",
    icon: "📞",
    difficulty: 2,
    duration: "6 min",
    color: "#5d3d9a",
    triggerWarnings: ["Scam attempt"],
    context: "You get a call claiming urgent interview processing fee payment.",
    backgroundMood: "linear-gradient(135deg, #11172d 0%, #27345f 100%)",
    prompt:
      "Caller pressures immediate payment using UPI to confirm your slot.",
    saferChoice: "Verify company details independently before any payment.",
    assertiveChoice:
      "Ask for official mail and disconnect pending verification.",
    riskyChoice: "Pay quickly to avoid “missing the opportunity”.",
    tip: "Urgency + payment demand is a classic scam marker.",
  }),
  "cafe-wifi-trap": createMiniScenario({
    id: "cafe-wifi-trap",
    title: "Cafe Wi-Fi Trap",
    category: "Digital Security",
    mode: "Puzzle",
    icon: "📶",
    difficulty: 2,
    duration: "6 min",
    color: "#2f5c88",
    triggerWarnings: ["Data theft risk"],
    context: "A free Wi-Fi portal asks extra permissions and OTP verification.",
    backgroundMood: "linear-gradient(135deg, #0f1f31 0%, #1f4567 100%)",
    prompt: "A nearby stranger offers to “help” by taking your phone.",
    saferChoice: "Disconnect and use mobile data for sensitive tasks.",
    assertiveChoice: "Decline help and verify network name with staff.",
    riskyChoice: "Share device and OTP to finish quickly.",
    tip: "Never share OTP/device control in public networks.",
  }),
  "friends-party-exit-plan": createMiniScenario({
    id: "friends-party-exit-plan",
    title: "Friend’s Party Exit Plan",
    category: "Social Situations",
    mode: "Strategy",
    icon: "🎉",
    difficulty: 2,
    duration: "7 min",
    color: "#9a3f63",
    triggerWarnings: ["Peer pressure"],
    context:
      "At a house party, your ride cancels and the group insists you stay late.",
    backgroundMood: "linear-gradient(135deg, #241427 0%, #4a2041 100%)",
    prompt: "Someone offers a ride but your intuition flags uncertainty.",
    saferChoice: "Book verified transport and wait with trusted friend.",
    assertiveChoice: "Share live location and trip details before leaving.",
    riskyChoice: "Accept unknown ride due to social pressure.",
    tip: "Have an independent exit plan before high-social settings.",
  }),
  "market-lane-shortcut": createMiniScenario({
    id: "market-lane-shortcut",
    title: "Market Lane Shortcut",
    category: "Travel",
    mode: "Simulation",
    icon: "🛍️",
    difficulty: 2,
    duration: "7 min",
    color: "#7d3b2f",
    triggerWarnings: ["Route safety"],
    context: "A vendor suggests a shortcut through a less lit lane.",
    backgroundMood: "linear-gradient(135deg, #2b1a16 0%, #4c2c25 100%)",
    prompt: "You are carrying bags and it is getting dark.",
    saferChoice: "Take the longer main road with active foot traffic.",
    assertiveChoice: "Request directions from verified police/help booth.",
    riskyChoice: "Take the isolated shortcut to save time.",
    tip: "Predictable busy routes often reduce risk exposure.",
  }),
  "office-cab-group-drop": createMiniScenario({
    id: "office-cab-group-drop",
    title: "Office Cab Group Drop",
    category: "Work Commute",
    mode: "Strategy",
    icon: "🚐",
    difficulty: 3,
    duration: "8 min",
    color: "#3d4a8a",
    triggerWarnings: ["Commute vulnerability"],
    context:
      "You are last in a shared office cab and route changes unexpectedly.",
    backgroundMood: "linear-gradient(135deg, #14192f 0%, #29346c 100%)",
    prompt: "Driver says company app is “glitching” and ignores mapped route.",
    saferChoice: "Call company transport desk and request route correction.",
    assertiveChoice: "Share trip tracking with family and request public stop.",
    riskyChoice: "Stay silent because drop point is “almost there”.",
    tip: "When route deviates, create immediate external visibility.",
  }),
  "co-working-space-stranger": createMiniScenario({
    id: "co-working-space-stranger",
    title: "Co-working Space Stranger",
    category: "Workplace",
    mode: "Role-Play",
    icon: "💻",
    difficulty: 2,
    duration: "6 min",
    color: "#6c3665",
    triggerWarnings: ["Persistent approach"],
    context:
      "A stranger repeatedly interrupts your table despite polite refusal.",
    backgroundMood: "linear-gradient(135deg, #18182a 0%, #322648 100%)",
    prompt: "They ask personal questions and try to sit close repeatedly.",
    npcInitial:
      "Hey! You look really focused — what do you do? Which company? Do you live around here? I'm Arjun, I run a small startup. Can I sit here for a bit?",
    saferChoice: "Move to staffed desk area and inform co-working reception.",
    assertiveChoice: "Set direct boundary and mention formal complaint option.",
    riskyChoice: "Continue engaging to avoid appearing rude.",
    tip: "Respectful firmness is appropriate in repeated boundary tests.",
    q2SafePrompt: 'You moved to the staffed area. The person follows and sits at the next desk. Reception is watching. What do you do?',
q2SafeChoice1: 'Speak quietly to reception staff and ask them to intervene.',
q2SafeChoice2: 'Sit facing the reception desk so staff remain in your sightline.',
q2SafeChoice3: 'Pack up and find a different co-working space entirely.',

q2AssertPrompt: 'You set a direct boundary. They went quiet but are still present. Your work is unfinished. How do you proceed?',
q2AssertChoice1: 'Inform reception formally and request a seating change for both parties.',
q2AssertChoice2: 'Continue working while sitting near other members and reception.',
q2AssertChoice3: 'Leave early to avoid further interaction.',

q2RiskyPrompt: 'You kept engaging and the conversation became uncomfortably personal. What is your best move now?',
q2RiskyChoice1: 'End the conversation directly and move to the managed desk zone.',
q2RiskyChoice2: 'Pick up your phone, pretend you have a call, and relocate.',
q2RiskyChoice3: 'Stay but give only one-word answers until they lose interest.',
  }),
  "apartment-delivery-check": createMiniScenario({
    id: "apartment-delivery-check",
    title: "Apartment Delivery Check",
    category: "Home Safety",
    mode: "Simulation",
    icon: "📦",
    difficulty: 2,
    duration: "6 min",
    color: "#7a5a2d",
    triggerWarnings: ["Impersonation risk"],
    context: "Someone claims to deliver a parcel but the app shows no order.",
    backgroundMood: "linear-gradient(135deg, #2a2214 0%, #5a4a2a 100%)",
    prompt: "The person insists you open the door to “verify address.”",
    saferChoice: "Confirm via app and ask security to handle the interaction.",
    assertiveChoice: "Speak through door camera/intercom only.",
    riskyChoice: "Open the door to check quickly.",
    tip: "Verification before access is essential for home safety.",
    q2SafePrompt: 'Security confirmed no delivery was scheduled. The person is still at the building entrance. What do you do?',
q2SafeChoice1: 'Ask security to ask them to leave and log the incident.',
q2SafeChoice2: 'Call the delivery app helpline to verify and report the impersonation.',
q2SafeChoice3: 'Open the door a crack to check the parcel label.',

q2AssertPrompt: 'You spoke through the intercom. They claim the parcel is fragile and must be handed personally. Your response?',
q2AssertChoice1: 'Decline firmly — instruct them to leave it with the building guard.',
q2AssertChoice2: 'Ask them to show their delivery ID through the camera clearly.',
q2AssertChoice3: 'Say you will come down in a few minutes and disconnect.',

q2RiskyPrompt: 'You opened the door and they pushed a box inside. Your immediate action?',
q2RiskyChoice1: 'Step back, close the door immediately, and call building security.',
q2RiskyChoice2: 'Shout for neighbours and call 112 straight away.',
q2RiskyChoice3: 'Apologise and ask them to leave calmly.',
  }),
  "classroom-group-chat-leak": createMiniScenario({
    id: "classroom-group-chat-leak",
    title: "Classroom Group Chat Leak",
    category: "Online Safety",
    mode: "Story",
    icon: "🧩",
    difficulty: 2,
    duration: "7 min",
    color: "#3f5c9b",
    triggerWarnings: ["Privacy breach"],
    context:
      "A private screenshot from your class group appears on another page.",
    backgroundMood: "linear-gradient(135deg, #13203a 0%, #274681 100%)",
    prompt:
      "A classmate asks you not to report because it could “create drama.”",
    saferChoice: "Report with evidence and ask admin to enforce guidelines.",
    assertiveChoice: "Address breach directly in moderated group setting.",
    riskyChoice: "Ignore it and hope the issue fades.",
    tip: "Timely reporting limits spread and protects others.",
  }),
  "railway-platform-delay": createMiniScenario({
    id: "railway-platform-delay",
    title: "Railway Platform Delay",
    category: "Public Transport",
    mode: "Simulation",
    icon: "🚉",
    difficulty: 3,
    duration: "8 min",
    color: "#8b2f40",
    triggerWarnings: ["Night wait anxiety"],
    context: "Your train is delayed and platform footfall drops late at night.",
    backgroundMood: "linear-gradient(135deg, #1b1218 0%, #3d1e2a 100%)",
    prompt: "A person repeatedly circles your area and stares at your phone.",
    saferChoice: "Move near RPF help desk and avoid isolated sections.",
    assertiveChoice: "Join a family group nearby and stay visible.",
    riskyChoice: "Remain seated alone in the same isolated spot.",
    tip: "At transit hubs, prioritize staffed and visible zones.",
    q2SafePrompt: 'You are near the RPF desk. The person has followed you there. The officer asks what happened. What do you say?',
q2SafeChoice1: 'Describe the behaviour clearly and ask the officer to stay visible until your train arrives.',
q2SafeChoice2: 'Request to wait inside the RPF room until boarding time.',
q2SafeChoice3: 'Downplay it and say you just came to ask about the delay.',

q2AssertPrompt: 'You joined a family group. The person is watching from a distance. The train is still 20 minutes away. What next?',
q2AssertChoice1: 'Inform the family group of the situation and stay with them until boarding.',
q2AssertChoice2: 'Text a trusted contact your exact position and the situation.',
q2AssertChoice3: 'Move to another part of the platform alone since the group feels awkward.',

q2RiskyPrompt: 'You stayed put and the person is now sitting directly across from you. What is your immediate action?',
q2RiskyChoice1: 'Stand up, walk briskly to the RPF booth, and report the behaviour.',
q2RiskyChoice2: 'Move to the ladies waiting room or staffed zone immediately.',
q2RiskyChoice3: 'Make loud phone call to a contact describing your exact location.',
  }),
  "internship-mentor-messages": createMiniScenario({
    id: "internship-mentor-messages",
    title: "Internship Mentor Messages",
    category: "Workplace",
    mode: "Role-Play",
    icon: "📚",
    difficulty: 3,
    duration: "8 min",
    color: "#7a2e58",
    triggerWarnings: ["Professional boundary crossing"],
    context: "A mentor starts messaging late night with personal comments.",
    backgroundMood: "linear-gradient(135deg, #211225 0%, #431f44 100%)",
    prompt: "They imply project opportunities depend on being “friendly.”",
    npcInitial:
      "You did really well in today's client meeting. I think you have genuine potential here. Why don't we catch up this weekend over coffee — just the two of us?",
    saferChoice:
      "Document messages and escalate through internship coordinator.",
    assertiveChoice: "Set communication boundary to official channels only.",
    riskyChoice: "Reply casually to keep opportunities open.",
    tip: "Career opportunities should never depend on personal compliance.",
  }),
  "cab-co-passenger-pressure": createMiniScenario({
    id: "cab-co-passenger-pressure",
    title: "Cab Co-Passenger Pressure",
    category: "Travel",
    mode: "Role-Play",
    icon: "🚕",
    difficulty: 2,
    duration: "7 min",
    color: "#8c2f66",
    triggerWarnings: ["Personal boundary pressure"],
    context:
      "A co-passenger in a shared cab keeps asking personal details and drop location.",
    backgroundMood: "linear-gradient(135deg, #1f1224 0%, #3f1f44 100%)",
    prompt:
      "They insist on walking you to your gate and ask you to unlock location sharing.",
    npcInitial:
      "Hey, where are you headed? Koramangala? Me too — maybe we can share the drop? Actually where exactly do you stay? I know that area really well.",
    saferChoice:
      "Decline firmly, alert driver support, and exit near a visible point.",
    assertiveChoice:
      "State clear boundary and message trusted contact with trip details.",
    riskyChoice: "Share details to avoid awkwardness.",
    tip: "You never owe personal details to strangers in transit.",
  }),
  "campus-event-follow-up": createMiniScenario({
    id: "campus-event-follow-up",
    title: "Campus Event Follow-up",
    category: "Campus Safety",
    mode: "Role-Play",
    icon: "🎓",
    difficulty: 2,
    duration: "7 min",
    color: "#9a3d74",
    triggerWarnings: ["Repeated contact"],
    context:
      "After a campus event, someone repeatedly messages and pushes for a private meetup.",
    backgroundMood: "linear-gradient(135deg, #221329 0%, #442647 100%)",
    prompt:
      "They claim they can help with opportunities if you meet alone tonight.",
    npcInitial:
      "You were honestly the best at the panel today — I’ve been looking for someone like you. Can we meet tonight, just for an hour? I have a contact who can seriously accelerate your career.",
    saferChoice:
      "Refuse private meeting and escalate to event coordinator if pressure continues.",
    assertiveChoice:
      "Set boundary: communicate only in official group channels.",
    riskyChoice: "Agree to meet because it may help your profile.",
    tip: "Professional opportunities should stay transparent and verifiable.",
  }),
  "ride-share-otp-trick": createMiniScenario({
    id: "ride-share-otp-trick",
    title: "Ride-Share OTP Trick",
    category: "Travel",
    mode: "Strategy",
    icon: "🚖",
    difficulty: 3,
    duration: "8 min",
    color: "#2f4f7a",
    triggerWarnings: ["Social engineering", "Travel risk"],
    context:
      'A person claims your booked ride is delayed and asks for your trip OTP to "reassign quickly."',
    backgroundMood: "linear-gradient(135deg, #141c2f 0%, #2d4468 100%)",
    prompt:
      "They mention your pickup area correctly, making the request seem legitimate.",
    saferChoice: "Refuse sharing OTP and verify only through the official app.",
    assertiveChoice:
      "Report suspicious contact to platform support immediately.",
    riskyChoice: "Share OTP to avoid waiting longer.",
    tip: "Trip OTP is equivalent to ride control. Never share outside app flow.",
  }),
  "library-study-corner": createMiniScenario({
    id: "library-study-corner",
    title: "Library Study Corner",
    category: "Campus Safety",
    mode: "Simulation",
    icon: "📚",
    difficulty: 2,
    duration: "7 min",
    color: "#6b3c6f",
    triggerWarnings: ["Persistent attention"],
    context:
      "You are studying in a quiet library wing when someone repeatedly tries to sit too close.",
    backgroundMood: "linear-gradient(135deg, #1f1730 0%, #3f2752 100%)",
    prompt:
      "Even after moving once, the person follows and starts personal conversation.",
    saferChoice: "Move to staffed desk area and inform library security.",
    assertiveChoice:
      "State clearly that you want to study alone and need space.",
    riskyChoice: "Continue engaging to avoid appearing impolite.",
    tip: "In quiet spaces, involving staff early is safer than repeated relocation.",
  }),
};

const SCENARIOS: Record<string, Scenario> = {
  "bus-harassment": {
    id: "bus-harassment",
    title: "The Crowded Bus",
    category: "Public Transport",
    mode: "Simulation",
    icon: "🚌",
    difficulty: 2,
    duration: "12 min",
    color: "#7b1d3a",
    triggerWarnings: ["Physical proximity", "Verbal harassment"],
    estimatedMinutes: 12,
    tags: ["public-transport", "bystander-support", "boundary-setting"],
    intensity: "medium",
    backgroundMood: "linear-gradient(135deg, #1a0a0f 0%, #3d1020 100%)",
    context:
      "It's 8:45 AM. The bus is packed — every handle taken, bodies pressed close. You have 20 minutes until your stop. You notice the person behind you is standing uncomfortably close, despite there being slight room to shift.",
    startNodeId: "n1",
    nodes: {
      n1: {
        id: "n1",
        description:
          "The bus lurches. The person behind you uses the movement to press closer. You feel their hand graze your back — it could be accidental. It happens again. Other passengers are absorbed in their phones.",
        mood: "tense",
        interactionType: "whack-a-mole",
        interactionData: {
          text: "Identify the subtle signs of physical harassment in this crowded space.",
          targets: ["physical proximity", "hand graze", "repeated contact"],
        },
        choices: [
          {
            id: "c1a",
            text: "Shift forward and create distance",
            riskImpact: -10,
            eqImpact: 8,
            nextNodeId: "n2a",
            aiCoachNote: "Assertive repositioning without confrontation",
          },
          {
            id: "c1b",
            text: "Turn and make eye contact, then look away firmly",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "n2b",
            aiCoachNote: "Non-verbal boundary signal",
          },
          {
            id: "c1c",
            text: "Stay still — might be accidental",
            riskImpact: 5,
            eqImpact: 2,
            nextNodeId: "n2c",
            aiCoachNote: "Inaction in ambiguous situations",
          },
          {
            id: "c1d",
            text: 'Loudly say "Could you please step back?"',
            riskImpact: -15,
            eqImpact: 12,
            nextNodeId: "n2d",
            aiCoachNote: "Public assertion — effective but requires confidence",
          },
        ],
      },
      n2a: {
        id: "n2a",
        description:
          "You move forward. The person follows within seconds. The behaviour was not accidental. A woman nearby notices and meets your eyes briefly.",
        mood: "tense",
        interactionType: "chat",
        interactionData: {
          npcInitial:
            "I saw that... do you need some help or should I call the conductor?",
          keywords: ["help", "yes", "please", "front", "thank you"],
        },
        choices: [
          {
            id: "c2a1",
            text: "Make eye contact with the woman — signal for help",
            riskImpact: -15,
            eqImpact: 14,
            nextNodeId: "n3_help",
            aiCoachNote: "Bystander activation — highly effective",
          },
          {
            id: "c2a2",
            text: "Move to the front of the bus near the driver",
            riskImpact: -12,
            eqImpact: 8,
            nextNodeId: "n3_front",
            aiCoachNote: "Seeking visible authority presence",
          },
          {
            id: "c2a3",
            text: "Take out your phone and appear to call someone",
            riskImpact: -8,
            eqImpact: 6,
            nextNodeId: "n3_phone",
            aiCoachNote: "De-escalation through perceived social connection",
          },
        ],
      },
      n2b: {
        id: "n2b",
        description:
          "Your eye contact registered. They pause briefly, then the contact resumes. They're testing boundaries. You have information now — this is deliberate.",
        mood: "escalated",
        interactionType: "red-flag",
        interactionData: {
          text: "Testing boundaries. Deliberate contact. Resumes after eye contact. Heart racing.",
          targets: ["testing boundaries", "deliberate contact", "resumes"],
        },
        choices: [
          {
            id: "c2b1",
            text: 'Speak firmly: "I need you to step back. Now."',
            riskImpact: -18,
            eqImpact: 15,
            nextNodeId: "n3_confront",
            aiCoachNote:
              "Direct verbal boundary — you have read the situation correctly",
          },
          {
            id: "c2b2",
            text: "Walk to the door and wait for the next stop",
            riskImpact: -10,
            eqImpact: 7,
            nextNodeId: "n3_exit",
            aiCoachNote: "Choosing safety over convenience",
          },
          {
            id: "c2b3",
            text: "Tell the bus conductor or driver",
            riskImpact: -16,
            eqImpact: 12,
            nextNodeId: "n3_report",
            aiCoachNote: "Involving authority — reduces personal risk",
          },
        ],
      },
      n2c: {
        id: "n2c",
        description:
          "The contact continues — more deliberate now. Your discomfort is real. A voice in your head says 'don't make a scene.' But your body is telling you something important.",
        mood: "escalated",
        interactionType: "match",
        interactionData: {
          text: "Trust your body over social conditioning.",
          pairs: [
            { key: "Discomfort", value: "Boundary Violation" },
            { key: "Instinct", value: "Safety Signal" },
          ],
        },
        choices: [
          {
            id: "c2c1",
            text: "Trust your instincts — speak up now",
            riskImpact: -12,
            eqImpact: 14,
            nextNodeId: "n3_confront",
            aiCoachNote: "Delayed but important: trusting gut feeling",
          },
          {
            id: "c2c2",
            text: "Move away and activate bystander",
            riskImpact: -14,
            eqImpact: 10,
            nextNodeId: "n3_help",
            aiCoachNote: "Recovery from freeze response",
          },
        ],
      },
      n2d: {
        id: "n2d",
        description:
          "The bus goes quieter. Heads turn. The person steps back, face reddening. A few passengers look at you - one gives a small nod. Your heart is racing but the space is clear.",
        mood: "relieved",
        interactionType: "red-flag",
        interactionData: {
          text: "The person steps back. Space is clear. Handled the moment.",
          targets: ["steps back", "space is clear", "handled"],
        },
        choices: [
          {
            id: "c2d1",
            text: "Stay near the front, remain alert",
            riskImpact: -5,
            eqImpact: 10,
            nextNodeId: "n2e",
            aiCoachNote: "Appropriate follow-through after assertion",
          },
          {
            id: "c2d2",
            text: "Continue your journey calmly - you handled it",
            riskImpact: -8,
            eqImpact: 12,
            nextNodeId: "n_end_strong",
            aiCoachNote: "Resolution through confident action",
          },
        ],
      },
      n2e: {
        id: "n2e",
        description:
          "You have regained control, but the bus remains crowded and dynamic. Do you close the loop now or just continue?",
        mood: "neutral",
        interactionType: "match",
        interactionData: {
          text: "Closing the safety loop.",
          pairs: [
            { key: "Formal Record", value: "Accountability" },
            { key: "Vigilance", value: "Preparedness" },
          ],
        },
        choices: [
          {
            id: "c2e1",
            text: "Quietly inform conductor with route/time details",
            riskImpact: -8,
            eqImpact: 11,
            nextNodeId: "n3_report",
            aiCoachNote: "Reporting creates accountability and helps others.",
          },
          {
            id: "c2e2",
            text: "Maintain distance and continue without reporting",
            riskImpact: -4,
            eqImpact: 7,
            nextNodeId: "n3_vigilant",
            aiCoachNote: "Still safe, but less systemic follow-through.",
          },
        ],
      },
      n3_help: {
        id: "n3_help",
        description:
          "The woman understands instantly. She moves next to you and starts chatting naturally — 'Hi! Didn't see you there!' The behaviour stops. You feel a wave of relief. What do you do next to close the loop?",
        mood: "relieved",
        interactionType: "mcq",
        choices: [
          {
            id: "nh_1",
            text: "Thank her, then file a report so the incident is on record.",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Bystander support + reporting is the full protective loop.",
          },
          {
            id: "nh_2",
            text: "Stay near her for the rest of the journey, then continue your day.",
            riskImpact: -5,
            eqImpact: 7,
            nextNodeId: "bus_q4",
            aiCoachNote: "Continued proximity to support is a smart choice.",
          },
          {
            id: "nh_3",
            text: "Get off at the next stop even though it is early.",
            riskImpact: -3,
            eqImpact: 5,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Prioritizing safety over inconvenience is always valid.",
          },
        ],
      },
      n3_front: {
        id: "n3_front",
        description:
          "Near the driver, you have visibility and a witness. The person does not follow. You reach your stop safely. The driver notices your expression and nods. What is your next step?",
        mood: "relieved",
        interactionType: "mcq",
        choices: [
          {
            id: "nf_1",
            text: "Tell the driver what happened before you get off.",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "bus_q4",
            aiCoachNote: "The driver can alert authorities or flag the route.",
          },
          {
            id: "nf_2",
            text: "Exit calmly and message a trusted contact about the incident.",
            riskImpact: -5,
            eqImpact: 7,
            nextNodeId: "bus_q4",
            aiCoachNote: "Keeping someone informed is a key safety habit.",
          },
          {
            id: "nf_3",
            text: "Exit and continue your day — you handled it.",
            riskImpact: -2,
            eqImpact: 5,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "You did well, though a brief report adds systemic protection.",
          },
        ],
      },
      n3_phone: {
        id: "n3_phone",
        description:
          "The perceived social connection shifted the dynamic. The person moves away by the next stop. You arrive safely. Reflecting on it, what do you want to do before the day ends?",
        mood: "relieved",
        interactionType: "mcq",
        choices: [
          {
            id: "np_1",
            text: "Log the incident on the city transport harassment report portal.",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Digital reporting portals exist specifically for this — use them.",
          },
          {
            id: "np_2",
            text: "Brief a trusted friend in detail so someone knows.",
            riskImpact: -5,
            eqImpact: 8,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Verbal debrief aids processing and creates a social record.",
          },
          {
            id: "np_3",
            text: "Move on — you did not directly confront, so it probably was not serious.",
            riskImpact: 3,
            eqImpact: 2,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Dismissing your discomfort can prevent you from taking protective steps next time.",
          },
        ],
      },
      n3_confront: {
        id: "n3_confront",
        description:
          "Your firm words land. The person steps back. Other passengers are aware. You ride with your head high and space intact. Now that you have asserted yourself, what is your follow-through?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "nc_1",
            text: "Quietly report to the conductor with route and time details.",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Reporting after confrontation creates accountability.",
          },
          {
            id: "nc_2",
            text: "Stay alert and near other passengers until your stop.",
            riskImpact: -5,
            eqImpact: 7,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Sustained vigilance after assertion is smart, not paranoid.",
          },
          {
            id: "nc_3",
            text: "Relax completely — it is over.",
            riskImpact: 1,
            eqImpact: 5,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "It may be over, but staying mildly alert is still wise.",
          },
        ],
      },
      n3_exit: {
        id: "n3_exit",
        description:
          "You exit one stop early. In the fresh air, you feel safe. You pull out your phone. What do you do in the next five minutes?",
        mood: "relieved",
        interactionType: "mcq",
        choices: [
          {
            id: "ne_1",
            text: "Document the incident on the city transport app with time and route.",
            riskImpact: -9,
            eqImpact: 10,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Documentation immediately after is most accurate and impactful.",
          },
          {
            id: "ne_2",
            text: "Call a friend to process what happened.",
            riskImpact: -5,
            eqImpact: 8,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Social processing reduces stress and reinforces your instincts.",
          },
          {
            id: "ne_3",
            text: "Walk quickly to your destination and forget it.",
            riskImpact: 2,
            eqImpact: 3,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Not reporting means the pattern continues for the next person.",
          },
        ],
      },
      n3_report: {
        id: "n3_report",
        description:
          "The conductor speaks to the person, who exits at the next stop. A formal complaint is logged. You continue in a cleared space. As you near your stop, what do you do?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "nr_1",
            text: "Request a copy of the complaint reference for your records.",
            riskImpact: -8,
            eqImpact: 11,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Having a complaint reference number protects you for any follow-up.",
          },
          {
            id: "nr_2",
            text: "Thank the conductor and continue your journey mindfully.",
            riskImpact: -4,
            eqImpact: 7,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "You acted well — staying grounded is the right follow-through.",
          },
          {
            id: "nr_3",
            text: "Exit quickly and hope the process takes care of itself.",
            riskImpact: 0,
            eqImpact: 4,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Formal processes work better when you follow through.",
          },
        ],
      },
      n3_vigilant: {
        id: "n3_vigilant",
        description:
          "You stay alert near the driver. The person keeps distance. You arrive safely. Vigilance after assertion is smart. At your stop, how do you close this out?",
        mood: "relieved",
        interactionType: "mcq",
        choices: [
          {
            id: "nv_1",
            text: "File a brief incident note via the transport helpline.",
            riskImpact: -7,
            eqImpact: 9,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "A helpline report adds an official record with minimal effort.",
          },
          {
            id: "nv_2",
            text: "Tell a friend in detail — social records matter too.",
            riskImpact: -5,
            eqImpact: 7,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Your story told to trusted people becomes a form of safety record.",
          },
          {
            id: "nv_3",
            text: "Put it behind you — you stayed safe, that is enough.",
            riskImpact: 1,
            eqImpact: 4,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Understandable, but reporting helps protect others on the same route.",
          },
        ],
      },
      n_end_strong: {
        id: "n_end_strong",
        description:
          "You acted quickly, spoke clearly, and protected your space. The journey continues without incident. Now: what do you do to reinforce this win?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "nes_1",
            text: "Write down what worked so you can remember it for next time.",
            riskImpact: -6,
            eqImpact: 12,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Capturing what worked turns a one-off win into a repeatable skill.",
          },
          {
            id: "nes_2",
            text: "Share the experience with a friend to normalise speaking up.",
            riskImpact: -4,
            eqImpact: 9,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Sharing builds collective awareness and encourages others.",
          },
          {
            id: "nes_3",
            text: "Nothing — it worked out, that is enough.",
            riskImpact: 0,
            eqImpact: 4,
            nextNodeId: "bus_q4",
            aiCoachNote:
              "Reflection turns experience into lasting preparedness.",
          },
        ],
      },

      // ── Q4 + Q5 shared nodes for bus-harassment ────────────────────
      bus_q4: {
        id: "bus_q4",
        description:
          "Reflecting on the full journey: you faced a real threat and responded. Which element of your response do you think was most effective?",
        mood: "neutral",
        interactionType: "match",
        interactionData: {
          text: "Match each action to its safety impact.",
          pairs: [
            { key: "Creating Distance", value: "Reduces Immediate Risk" },
            { key: "Involving Others", value: "Builds a Safety Net" },
          ],
        },
        choices: [
          {
            id: "bq4_1",
            text: "Creating distance and seeking visible authority.",
            riskImpact: -6,
            eqImpact: 9,
            nextNodeId: "bus_q5",
            aiCoachNote:
              "Physical repositioning is the fastest risk reducer in transit.",
          },
          {
            id: "bq4_2",
            text: "Involving a bystander or staff member.",
            riskImpact: -7,
            eqImpact: 11,
            nextNodeId: "bus_q5",
            aiCoachNote:
              "Social support turns individual risk into shared accountability.",
          },
          {
            id: "bq4_3",
            text: "Speaking up firmly and clearly.",
            riskImpact: -8,
            eqImpact: 12,
            nextNodeId: "bus_q5",
            aiCoachNote:
              "Verbal assertion signals confidence and often stops behaviour immediately.",
          },
        ],
      },
      bus_q5: {
        id: "bus_q5",
        description:
          "Final debrief. What single habit will you build from this experience to make future journeys safer?",
        mood: "neutral",
        interactionType: "mcq",
        choices: [
          {
            id: "bq5_1",
            text: "Always identify two exit points when boarding public transport.",
            riskImpact: -8,
            eqImpact: 12,
            nextNodeId: "bus_end_safe",
            aiCoachNote:
              "Pre-scanning exits is a core situational awareness habit.",
          },
          {
            id: "bq5_2",
            text: "Keep a trusted contact informed of my route in real time.",
            riskImpact: -6,
            eqImpact: 10,
            nextNodeId: "bus_end_partial",
            aiCoachNote:
              "Live location sharing adds a passive safety layer at zero cost.",
          },
          {
            id: "bq5_3",
            text: "Try to stay calm and hope situations resolve themselves.",
            riskImpact: 3,
            eqImpact: 3,
            nextNodeId: "bus_end_learning",
            aiCoachNote:
              "Passive hope is not a safety plan. Active habits make the difference.",
          },
        ],
      },
      bus_end_safe: {
        id: "bus_end_safe",
        description:
          "Outstanding. You navigated five decision points with strong situational awareness, support-seeking, and follow-through. You are building real safety skills.",
        mood: "resolved",
        isEnd: true,
        endType: "safe",
        choices: [],
      },
      bus_end_partial: {
        id: "bus_end_partial",
        description:
          "Well done. You made solid decisions and finished with a useful habit. A few steps could be sharper, but your confidence and instincts are growing.",
        mood: "relieved",
        isEnd: true,
        endType: "partial",
        choices: [],
      },
      bus_end_learning: {
        id: "bus_end_learning",
        description:
          "You completed the full scenario. Some choices left risk higher than needed, but every run builds awareness. Replay to sharpen the decisions that felt uncertain.",
        mood: "escalated",
        isEnd: true,
        endType: "learning",
        choices: [],
      },
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // Workplace Boundary scenario (unchanged)
  // ──────────────────────────────────────────────────────────────────────
  "workplace-boundary": {
    id: "workplace-boundary",
    title: "The Senior Colleague",
    category: "Workplace",
    mode: "Simulation",
    icon: "💼",
    difficulty: 3,
    duration: "15 min",
    color: "#9b3060",
    triggerWarnings: ["Workplace harassment", "Power imbalance"],
    estimatedMinutes: 15,
    tags: ["workplace", "posh", "documentation"],
    intensity: "high",
    backgroundMood: "linear-gradient(135deg, #0f1729 0%, #1e2d4a 100%)",
    context:
      "You've been at this company for 3 months. Rohan, your team lead — 10 years your senior — has been gradually making comments that feel off. Today in the post-meeting coffee area, with only one other person present, he says: 'You always dress so professionally. Better than the other girls on the team.'",
    startNodeId: "n1",
    nodes: {
      n1: {
        id: "n1",
        description:
          "Rohan smiles after saying it. The other person nearby looks at their phone. The comment sits in your chest — you know it was inappropriate, but you're new, and he controls your project allocation. What do you do?",
        mood: "tense",
        interactionType: "chat",
        interactionData: {
          npcInitial:
            "You always dress so professionally Rohan says, leaning in slightly. Better than the other girls on the team, don't you think?",
          keywords: [
            "boundary",
            "work",
            "professional",
            "uncomfortable",
            "stop",
          ],
        },
        choices: [
          {
            id: "c1a",
            text: "Smile politely and change the subject",
            riskImpact: 8,
            eqImpact: 3,
            nextNodeId: "n2a",
            aiCoachNote:
              "Common response — but signals the behaviour is acceptable",
          },
          {
            id: "c1b",
            text: 'Say calmly: "I\'d prefer you focus on my work, not my appearance"',
            riskImpact: -12,
            eqImpact: 15,
            nextNodeId: "n2b",
            aiCoachNote: "Assertive, professional boundary-setting",
          },
          {
            id: "c1c",
            text: "Document it mentally — note date, time, witness",
            riskImpact: -5,
            eqImpact: 12,
            nextNodeId: "n2c",
            aiCoachNote: "Evidence gathering without confrontation",
          },
          {
            id: "c1d",
            text: 'Ask: "What do you mean by that exactly?"',
            riskImpact: -8,
            eqImpact: 13,
            nextNodeId: "n2d",
            aiCoachNote:
              "Socratic deflection — makes them articulate the comment",
          },
        ],
      },
      n2a: {
        id: "n2a",
        description:
          "Rohan takes your politeness as acceptance. A week later, the comments continue — now about your 'smile' and 'energy'. He messages you outside work hours about non-urgent tasks.",
        mood: "escalated",
        interactionType: "red-flag",
        interactionData: {
          text: "Pattern of energy comments. Messages outside work hours. Persistent boundary testing.",
          targets: ["pattern", "outside work hours", "boundary testing"],
        },
        choices: [
          {
            id: "c2a1",
            text: "Speak to HR confidentially about the pattern",
            riskImpact: -15,
            eqImpact: 14,
            nextNodeId: "n3_hr",
            aiCoachNote: "Formal channel — protected under POSH Act",
          },
          {
            id: "c2a2",
            text: "Talk to a trusted colleague to reality-check",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "n3_peer",
            aiCoachNote: "Peer support and witness building",
          },
          {
            id: "c2a3",
            text: "Set a clear boundary now — one direct conversation",
            riskImpact: -12,
            eqImpact: 13,
            nextNodeId: "n3_direct",
            aiCoachNote: "Delayed but still valid — better late than never",
          },
        ],
      },
      n2b: {
        id: "n2b",
        description:
          "Rohan looks surprised, then slightly flustered. 'Of course, of course,' he says, moving away. The other person heard you. You feel the adrenaline — but also a clarity.",
        mood: "relieved",
        interactionType: "match",
        interactionData: {
          text: "Documentation is your legal shield.",
          pairs: [
            { key: "Formal Record", value: "Evidence" },
            { key: "HR Record", value: "Protection" },
          ],
        },
        choices: [
          {
            id: "c2b1",
            text: "Document what happened — date, witnesses, exact words",
            riskImpact: -10,
            eqImpact: 12,
            nextNodeId: "n3_document",
            aiCoachNote: "Evidence preservation after a boundary event",
          },
          {
            id: "c2b2",
            text: "Speak to HR as a precaution — create a record",
            riskImpact: -14,
            eqImpact: 13,
            nextNodeId: "n3_hr",
            aiCoachNote: "Proactive documentation",
          },
        ],
      },
      n2c: {
        id: "n2c",
        description:
          "Smart. You have a record. It happens twice more over two weeks. You have dates, times, the witness present. This pattern is now documented. What next?",
        mood: "neutral",
        choices: [
          {
            id: "c2c1",
            text: "File a formal complaint with HR — you have evidence",
            riskImpact: -18,
            eqImpact: 15,
            nextNodeId: "n3_hr",
            aiCoachNote: "Evidence-backed formal action — protected by law",
          },
          {
            id: "c2c2",
            text: "Confront Rohan directly with your documented record",
            riskImpact: -10,
            eqImpact: 13,
            nextNodeId: "n3_direct",
            aiCoachNote: "Direct confrontation backed by evidence",
          },
        ],
      },
      n2d: {
        id: "n2d",
        description:
          "'I just meant it as a compliment,' Rohan says, defensive now. 'You're too sensitive.' This is a classic DARVO response — Deny, Attack, Reverse Victim and Offender.",
        mood: "escalated",
        choices: [
          {
            id: "c2d1",
            text: '"I understand you meant well. The impact was uncomfortable for me."',
            riskImpact: -10,
            eqImpact: 15,
            nextNodeId: "n2e",
            aiCoachNote: "Intent vs impact framing — powerful and professional",
          },
          {
            id: "c2d2",
            text: "Walk away calmly — this conversation is not productive",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "n3_document",
            aiCoachNote: "Disengaging from DARVO without escalating",
          },
        ],
      },
      n2e: {
        id: "n2e",
        description:
          "Rohan goes quiet and says, 'Fine, understood.' The immediate moment de-escalates, but this is a critical point for follow-through so the boundary holds over time.",
        mood: "neutral",
        choices: [
          {
            id: "c2e1",
            text: "Send a brief follow-up email summarizing the boundary",
            riskImpact: -12,
            eqImpact: 13,
            nextNodeId: "n3_document",
            aiCoachNote: "Creates a contemporaneous record in your own words",
          },
          {
            id: "c2e2",
            text: "Request a confidential HR check-in to log the incident",
            riskImpact: -16,
            eqImpact: 15,
            nextNodeId: "n3_hr",
            aiCoachNote: "Converts one incident into institutional awareness",
          },
        ],
      },
      n3_hr: {
        id: "n3_hr",
        description:
          "HR acknowledges your concern and opens a POSH inquiry. Rohan is spoken to. You have institutional protection. Now, how do you want to protect yourself going forward?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "whr_1",
            text: "Request regular check-ins with HR until the inquiry is resolved.",
            riskImpact: -8,
            eqImpact: 11,
            nextNodeId: "work_q4",
            aiCoachNote: "Active follow-up ensures the process does not stall.",
          },
          {
            id: "whr_2",
            text: "Continue documenting any new incidents as additional evidence.",
            riskImpact: -7,
            eqImpact: 10,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Ongoing documentation protects you if behaviour resurfaces.",
          },
          {
            id: "whr_3",
            text: "Step back and let HR handle it without further involvement.",
            riskImpact: 2,
            eqImpact: 5,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Disengaging from the process can slow resolution and leave gaps.",
          },
        ],
      },
      n3_peer: {
        id: "n3_peer",
        description:
          "Your colleague says 'He did the same with Priya last year.' You consider a joint complaint. Collective action is more powerful. What is your next move?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "wpe_1",
            text: "Meet with Priya together and file a joint HR complaint.",
            riskImpact: -10,
            eqImpact: 13,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Joint complaints carry significantly more weight under POSH.",
          },
          {
            id: "wpe_2",
            text: "File separately but cite the pattern of repeated behaviour.",
            riskImpact: -8,
            eqImpact: 11,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Separate complaints that reference a pattern are still very effective.",
          },
          {
            id: "wpe_3",
            text: "Wait to see if Priya files first before doing anything.",
            riskImpact: 3,
            eqImpact: 3,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Delay reduces the window for timely action and may signal inaction.",
          },
        ],
      },
      n3_direct: {
        id: "n3_direct",
        description:
          "Your direct conversation was clear. Rohan backs off. You continue documenting. A week later, a colleague asks how you handled it so well. What do you say?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "wdi_1",
            text: "Explain the boundary-setting process and share your documentation approach.",
            riskImpact: -6,
            eqImpact: 12,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Sharing strategies builds collective workplace safety culture.",
          },
          {
            id: "wdi_2",
            text: "Mention that you have spoken to HR as a precaution — normalise it.",
            riskImpact: -5,
            eqImpact: 10,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Destigmatising HR reports encourages others to use formal channels.",
          },
          {
            id: "wdi_3",
            text: "Keep it private — you do not want to create drama.",
            riskImpact: 1,
            eqImpact: 4,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Silence can protect short-term comfort but slow cultural change.",
          },
        ],
      },
      n3_document: {
        id: "n3_document",
        description:
          "Your documentation is a powerful tool. You have dates, words, and witnesses. Now you need to decide: act on this record now or hold it?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "wdo_1",
            text: "Share the documented record with HR now as a precautionary log.",
            riskImpact: -9,
            eqImpact: 12,
            nextNodeId: "work_q4",
            aiCoachNote:
              "A logged record at HR is protected even if no immediate action is taken.",
          },
          {
            id: "wdo_2",
            text: "Hold the record and set a personal trigger: if it happens once more, escalate.",
            riskImpact: -5,
            eqImpact: 8,
            nextNodeId: "work_q4",
            aiCoachNote:
              "A clear trigger plan turns passive documentation into an action framework.",
          },
          {
            id: "wdo_3",
            text: "Keep the record private for now and continue as normal.",
            riskImpact: 2,
            eqImpact: 5,
            nextNodeId: "work_q4",
            aiCoachNote:
              "Holding without a plan can leave you vulnerable if escalation is needed quickly.",
          },
        ],
      },

      // ── Q4 + Q5 shared nodes for workplace-boundary ─────────────────
      work_q4: {
        id: "work_q4",
        description:
          "Stepping back: workplace boundary violations are a pattern, not a one-off. Which structural protection do you want to put in place going forward?",
        mood: "neutral",
        interactionType: "match",
        interactionData: {
          text: "Match each protection type to what it safeguards.",
          pairs: [
            { key: "Written Communication Trail", value: "Legal Evidence" },
            { key: "Trusted Ally at Work", value: "Witness Network" },
          ],
        },
        choices: [
          {
            id: "wq4_1",
            text: "Move key work conversations to email so everything is documented by default.",
            riskImpact: -8,
            eqImpact: 11,
            nextNodeId: "work_q5",
            aiCoachNote:
              "Written trails are your strongest passive protection in professional settings.",
          },
          {
            id: "wq4_2",
            text: "Build a small trusted network of colleagues who know your situation.",
            riskImpact: -7,
            eqImpact: 10,
            nextNodeId: "work_q5",
            aiCoachNote:
              "Allies who are aware can act as informal witnesses if needed.",
          },
          {
            id: "wq4_3",
            text: "Focus on the work — let HR handle the structural side.",
            riskImpact: 2,
            eqImpact: 4,
            nextNodeId: "work_q5",
            aiCoachNote:
              "HR is important, but personal protective habits add another layer.",
          },
        ],
      },
      work_q5: {
        id: "work_q5",
        description:
          "Final debrief. The POSH Act gives you the right to a safe workplace free from harassment. Which statement best reflects how you will carry this forward?",
        mood: "neutral",
        interactionType: "mcq",
        choices: [
          {
            id: "wq5_1",
            text: "I know my rights, I document consistently, and I will use formal channels without hesitation.",
            riskImpact: -8,
            eqImpact: 14,
            nextNodeId: "work_end_safe",
            aiCoachNote:
              "That is the complete toolkit. Rights, records, and willingness to act.",
          },
          {
            id: "wq5_2",
            text: "I need to practise setting boundaries earlier, before patterns develop.",
            riskImpact: -5,
            eqImpact: 10,
            nextNodeId: "work_end_partial",
            aiCoachNote:
              "Early boundary-setting is a skill — replay earlier nodes to practise.",
          },
          {
            id: "wq5_3",
            text: "I am not sure I would handle the power imbalance confidently in real life.",
            riskImpact: 2,
            eqImpact: 5,
            nextNodeId: "work_end_learning",
            aiCoachNote:
              "That is honest. Power dynamics are hard. More practice and support will build your confidence.",
          },
        ],
      },
      work_end_safe: {
        id: "work_end_safe",
        description:
          "Exceptional. Across five steps you demonstrated boundary-setting, evidence gathering, formal escalation, and long-term protection planning. You are ready for this in real life.",
        mood: "resolved",
        isEnd: true,
        endType: "safe",
        choices: [],
      },
      work_end_partial: {
        id: "work_end_partial",
        description:
          "Strong run. You handled the core moments well and finished with useful habits. Replay the early nodes to practise setting boundaries faster next time.",
        mood: "relieved",
        isEnd: true,
        endType: "partial",
        choices: [],
      },
      work_end_learning: {
        id: "work_end_learning",
        description:
          "You completed the scenario. Power dynamics are genuinely difficult to navigate. Each replay builds more confidence — do not stop practising.",
        mood: "escalated",
        isEnd: true,
        endType: "learning",
        choices: [],
      },
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // Online Manipulation scenario (unchanged)
  // ──────────────────────────────────────────────────────────────────────
  "online-manipulation": {
    id: "online-manipulation",
    title: "The DM Campaign",
    category: "Online Safety",
    mode: "Puzzle",
    icon: "📱",
    difficulty: 2,
    duration: "10 min",
    color: "#c4537a",
    triggerWarnings: ["Online manipulation", "Social engineering"],
    estimatedMinutes: 10,
    tags: ["online-safety", "scam-detection", "verification"],
    intensity: "medium",
    backgroundMood: "linear-gradient(135deg, #0a0f1a 0%, #1a1040 100%)",
    context:
      "You received a DM from someone who says they're a talent scout for a fashion brand. They found your profile through a friend. The messages are friendly, complimentary, and the account looks professional. Something feels slightly off.",
    startNodeId: "n1",
    nodes: {
      n1: {
        id: "n1",
        description:
          "Their first message: 'Hi! I came across your profile through [mutual friend]. We're looking for brand ambassadors in your city — your aesthetic is exactly what we need. Interested in learning more? 🙂' The account has 847 followers, a professional bio, and 3 posts.",
        mood: "neutral",
        interactionType: "red-flag",
        interactionData: {
          text: "Talent scout for fashion brand. Looking for brand ambassadors. Aesthetically pleasing. Interested in learning more?",
          targets: ["brand ambassadors", "Aesthetically", "scout", "fashion"],
        },
        choices: [
          {
            id: "c1a",
            text: "Check if the mutual friend actually knows them first",
            riskImpact: -15,
            eqImpact: 14,
            nextNodeId: "n2a",
            aiCoachNote: "Verification before engagement — excellent instinct",
          },
          {
            id: "c1b",
            text: "Ask for their official website or company registration",
            riskImpact: -12,
            eqImpact: 12,
            nextNodeId: "n2b",
            aiCoachNote: "Requesting verifiable credentials",
          },
          {
            id: "c1c",
            text: "Reply positively — this sounds exciting",
            riskImpact: 10,
            eqImpact: 4,
            nextNodeId: "n2c",
            aiCoachNote: "Unverified engagement with stranger",
          },
          {
            id: "c1d",
            text: "Reverse image search their profile photo",
            riskImpact: -14,
            eqImpact: 13,
            nextNodeId: "n2d",
            aiCoachNote: "Technical verification method",
          },
        ],
      },
      n2a: {
        id: "n2a",
        description:
          "Your mutual friend replies: 'Who? I don't know anyone by that name. I never referred anyone.' Red flag confirmed. The account used your public follower list to fabricate a connection.",
        mood: "tense",
        choices: [
          {
            id: "c2a1",
            text: "Block and report the account immediately",
            riskImpact: -18,
            eqImpact: 14,
            nextNodeId: "n3_block",
            aiCoachNote: "Correct response after confirming manipulation",
          },
          {
            id: "c2a2",
            text: 'Confront them — "My friend doesn\'t know you"',
            riskImpact: -5,
            eqImpact: 10,
            nextNodeId: "n2e",
            aiCoachNote: "Engagement risk — manipulators may escalate",
          },
        ],
      },
      n2e: {
        id: "n2e",
        description:
          "They reply instantly: 'Your friend is lying. Send your number now and I'll prove it.' The pressure escalates with guilt and urgency, which is a classic manipulation pattern.",
        mood: "escalated",
        choices: [
          {
            id: "c2e1",
            text: "Do not engage further — block and report immediately",
            riskImpact: -16,
            eqImpact: 14,
            nextNodeId: "n3_block",
            aiCoachNote: "Fast disengagement cuts attacker leverage",
          },
          {
            id: "c2e2",
            text: "Argue and demand proof in chat",
            riskImpact: 4,
            eqImpact: 6,
            nextNodeId: "n3_confront",
            aiCoachNote: "Continued engagement usually increases exposure",
          },
        ],
      },
      n2b: {
        id: "n2b",
        description:
          "They send a PDF 'portfolio' and a website link. The site looks professional but the domain was registered 6 days ago. The PDF asks for your phone number, home city, and availability.",
        mood: "tense",
        choices: [
          {
            id: "c2b1",
            text: "Check domain registration date — 6 days is suspicious",
            riskImpact: -14,
            eqImpact: 15,
            nextNodeId: "n3_smart",
            aiCoachNote: "Critical thinking applied to digital verification",
          },
          {
            id: "c2b2",
            text: "Don't share personal details — disengage politely",
            riskImpact: -12,
            eqImpact: 10,
            nextNodeId: "n3_disengage",
            aiCoachNote: "Smart disengagement without confrontation",
          },
          {
            id: "c2b3",
            text: "Fill in the PDF — they provided documentation",
            riskImpact: 15,
            eqImpact: 3,
            nextNodeId: "n3_risk",
            aiCoachNote: "Trusting appearance over verification — dangerous",
          },
        ],
      },
      n2c: {
        id: "n2c",
        description:
          "They escalate quickly — asking for photos 'for the portfolio', then your phone number 'to connect with the team'. The urgency is manufactured: 'We need to confirm by tonight!'",
        mood: "escalated",
        choices: [
          {
            id: "c2c1",
            text: "Recognise the urgency tactic — pause and verify",
            riskImpact: -10,
            eqImpact: 13,
            nextNodeId: "n3_smart",
            aiCoachNote: "Identifying manufactured urgency as a red flag",
          },
          {
            id: "c2c2",
            text: "Stop responding — trust your discomfort",
            riskImpact: -14,
            eqImpact: 12,
            nextNodeId: "n3_disengage",
            aiCoachNote: "Gut feeling as valid data",
          },
        ],
      },
      n2d: {
        id: "n2d",
        description:
          "The reverse image search returns results: the profile photo belongs to a real European model with no connection to India. The account is using a stolen identity.",
        mood: "tense",
        choices: [
          {
            id: "c2d1",
            text: "Block, report, and warn the model whose photo was stolen",
            riskImpact: -18,
            eqImpact: 15,
            nextNodeId: "n3_block",
            aiCoachNote:
              "Full protective response — protecting yourself and others",
          },
          {
            id: "c2d2",
            text: "Screenshot and report to platform with evidence",
            riskImpact: -16,
            eqImpact: 14,
            nextNodeId: "n3_block",
            aiCoachNote: "Evidence-based reporting",
          },
        ],
      },
      n3_block: {
        id: "n3_block",
        description:
          "You blocked and reported the account. Your verification skills prevented a phishing attempt. What do you do next to strengthen your digital safety?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "ob1_1",
            text: "Review privacy settings on all your social accounts right now.",
            riskImpact: -8,
            eqImpact: 11,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Proactive privacy audits prevent future targeted attacks.",
          },
          {
            id: "ob1_2",
            text: "Warn mutual connections that a scam account used their name.",
            riskImpact: -7,
            eqImpact: 10,
            nextNodeId: "online_q4",
            aiCoachNote: "Warning others stops the same scam from spreading.",
          },
          {
            id: "ob1_3",
            text: "Move on — the report has been filed, that is enough.",
            riskImpact: 1,
            eqImpact: 5,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Filing is good, but hardening your settings adds lasting protection.",
          },
        ],
      },
      n3_smart: {
        id: "n3_smart",
        description:
          "Your digital literacy identified the manipulation before any data was shared. You report the account. Now: how do you turn this near-miss into a lasting habit?",
        mood: "resolved",
        interactionType: "mcq",
        choices: [
          {
            id: "osm_1",
            text: "Add domain registration age to your personal verification checklist.",
            riskImpact: -8,
            eqImpact: 12,
            nextNodeId: "online_q4",
            aiCoachNote:
              "A personal checklist codifies learned skills into repeatable process.",
          },
          {
            id: "osm_2",
            text: "Share the scam pattern with your network so others can spot it.",
            riskImpact: -6,
            eqImpact: 10,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Community education is one of the most effective anti-scam tools.",
          },
          {
            id: "osm_3",
            text: "Feel good about this win — you handled it on instinct.",
            riskImpact: 1,
            eqImpact: 6,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Good instincts are valuable, but codifying them makes them reliable.",
          },
        ],
      },
      n3_disengage: {
        id: "n3_disengage",
        description:
          "You stopped engaging and trusted your instincts. No data was shared. Now: what makes you confident you will spot a similar attempt next time?",
        mood: "relieved",
        interactionType: "mcq",
        choices: [
          {
            id: "odi_1",
            text: "Memorise the red flags: urgency, unverifiable identity, unusual requests.",
            riskImpact: -7,
            eqImpact: 11,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Knowing the pattern is the first line of digital defence.",
          },
          {
            id: "odi_2",
            text: "Make a habit of always verifying before engaging with new DMs.",
            riskImpact: -6,
            eqImpact: 9,
            nextNodeId: "online_q4",
            aiCoachNote: "A consistent verification habit removes guesswork.",
          },
          {
            id: "odi_3",
            text: "Trust that you will know it when you see it again.",
            riskImpact: 3,
            eqImpact: 4,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Vague confidence is less reliable than a specific checklist.",
          },
        ],
      },
      n3_confront: {
        id: "n3_confront",
        description:
          "They deny everything, then turn hostile. Block them immediately. This is a learning moment — what will you do differently when this happens again?",
        mood: "tense",
        interactionType: "mcq",
        choices: [
          {
            id: "ocf_1",
            text: "Block and report without responding, no matter how convincing their story sounds.",
            riskImpact: -10,
            eqImpact: 11,
            nextNodeId: "online_q4",
            aiCoachNote:
              "The fastest exit is always the safest one with online manipulators.",
          },
          {
            id: "ocf_2",
            text: "Run a verification step (reverse image search, domain check) before any reply.",
            riskImpact: -8,
            eqImpact: 10,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Verify first, engage never — that is the online safety order of operations.",
          },
          {
            id: "ocf_3",
            text: "Be more careful next time but continue to engage to gather evidence.",
            riskImpact: 4,
            eqImpact: 3,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Continued engagement with manipulators increases your exposure, not your evidence.",
          },
        ],
      },
      n3_risk: {
        id: "n3_risk",
        description:
          "You shared details and now receive suspicious calls. Your number may have been sold. You take immediate action. What is your most important protective step right now?",
        mood: "escalated",
        interactionType: "mcq",
        choices: [
          {
            id: "ori_1",
            text: "Contact your carrier to filter spam calls and register on DND.",
            riskImpact: -10,
            eqImpact: 10,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Carrier-level filtering is the fastest way to stop spam calls from a leaked number.",
          },
          {
            id: "ori_2",
            text: "Change all passwords and review active sessions on key accounts.",
            riskImpact: -9,
            eqImpact: 11,
            nextNodeId: "online_q4",
            aiCoachNote:
              "If your number was leaked, associated accounts may be at risk too.",
          },
          {
            id: "ori_3",
            text: "Block the numbers as they come in and hope it stops.",
            riskImpact: 4,
            eqImpact: 3,
            nextNodeId: "online_q4",
            aiCoachNote:
              "Reactive blocking does not stop new numbers. Proactive steps are needed.",
          },
        ],
      },

      // ── Q4 + Q5 shared nodes for online-manipulation ──────────────
      online_q4: {
        id: "online_q4",
        description:
          "Digital safety check. Which of these three verification steps would you use first when you receive an unsolicited DM from someone claiming to offer an opportunity?",
        mood: "neutral",
        interactionType: "match",
        interactionData: {
          text: "Match each verification action to what it confirms.",
          pairs: [
            { key: "Reverse Image Search", value: "Real Identity" },
            {
              key: "Domain Registration Age",
              value: "Legitimate Organisation",
            },
          ],
        },
        choices: [
          {
            id: "oq4_1",
            text: "Verify through the mutual contact before any reply.",
            riskImpact: -8,
            eqImpact: 12,
            nextNodeId: "online_q5",
            aiCoachNote:
              "Source verification is the fastest way to confirm or deny legitimacy.",
          },
          {
            id: "oq4_2",
            text: "Reverse image search the profile photo.",
            riskImpact: -7,
            eqImpact: 11,
            nextNodeId: "online_q5",
            aiCoachNote:
              "Stolen photos are the most common identity fraud technique online.",
          },
          {
            id: "oq4_3",
            text: "Check how many posts and followers the account has.",
            riskImpact: -3,
            eqImpact: 6,
            nextNodeId: "online_q5",
            aiCoachNote:
              "Surface metrics can be easily faked — go deeper with technical checks.",
          },
        ],
      },
      online_q5: {
        id: "online_q5",
        description:
          "Final debrief. Online manipulation attempts use three core tactics: urgency, fabricated trust, and information pressure. Which habit will you build from this session?",
        mood: "neutral",
        interactionType: "mcq",
        choices: [
          {
            id: "oq5_1",
            text: "Pause for 60 seconds before responding to any unsolicited DM with an offer.",
            riskImpact: -8,
            eqImpact: 13,
            nextNodeId: "online_end_safe",
            aiCoachNote:
              "A deliberate pause breaks the urgency trap that drives most scam compliance.",
          },
          {
            id: "oq5_2",
            text: "Always verify at least two independent data points before engaging.",
            riskImpact: -6,
            eqImpact: 11,
            nextNodeId: "online_end_partial",
            aiCoachNote:
              "Two-point verification is a simple habit that catches most impersonation attempts.",
          },
          {
            id: "oq5_3",
            text: "Trust your gut — if something feels off, you will know.",
            riskImpact: 2,
            eqImpact: 5,
            nextNodeId: "online_end_learning",
            aiCoachNote:
              "Gut feelings are useful signals but are not a reliable substitute for verification habits.",
          },
        ],
      },
      online_end_safe: {
        id: "online_end_safe",
        description:
          "Outstanding digital safety performance. You verified, disengaged, reported, and built a lasting habit across five decision points. Your online instincts are sharp.",
        mood: "resolved",
        isEnd: true,
        endType: "safe",
        choices: [],
      },
      online_end_partial: {
        id: "online_end_partial",
        description:
          "Good run. You demonstrated solid verification skills and finished with a useful habit. Practice the early identification nodes to catch red flags even faster.",
        mood: "relieved",
        isEnd: true,
        endType: "partial",
        choices: [],
      },
      online_end_learning: {
        id: "online_end_learning",
        description:
          "You completed all five steps. Some choices increased exposure, but you now understand the pattern. Replay to build faster, more automatic verification habits.",
        mood: "escalated",
        isEnd: true,
        endType: "learning",
        choices: [],
      },
    },
  },
  ...EXPANSION_SCENARIOS,
};

type ScenarioValidationIssue = {
  scenarioId: string;
  message: string;
};

function validateScenario(scenario: Scenario): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = [];
  const nodeIds = new Set(Object.keys(scenario.nodes));

  if (!nodeIds.has(scenario.startNodeId)) {
    issues.push({
      scenarioId: scenario.id,
      message: `startNodeId "${scenario.startNodeId}" does not exist in nodes.`,
    });
    return issues;
  }

  const inboundCount = new Map<string, number>();
  for (const nodeId of nodeIds) inboundCount.set(nodeId, 0);

  for (const [nodeId, node] of Object.entries(scenario.nodes)) {
    if (!node.isEnd && node.choices.length === 0) {
      issues.push({
        scenarioId: scenario.id,
        message: `Node "${nodeId}" is non-terminal but has no choices.`,
      });
    }

    for (const choice of node.choices) {
      if (choice.nextNodeId === null) continue;
      if (!nodeIds.has(choice.nextNodeId)) {
        issues.push({
          scenarioId: scenario.id,
          message: `Node "${nodeId}" choice "${choice.id}" points to missing node "${choice.nextNodeId}".`,
        });
        continue;
      }
      inboundCount.set(
        choice.nextNodeId,
        (inboundCount.get(choice.nextNodeId) ?? 0) + 1,
      );
    }
  }

  for (const [nodeId, count] of inboundCount.entries()) {
    if (nodeId !== scenario.startNodeId && count === 0) {
      issues.push({
        scenarioId: scenario.id,
        message: `Node "${nodeId}" is orphaned (no incoming edges).`,
      });
    }
  }

  const reachable = new Set<string>();
  const stack = [scenario.startNodeId];
  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    const node = scenario.nodes[nodeId];
    for (const choice of node.choices) {
      if (choice.nextNodeId && !reachable.has(choice.nextNodeId)) {
        stack.push(choice.nextNodeId);
      }
    }
  }

  for (const nodeId of nodeIds) {
    if (!reachable.has(nodeId)) {
      issues.push({
        scenarioId: scenario.id,
        message: `Node "${nodeId}" is unreachable from start node "${scenario.startNodeId}".`,
      });
    }
  }

  const memo = new Map<string, boolean>();
  const dfsStack = new Set<string>();

  function canReachEnd(nodeId: string): boolean {
    const cached = memo.get(nodeId);
    if (cached !== undefined) return cached;

    const node = scenario.nodes[nodeId];
    if (node.isEnd) {
      memo.set(nodeId, true);
      return true;
    }

    if (dfsStack.has(nodeId)) {
      return false;
    }

    dfsStack.add(nodeId);
    let result = false;
    for (const choice of node.choices) {
      if (!choice.nextNodeId) continue;
      if (canReachEnd(choice.nextNodeId)) {
        result = true;
        break;
      }
    }
    dfsStack.delete(nodeId);
    memo.set(nodeId, result);
    return result;
  }

  for (const nodeId of reachable) {
    if (!canReachEnd(nodeId)) {
      issues.push({
        scenarioId: scenario.id,
        message: `Node "${nodeId}" cannot reach any terminal end node.`,
      });
    }
  }

  return issues;
}

function validateScenarioCollection(
  scenarios: Record<string, Scenario>,
): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (const [key, scenario] of Object.entries(scenarios)) {
    if (scenario.id !== key) {
      issues.push({
        scenarioId: key,
        message: `Scenario key "${key}" does not match scenario.id "${scenario.id}".`,
      });
    }
    if (seenIds.has(scenario.id)) {
      issues.push({
        scenarioId: scenario.id,
        message: `Duplicate scenario id "${scenario.id}" found.`,
      });
    }
    seenIds.add(scenario.id);
    issues.push(...validateScenario(scenario));
  }

  return issues;
}

if (process.env.NODE_ENV !== "production") {
  const validationIssues = validateScenarioCollection(SCENARIOS);
  if (validationIssues.length > 0) {
    console.warn(
      "[SafePath] Scenario validation issues:\n" +
        validationIssues
          .map((i) => `- [${i.scenarioId}] ${i.message}`)
          .join("\n"),
    );
  }
}

// --- INDUSTRY SCENARIOS ---

// ═══════════════════════════════════════════════════════════════════════════
//  INDUSTRY SCENARIOS — ADDITION BLOCK
//  Paste this entire block at the bottom of scenarios.ts,
//  replacing the existing two SCENARIOS[...] assignments and the final
//  `export default SCENARIOS;` line.
//
//  Coverage: 2 scenarios per gameplay mode (Simulation, Puzzle, Role-Play,
//  Strategy, Story) for each of the three industries below.
//  Industries: CORPORATE_IT · MANUFACTURING · BANKING_FINANCE
// ═══════════════════════════════════════════════════════════════════════════

// ─── CORPORATE IT ────────────────────────────────────────────────────────────

// ── Simulation ── (1 of 2)  [already exists as industry_corp_it_1]
const id_corp_it = "industry_corp_it_1";
SCENARIOS[id_corp_it] = createMiniScenario({
  id: id_corp_it,
  title: "Server Room Tailgating",
  category: "Physical Security",
  mode: "Simulation",
  icon: "🏢",
  difficulty: 3,
  duration: "8 min",
  color: "#2563EB",
  triggerWarnings: ["Workplace pressure"],
  tags: ["industry-CORPORATE_IT"],
  context:
    "You are swiping your badge to enter the secure server room at your IT firm. A new employee you vaguely recognize from the breakroom is rushing up behind you carrying a large box of equipment.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "They call out: 'Hey, hold the door! My hands are full and I forgot my badge at my desk.'",
  saferChoice:
    "I'm sorry, policy says everyone has to swipe. I'll wait here while you grab your badge.",
  assertiveChoice:
    "You need to swipe your own badge or call security to let you in.",
  riskyChoice: "Hold the door open for them since their hands are full.",
  tip: "Tailgating is a primary method for physical breaches. Always enforce badge swipes, even for recognized colleagues.",
});

// ── Simulation ── (2 of 2)
const id_corp_it_sim2 = "industry_corp_it_sim2";
SCENARIOS[id_corp_it_sim2] = createMiniScenario({
  id: id_corp_it_sim2,
  title: "Ransomware Alert",
  category: "Cyber Security",
  mode: "Simulation",
  icon: "💻",
  difficulty: 4,
  duration: "9 min",
  color: "#1D4ED8",
  triggerWarnings: ["Workplace pressure"],
  tags: ["industry-CORPORATE_IT"],
  context:
    "You are working remotely when a pop-up locks your screen and displays a ransom demand, claiming all company files are encrypted. Your manager is unreachable and colleagues are asking you what to do.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "The pop-up shows a countdown timer and warns: 'Pay within 2 hours or all data is permanently deleted. Do NOT shut down your machine.'",
  saferChoice:
    "Immediately disconnect from the network, do NOT pay, and call the IT security hotline.",
  assertiveChoice:
    "Shut the machine down, isolate it physically, and email IT from your personal device.",
  riskyChoice:
    "Follow the on-screen instruction and keep the machine running while you try to find the IT manager.",
  tip: "Ransomware spreads through the network. Isolation is always the first step — never pay and never keep an infected machine connected.",
  q2SafePrompt:
    "IT security is now handling the machine. Your manager calls and asks you to share the ransom note screenshot publicly in the team chat 'so everyone is aware'. What do you do?",
  q2SafeChoice1:
    "Decline and suggest IT send an official advisory instead — sharing the image could spread malicious links.",
  q2SafeChoice2:
    "Send it only to your manager privately with a note about the risk.",
  q2SafeChoice3: "Post it in the team chat as asked — transparency is important.",
});

// ── Puzzle ── (1 of 2)
const id_corp_it_puz1 = "industry_corp_it_puz1";
SCENARIOS[id_corp_it_puz1] = createMiniScenario({
  id: id_corp_it_puz1,
  title: "Phishing Inbox",
  category: "Email Security",
  mode: "Puzzle",
  icon: "📧",
  difficulty: 3,
  duration: "8 min",
  color: "#1E40AF",
  triggerWarnings: [],
  tags: ["industry-CORPORATE_IT"],
  context:
    "You are a junior analyst at an IT consultancy. Your inbox contains an email from 'IT-Support@c0mpany.net' asking you to verify your credentials via a link before 5 PM 'or your account will be suspended'.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "The email reads: 'URGENT: Your account requires immediate re-verification. Click here to avoid suspension.' The sender domain is c0mpany.net (with a zero, not the letter O).",
  saferChoice:
    "Do not click the link. Forward the email to security@company.com and report it as phishing.",
  assertiveChoice:
    "Reply to the sender asking them to confirm via the official IT helpdesk number before you take any action.",
  riskyChoice:
    "Click the link to check — it is probably just a routine verification.",
  tip: "Homoglyph domains (c0mpany vs company) are a classic phishing tell. Always verify sender domains character by character before clicking.",
});

// ── Puzzle ── (2 of 2)
const id_corp_it_puz2 = "industry_corp_it_puz2";
SCENARIOS[id_corp_it_puz2] = createMiniScenario({
  id: id_corp_it_puz2,
  title: "USB Drop Attack",
  category: "Physical Security",
  mode: "Puzzle",
  icon: "🔌",
  difficulty: 3,
  duration: "8 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-CORPORATE_IT"],
  context:
    "You find an unlabelled USB drive in the company car park with a sticky note that says 'Q3 Salary Data'. No one nearby claims it.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "A colleague suggests plugging it into an air-gapped test machine to 'safely' check the contents before handing it in.",
  saferChoice:
    "Do not plug it in anywhere. Hand it to IT security in a sealed bag and document where you found it.",
  assertiveChoice:
    "Decline to plug it in and email IT security with the exact location and time you found it.",
  riskyChoice:
    "Plug it into the air-gapped test machine — it cannot reach the network so it is safe.",
  tip: "USB drop attacks use curiosity as a weapon. Even air-gapped machines can be compromised by malicious firmware. Never plug in unknown drives.",
});

// ── Role-Play ── (1 of 2)
const id_corp_it_rp1 = "industry_corp_it_rp1";
SCENARIOS[id_corp_it_rp1] = createMiniScenario({
  id: id_corp_it_rp1,
  title: "Vishing Call",
  category: "Social Engineering",
  mode: "Role-Play",
  icon: "📞",
  difficulty: 4,
  duration: "9 min",
  color: "#1D4ED8",
  triggerWarnings: ["Workplace pressure"],
  tags: ["industry-CORPORATE_IT"],
  context:
    "You receive a call from someone claiming to be from 'Microsoft Azure Support'. They say your company's cloud subscription is about to expire and they need your admin credentials to renew it right now.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #7DD3FC)",
  npcInitial:
    "This is Azure Support — ticket #88214. We need your admin login to prevent service disruption in the next 10 minutes.",
  prompt:
    "The caller sounds professional and has your name, company name, and subscription plan details. They are pressing you hard to act immediately.",
  saferChoice:
    "I never share credentials over phone. I will call Microsoft directly using the number on our contract.",
  assertiveChoice:
    "Please give me your employee ID and I will verify you through our IT vendor portal before proceeding.",
  riskyChoice:
    "Provide the credentials — losing cloud access would cause major disruption.",
  tip: "Legitimate vendors never ask for credentials over an inbound call. Time pressure and pre-obtained personal details are hallmarks of vishing attacks.",
});

// ── Role-Play ── (2 of 2)
const id_corp_it_rp2 = "industry_corp_it_rp2";
SCENARIOS[id_corp_it_rp2] = createMiniScenario({
  id: id_corp_it_rp2,
  title: "The Persistent Vendor",
  category: "Third-Party Risk",
  mode: "Role-Play",
  icon: "🤝",
  difficulty: 3,
  duration: "8 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-CORPORATE_IT"],
  context:
    "A software vendor you have never worked with calls asking for a 15-minute 'technical validation' that requires you to install their remote-access agent on your work laptop so they can 'demonstrate the integration'.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  npcInitial:
    "Hi, I just need you to run one small installer so I can show you the dashboard live. It will take two minutes.",
  prompt:
    "They offer to email you the installer directly. Your manager is in a meeting and you cannot reach them right now.",
  saferChoice:
    "I cannot install unapproved software. Send your documentation and I will raise a vendor approval request with IT.",
  assertiveChoice:
    "Any remote access tool needs to go through our procurement process first. I will schedule a proper vendor call next week.",
  riskyChoice:
    "Install the agent quickly — it is just a demo and you can uninstall it afterward.",
  tip: "Unsanctioned remote-access tools are a top vector for supply-chain breaches. Always route vendor software through formal approval, even for demos.",
});

// ── Strategy ── (1 of 2)
const id_corp_it_str1 = "industry_corp_it_str1";
SCENARIOS[id_corp_it_str1] = createMiniScenario({
  id: id_corp_it_str1,
  title: "Data Breach Response",
  category: "Incident Response",
  mode: "Strategy",
  icon: "🛡️",
  difficulty: 5,
  duration: "12 min",
  color: "#1E40AF",
  triggerWarnings: ["Workplace pressure"],
  tags: ["industry-CORPORATE_IT"],
  context:
    "Your monitoring system flags an anomalous data-exfiltration event at 2 AM. 40 GB of customer PII appears to have been copied to an external endpoint. You are the on-call security lead.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "Your dashboard shows the transfer is still in progress. You have four levers: revoke the compromised account, block the destination IP, alert the CISO, or preserve the forensic log first.",
  saferChoice:
    "Preserve forensic logs first, then revoke the account and block the IP simultaneously, and alert the CISO with evidence.",
  assertiveChoice:
    "Immediately revoke the account and block the IP to stop the transfer, then alert the CISO and collect logs.",
  riskyChoice:
    "Alert the CISO first and wait for authorisation before taking any technical action.",
  tip: "In active breaches, containment and evidence preservation must happen together. Waiting for authorisation while a transfer is live allows more data to leave. Logs are your legal lifeline — secure them before any system changes.",
});

// ── Strategy ── (2 of 2)
const id_corp_it_str2 = "industry_corp_it_str2";
SCENARIOS[id_corp_it_str2] = createMiniScenario({
  id: id_corp_it_str2,
  title: "Shadow IT Discovery",
  category: "IT Governance",
  mode: "Strategy",
  icon: "🔍",
  difficulty: 4,
  duration: "10 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-CORPORATE_IT"],
  context:
    "During a routine audit you discover that a busy product team has been using an unapproved SaaS project management tool containing sensitive roadmap data, customer feedback, and contractor details — for 8 months.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #7DD3FC)",
  prompt:
    "The team argues the tool is essential to their workflow and removing it immediately will halt a live product launch in three days.",
  saferChoice:
    "Conduct a rapid risk assessment of the tool's data controls, negotiate a 30-day formal onboarding window with security guardrails, and migrate sensitive data to approved storage immediately.",
  assertiveChoice:
    "Grant a 72-hour exception window tied to the launch, require the team to export and delete all sensitive data from the tool today, and open a procurement ticket.",
  riskyChoice:
    "Allow the team to continue using the tool unrestricted until after the launch — the business priority outweighs the risk right now.",
  tip: "Shadow IT creates uncontrolled data residency and breach liability. Even business-critical exceptions must include immediate data controls — not just a future promise to fix it.",
});

// ── Story ── (1 of 2)
const id_corp_it_sto1 = "industry_corp_it_sto1";
SCENARIOS[id_corp_it_sto1] = createMiniScenario({
  id: id_corp_it_sto1,
  title: "The Whistleblower's Dilemma",
  category: "Ethics & Compliance",
  mode: "Story",
  icon: "📋",
  difficulty: 4,
  duration: "10 min",
  color: "#1D4ED8",
  triggerWarnings: ["Workplace pressure", "Ethical conflict"],
  tags: ["industry-CORPORATE_IT"],
  context:
    "You are a senior developer at an IT firm. While reviewing production logs you discover that a colleague — also a close friend — has been siphoning anonymized customer usage data to a personal analytics side-project without authorization.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "Your friend confesses when you confront them privately. 'I wasn't selling it — I just wanted to test my model. Please don't report me, it will destroy my career.'",
  saferChoice:
    "Tell your friend this must be reported. Offer to accompany them to the compliance officer to make a voluntary disclosure, which typically reduces consequences.",
  assertiveChoice:
    "Report the incident to the Data Protection Officer directly and document the conversation you had with your friend.",
  riskyChoice:
    "Agree to keep it quiet on the condition that your friend deletes everything immediately.",
  tip: "Unauthorized use of customer data is a regulatory breach regardless of intent. Voluntary disclosure usually reduces penalties. Silence after discovery makes you complicit.",
});

// ── Story ── (2 of 2)
const id_corp_it_sto2 = "industry_corp_it_sto2";
SCENARIOS[id_corp_it_sto2] = createMiniScenario({
  id: id_corp_it_sto2,
  title: "The Promoted Insider",
  category: "Access Control",
  mode: "Story",
  icon: "🔑",
  difficulty: 3,
  duration: "9 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-CORPORATE_IT"],
  context:
    "A team member is promoted from developer to team lead. HR notifies you, the IT admin, three weeks after the promotion. During that gap, the employee retained all their old developer-level access and also received lead-level access, giving them unreviewed elevated permissions.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "The employee now has write access to production environments they should only have read access to. You notice this during a routine audit. The team lead is a well-respected performer with no history of misuse.",
  saferChoice:
    "Immediately revoke the excess developer permissions, bring the access profile in line with their new role, and flag the notification delay to HR as a process gap.",
  assertiveChoice:
    "Inform the employee and their manager, revoke the duplicate permissions, and document the exception for the audit trail.",
  riskyChoice:
    "Note the gap in a spreadsheet and plan to fix it at the next quarterly access review since the employee is trustworthy.",
  tip: "Privilege creep is a top audit finding. Role changes must trigger immediate access reconciliation — trustworthiness is not a substitute for access controls.",
});

// ─── MANUFACTURING ────────────────────────────────────────────────────────────

// ── Puzzle ── (1 of 2)  [already exists as industry_manufacturing_1]
const id_manufacturing = "industry_manufacturing_1";
SCENARIOS[id_manufacturing] = createMiniScenario({
  id: id_manufacturing,
  title: "Bypassed Safety Guard",
  category: "Compliance",
  mode: "Puzzle",
  icon: "🏭",
  difficulty: 3,
  duration: "10 min",
  color: "#EA580C",
  triggerWarnings: ["Workplace hazards"],
  tags: ["industry-MANUFACTURING"],
  context:
    "During your shift on the factory floor, you notice a senior operator has removed the physical safety guard on the stamping press to 'speed up' the batch run to meet a strict quota.",
  backgroundMood: "radial-gradient(circle at center, #FFEDD5, #FDBA74)",
  prompt:
    "The operator waves you over to help load materials faster. 'Come on, we're behind. It's safe if you just pay attention.'",
  saferChoice:
    "Stop work. 'I can't load materials without the guard in place. Let's put it back before we continue.'",
  assertiveChoice:
    "Step away from the machine. 'That's a safety violation. I'm calling the shift supervisor.'",
  riskyChoice:
    "Help them load the materials carefully just for this one delayed batch.",
  tip: "Never bypass machine guarding. The pressure to meet quotas does not supersede fundamental physical safety rules.",
});

// ── Puzzle ── (2 of 2)
const id_mfg_puz2 = "industry_manufacturing_puz2";
SCENARIOS[id_mfg_puz2] = createMiniScenario({
  id: id_mfg_puz2,
  title: "Unlabelled Chemical Drum",
  category: "Chemical Safety",
  mode: "Puzzle",
  icon: "⚗️",
  difficulty: 4,
  duration: "10 min",
  color: "#C2410C",
  triggerWarnings: ["Chemical hazards"],
  tags: ["industry-MANUFACTURING"],
  context:
    "You are on the warehouse floor when you notice a 200-litre drum near the mixing station has a faded, unreadable label. The drum is warm to the touch and there is a faint chemical smell.",
  backgroundMood: "radial-gradient(circle at center, #FFF7ED, #FED7AA)",
  prompt:
    "A co-worker wants to open it to identify the contents. 'I've worked here 10 years — I'll know what it is by smell.'",
  saferChoice:
    "Block access to the drum. Treat it as an unknown hazardous chemical, cordon the area, and call the safety officer.",
  assertiveChoice:
    "Tell the co-worker not to open it and immediately inform the shift supervisor while keeping others back.",
  riskyChoice:
    "Let the experienced co-worker take a quick sniff to identify it — his experience is reliable.",
  tip: "An unlabelled drum is an unknown chemical hazard. Identifying substances by smell can expose you to toxic fumes. Always treat unidentified containers as hazardous and escalate to a safety officer.",
});

// ── Simulation ── (1 of 2)
const id_mfg_sim1 = "industry_manufacturing_sim1";
SCENARIOS[id_mfg_sim1] = createMiniScenario({
  id: id_mfg_sim1,
  title: "Emergency Stop Override",
  category: "Machine Safety",
  mode: "Simulation",
  icon: "🚨",
  difficulty: 4,
  duration: "9 min",
  color: "#EA580C",
  triggerWarnings: ["Workplace hazards"],
  tags: ["industry-MANUFACTURING"],
  context:
    "You are operating an automated conveyor line. A jam occurs and the line stops. A maintenance technician reaches past the safety gate to clear the jam while the machine is still in a powered-down state — but the LOTO (Lockout-Tagout) padlock has NOT been applied.",
  backgroundMood: "radial-gradient(circle at center, #FFEDD5, #FDBA74)",
  prompt:
    "The technician says: 'I can see the jam — it will take ten seconds. No need to lock it out for something this small.'",
  saferChoice:
    "Stop the technician. The machine must be fully locked out before anyone reaches inside, regardless of how small the task is.",
  assertiveChoice:
    "Ask the technician to step back and apply the LOTO padlock yourself before the jam is cleared.",
  riskyChoice:
    "Let them clear it quickly — the machine is powered down and it really is a minor jam.",
  tip: "LOTO (Lockout-Tagout) is required for every maintenance interaction — there is no 'small enough' exception. Stored energy (hydraulic, spring, gravitational) can activate without electrical power.",
});

// ── Simulation ── (2 of 2)
const id_mfg_sim2 = "industry_manufacturing_sim2";
SCENARIOS[id_mfg_sim2] = createMiniScenario({
  id: id_mfg_sim2,
  title: "Fire Exit Blocked",
  category: "Emergency Preparedness",
  mode: "Simulation",
  icon: "🔥",
  difficulty: 2,
  duration: "7 min",
  color: "#DC2626",
  triggerWarnings: ["Emergency situations"],
  tags: ["industry-MANUFACTURING"],
  context:
    "You are walking through the dispatch bay when you notice a pallet of finished goods has been stacked directly in front of the fire exit door, blocking it entirely. Shift output targets are being counted tonight.",
  backgroundMood: "radial-gradient(circle at center, #FEF2F2, #FECACA)",
  prompt:
    "The bay supervisor says: 'Leave it — dispatch will clear it by morning. We need that space for tonight's count.'",
  saferChoice:
    "Refuse to leave it. Relocate the pallet immediately and report the blockage in the safety log.",
  assertiveChoice:
    "Tell the supervisor this is a statutory fire safety violation and contact the safety officer right now.",
  riskyChoice:
    "Leave it overnight as suggested — the fire alarm would give enough warning anyway.",
  tip: "Blocked fire exits are a statutory violation under the Factories Act and can be fatal in a real emergency. No output target justifies blocking an emergency egress route.",
});

// ── Role-Play ── (1 of 2)
const id_mfg_rp1 = "industry_manufacturing_rp1";
SCENARIOS[id_mfg_rp1] = createMiniScenario({
  id: id_mfg_rp1,
  title: "Near-Miss Reporting",
  category: "Safety Culture",
  mode: "Role-Play",
  icon: "📝",
  difficulty: 3,
  duration: "8 min",
  color: "#EA580C",
  triggerWarnings: ["Workplace pressure"],
  tags: ["industry-MANUFACTURING"],
  context:
    "A forklift came within a metre of hitting you in a pedestrian walkway due to a faded floor marking. You were not hurt. Your supervisor says near-miss reporting 'creates paperwork' and 'makes the department look bad before the audit'.",
  backgroundMood: "radial-gradient(circle at center, #FFEDD5, #FDBA74)",
  npcInitial:
    "Look, you're fine. Filing a near-miss report now will just slow everything down right before the audit.",
  prompt:
    "Your supervisor is asking you, face to face, not to file the report. Two colleagues are within earshot.",
  saferChoice:
    "I understand the timing is difficult, but I'm required to report near-misses. I'll file it through the safety portal today.",
  assertiveChoice:
    "A near-miss report protects everyone including you — I'm filing it. Let's talk about how to present it constructively before the audit.",
  riskyChoice:
    "Agree to skip the report this once given the audit timing.",
  tip: "Near-miss reports are the primary tool for preventing fatal incidents. Suppressing them hides systemic hazards and exposes the organization — and the supervisor — to far greater liability than the paperwork.",
});

// ── Role-Play ── (2 of 2)
const id_mfg_rp2 = "industry_manufacturing_rp2";
SCENARIOS[id_mfg_rp2] = createMiniScenario({
  id: id_mfg_rp2,
  title: "PPE Refusal",
  category: "PPE Compliance",
  mode: "Role-Play",
  icon: "🦺",
  difficulty: 2,
  duration: "7 min",
  color: "#C2410C",
  triggerWarnings: [],
  tags: ["industry-MANUFACTURING"],
  context:
    "You are a newly appointed safety officer doing a floor walk. You see a veteran worker operating a grinding machine without safety glasses. When you approach, they say they have done it for 12 years without glasses and they find them uncomfortable.",
  backgroundMood: "radial-gradient(circle at center, #FFF7ED, #FED7AA)",
  npcInitial:
    "Son/Ma'am, I've been grinding metal since before you joined. I know what I'm doing.",
  prompt:
    "The worker is experienced and well-liked. Several peers are watching the interaction.",
  saferChoice:
    "I respect your experience, and my job is to make sure you go home safe every day. Please put on the safety glasses — I can find a better-fitting pair if comfort is the issue.",
  assertiveChoice:
    "Safety glasses are mandatory at this station regardless of experience. I need you to wear them now, and I'll log this interaction.",
  riskyChoice:
    "Back off to avoid conflict with a veteran — they probably know their risk tolerance.",
  tip: "PPE compliance applies equally to all experience levels. Offering to resolve the comfort issue shows respect while upholding the standard. Backing off sets a precedent that undermines safety culture.",
});

// ── Strategy ── (1 of 2)
const id_mfg_str1 = "industry_manufacturing_str1";
SCENARIOS[id_mfg_str1] = createMiniScenario({
  id: id_mfg_str1,
  title: "Chemical Spill Triage",
  category: "Emergency Response",
  mode: "Strategy",
  icon: "🧪",
  difficulty: 5,
  duration: "12 min",
  color: "#EA580C",
  triggerWarnings: ["Chemical hazards", "Emergency situations"],
  tags: ["industry-MANUFACTURING"],
  context:
    "A 50-litre solvent drum has overturned in the mixing bay. Three workers are in the immediate vicinity. The solvent is flammable and there is welding activity 20 metres away. You are the senior safety officer on site.",
  backgroundMood: "radial-gradient(circle at center, #FFEDD5, #FCA5A1)",
  prompt:
    "You have four simultaneous actions available: evacuate the bay, halt the welding, call emergency services, or grab the spill kit yourself. You cannot do all four instantly — prioritize.",
  saferChoice:
    "First shout to halt welding and trigger evacuation simultaneously — eliminating ignition risk and clearing personnel takes priority. Then call emergency services and deploy the spill kit only once the area is clear.",
  assertiveChoice:
    "Evacuate the bay first while calling emergency services on your radio, then halt the welding once personnel are clear.",
  riskyChoice:
    "Grab the spill kit and start containment immediately — stopping the spread is the most urgent priority.",
  tip: "In a flammable spill, ignition elimination and personnel evacuation always precede containment. A contained spill that ignites kills people. Spill kits are used after the scene is safe.",
});

// ── Strategy ── (2 of 2)
const id_mfg_str2 = "industry_manufacturing_str2";
SCENARIOS[id_mfg_str2] = createMiniScenario({
  id: id_mfg_str2,
  title: "Contractor Safety Induction Gap",
  category: "Contractor Management",
  mode: "Strategy",
  icon: "📋",
  difficulty: 4,
  duration: "10 min",
  color: "#C2410C",
  triggerWarnings: [],
  tags: ["industry-MANUFACTURING"],
  context:
    "A third-party electrical contractor team of five has arrived on site to replace switchgear in a live panel area. Checking their documentation, you find two of the five have not completed your mandatory on-site safety induction and one has an expired confined-space permit.",
  backgroundMood: "radial-gradient(circle at center, #FFEDD5, #FDBA74)",
  prompt:
    "The contractor supervisor says the two uninducted workers are 'just labourers who will only be passing tools' and the permit issue is 'a paperwork thing that doesn't apply to this job'.",
  saferChoice:
    "Halt work for the non-compliant personnel immediately. The two uninducted workers must complete induction before entering the work zone, and the expired permit must be reissued before any work begins near confined spaces.",
  assertiveChoice:
    "Allow the three compliant contractors to begin prep work in a non-hazardous area only while the inductions and permit are resolved, with a hard restart deadline of two hours.",
  riskyChoice:
    "Allow all five to proceed — the supervisor is on-site and accountable for their team's safety.",
  tip: "Contractor safety compliance is a principal duty under the Factories Act — the host company is jointly liable for incidents involving non-compliant contractors on its premises. 'Supervisor accountability' does not transfer legal liability.",
});

// ── Story ── (1 of 2)
const id_mfg_sto1 = "industry_manufacturing_sto1";
SCENARIOS[id_mfg_sto1] = createMiniScenario({
  id: id_mfg_sto1,
  title: "The Quota Dilemma",
  category: "Safety Culture",
  mode: "Story",
  icon: "⚖️",
  difficulty: 4,
  duration: "10 min",
  color: "#EA580C",
  triggerWarnings: ["Workplace pressure"],
  tags: ["industry-MANUFACTURING"],
  context:
    "You are a line supervisor. Tonight's shipment is 200 units short of the monthly target. Your plant manager calls and tells you to keep the line running through the scheduled 30-minute mandatory maintenance window to make up the gap.",
  backgroundMood: "radial-gradient(circle at center, #FFEDD5, #FDBA74)",
  prompt:
    "The manager says: 'The machines ran fine last month without the maintenance window. One night won't kill anyone.' You know that a similar decision at another plant last year caused a serious mechanical failure.",
  saferChoice:
    "Decline and explain the risk, citing the sector precedent. Offer to escalate the quota shortfall to leadership as a planning issue rather than a safety trade-off.",
  assertiveChoice:
    "Conduct the maintenance window as scheduled and document the manager's instruction and your refusal in writing.",
  riskyChoice:
    "Run the line through the window — the manager is senior to you and 'one night' is probably fine.",
  tip: "Skipping maintenance under production pressure is one of the most common precursors to serious incidents. Refusing an unsafe instruction and documenting it protects you and your workers. Quota shortfalls are a planning problem, not a safety trade-off.",
});

// ── Story ── (2 of 2)
const id_mfg_sto2 = "industry_manufacturing_sto2";
SCENARIOS[id_mfg_sto2] = createMiniScenario({
  id: id_mfg_sto2,
  title: "New Worker, Unsafe Machine",
  category: "Onboarding Safety",
  mode: "Story",
  icon: "👷",
  difficulty: 3,
  duration: "9 min",
  color: "#C2410C",
  triggerWarnings: ["Workplace hazards"],
  tags: ["industry-MANUFACTURING"],
  context:
    "You are a week into your new manufacturing job. A colleague shows you a hydraulic press and says they will 'teach you properly next week'. In the meantime they ask you to run a batch on the press today because the team is short-staffed.",
  backgroundMood: "radial-gradient(circle at center, #FFF7ED, #FED7AA)",
  prompt:
    "They hand you the operating sheet and say: 'It's simple — just follow the steps. I'll be across the floor if you need me.' You have never used this machine.",
  saferChoice:
    "Decline to operate the machine until you have received the formal supervised training. Explain this clearly and ask for a different task you are qualified for.",
  assertiveChoice:
    "Tell the colleague you will need a supervisor to stand with you through the first batch before you can run it independently.",
  riskyChoice:
    "Run the batch using the operating sheet — the instructions seem clear enough and the team needs help.",
  tip: "Operating unfamiliar machinery without formal training is one of the leading causes of new-worker injuries in manufacturing. Operating sheets are not a substitute for supervised induction. It is always acceptable to refuse work you are not trained for.",
});

// ─── BANKING & FINANCE ────────────────────────────────────────────────────────

// ── Simulation ── (1 of 2)
const id_bank_sim1 = "industry_banking_sim1";
SCENARIOS[id_bank_sim1] = createMiniScenario({
  id: id_bank_sim1,
  title: "Suspicious Wire Transfer",
  category: "Fraud Detection",
  mode: "Simulation",
  icon: "💰",
  difficulty: 4,
  duration: "9 min",
  color: "#7C3AED",
  triggerWarnings: ["Financial pressure"],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "You are a banking operations officer. A wire transfer of ₹47 lakh has been initiated by a long-standing corporate client to an overseas account they have never transacted with before. The instruction arrived via email, not through the secure banking portal.",
  backgroundMood: "radial-gradient(circle at center, #EDE9FE, #C4B5FD)",
  prompt:
    "The client's relationship manager tells you: 'Process it — I spoke to the client last week and they mentioned an international expansion. This is probably related.'",
  saferChoice:
    "Place a hold on the transfer. Call the client directly on their verified phone number to confirm the instruction before processing.",
  assertiveChoice:
    "Reject the email-originated instruction per policy. Inform the RM and the client in writing that all wire transfers above ₹10 lakh require portal authorization.",
  riskyChoice:
    "Process the transfer based on the RM's verbal confirmation — the client relationship is long-standing.",
  tip: "Business Email Compromise (BEC) fraud commonly targets corporate accounts via out-of-channel instructions. Always verify high-value transfers directly with the client through a known, verified channel — never rely on the requesting email or a third-party verbal relay.",
});

// ── Simulation ── (2 of 2)
const id_bank_sim2 = "industry_banking_sim2";
SCENARIOS[id_bank_sim2] = createMiniScenario({
  id: id_bank_sim2,
  title: "ATM Skimmer Report",
  category: "Fraud Detection",
  mode: "Simulation",
  icon: "🏧",
  difficulty: 3,
  duration: "8 min",
  color: "#6D28D9",
  triggerWarnings: [],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "A branch teller receives a call from a customer who says the card reader on your bank's ATM near the mall 'felt loose' and had an unusual overlay panel. The customer did not use the machine.",
  backgroundMood: "radial-gradient(circle at center, #F5F3FF, #DDD6FE)",
  prompt:
    "Your branch manager says: 'It's probably just a loose part from maintenance yesterday. Log it in the system and we'll check during the next scheduled ATM inspection on Friday.'",
  saferChoice:
    "Treat it as a confirmed skimmer suspicion. Take the ATM offline immediately, dispatch a technician today, and notify the fraud team.",
  assertiveChoice:
    "Escalate to the fraud team and ATM operations right now. Do not wait for scheduled inspection — a live skimmer can compromise hundreds of cards per hour.",
  riskyChoice:
    "Follow the manager's instruction — log it and wait for Friday's inspection.",
  tip: "ATM skimmer reports must be treated as live incidents, not maintenance tickets. Every hour of delay potentially compromises every card used at that machine. When in doubt, take it offline.",
});

// ── Puzzle ── (1 of 2)
const id_bank_puz1 = "industry_banking_puz1";
SCENARIOS[id_bank_puz1] = createMiniScenario({
  id: id_bank_puz1,
  title: "KYC Document Mismatch",
  category: "KYC Compliance",
  mode: "Puzzle",
  icon: "📄",
  difficulty: 4,
  duration: "10 min",
  color: "#7C3AED",
  triggerWarnings: [],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "A customer wants to open a high-value fixed deposit account. Their PAN card and Aadhaar have different addresses. The photo on the Aadhaar looks slightly different from the person in front of you. The customer explains they recently moved and 'just hadn't updated everything yet'.",
  backgroundMood: "radial-gradient(circle at center, #EDE9FE, #C4B5FD)",
  prompt:
    "The branch target for new FD accounts this month is short by two. Your supervisor says: 'The explanation is reasonable — process it and flag it for document update within 30 days.'",
  saferChoice:
    "Do not open the account today. Explain to the customer that both documents must match before account opening. Provide the process for address update and reschedule.",
  assertiveChoice:
    "Raise a KYC exception request to the compliance team with full documentation of the discrepancy. Do not open the account without compliance clearance.",
  riskyChoice:
    "Process the account with a 30-day document update note as the supervisor suggested.",
  tip: "Address and photo discrepancies in KYC documents are red flags for identity fraud. RBI guidelines prohibit account opening with unresolved KYC mismatches — a 30-day note is not a compliant workaround. Branch targets do not override regulatory obligation.",
});

// ── Puzzle ── (2 of 2)
const id_bank_puz2 = "industry_banking_puz2";
SCENARIOS[id_bank_puz2] = createMiniScenario({
  id: id_bank_puz2,
  title: "Structured Cash Deposits",
  category: "Anti-Money Laundering",
  mode: "Puzzle",
  icon: "💵",
  difficulty: 5,
  duration: "11 min",
  color: "#6D28D9",
  triggerWarnings: [],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "Over the past 10 days, the same customer has made 9 cash deposits, each between ₹45,000 and ₹49,000 — just below the ₹50,000 threshold that requires PAN disclosure. The customer says they are a small trader depositing daily earnings.",
  backgroundMood: "radial-gradient(circle at center, #F5F3FF, #DDD6FE)",
  prompt:
    "A colleague processes each transaction individually and says: 'Every single deposit is below the limit — we have no reporting obligation.'",
  saferChoice:
    "Flag this as suspected structuring (smurfing) under PMLA and file a Suspicious Transaction Report (STR) with the FIU-IND regardless of individual transaction sizes.",
  assertiveChoice:
    "Escalate to your branch compliance officer immediately with the full transaction pattern — the obligation to report is triggered by the pattern, not the individual amounts.",
  riskyChoice:
    "Agree with your colleague — each transaction individually is below the threshold and you have met the letter of the law.",
  tip: "Structuring — breaking large amounts into sub-threshold deposits to avoid reporting — is itself a money-laundering offence under PMLA. The STR obligation is triggered by the pattern. 'Each transaction is below the limit' is a compliance trap, not a defence.",
});

// ── Role-Play ── (1 of 2)
const id_bank_rp1 = "industry_banking_rp1";
SCENARIOS[id_bank_rp1] = createMiniScenario({
  id: id_bank_rp1,
  title: "Pressured Cross-Sell",
  category: "Customer Ethics",
  mode: "Role-Play",
  icon: "🗣️",
  difficulty: 3,
  duration: "8 min",
  color: "#7C3AED",
  triggerWarnings: [],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "A senior citizen has come in to renew her fixed deposit. Your monthly cross-sell target includes insurance-linked investment products. Your manager is observing the interaction and has asked you to pitch the ULIP product to this customer.",
  backgroundMood: "radial-gradient(circle at center, #EDE9FE, #DDD6FE)",
  npcInitial:
    "I just want to renew my FD the same as last year — same amount, same tenure.",
  prompt:
    "Your manager nods at you expectantly. The customer is 68 years old, has limited financial literacy, and her entire savings are in this FD.",
  saferChoice:
    "Renew her FD as requested. If I introduce a new product, I need to explain it clearly and in full — including the 5-year lock-in and market risk — and only if it genuinely suits her situation.",
  assertiveChoice:
    "Renew the FD and tell my manager privately that I cannot ethically pitch a high-risk product to this customer profile. I'll document this interaction.",
  riskyChoice:
    "Pitch the ULIP briefly while the customer is still present — it counts toward target and the manager is watching.",
  tip: "Mis-selling complex financial products to unsuitable customers is a serious regulatory breach under RBI and SEBI guidelines. Suitability comes before sales targets. Senior citizens with concentrated savings in safe instruments require the highest standard of care.",
});

// ── Role-Play ── (2 of 2)
const id_bank_rp2 = "industry_banking_rp2";
SCENARIOS[id_bank_rp2] = createMiniScenario({
  id: id_bank_rp2,
  title: "Insider Trade Tip",
  category: "Market Integrity",
  mode: "Role-Play",
  icon: "📈",
  difficulty: 5,
  duration: "10 min",
  color: "#6D28D9",
  triggerWarnings: ["Ethical conflict"],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "You are a relationship manager at a private bank. During a routine portfolio review call, a high-net-worth client casually mentions that he heard from a board member that a mid-cap company is about to announce a large acquisition next week. He asks you to buy ₹20 lakh worth of the company's shares for his portfolio 'before the news breaks'.",
  backgroundMood: "radial-gradient(circle at center, #F5F3FF, #C4B5FD)",
  npcInitial:
    "Just between us — it's a sure thing. Buy the shares today and I'll double my AUM with you if this plays out.",
  prompt:
    "The client is one of your bank's top revenue contributors. Your manager has been pushing you to deepen this client relationship.",
  saferChoice:
    "Decline the instruction clearly. Explain that acting on material non-public information is insider trading — illegal for both of us — and that I am required to report this conversation to our compliance team.",
  assertiveChoice:
    "Refuse to execute the trade and immediately report the conversation to the compliance officer with a written record.",
  riskyChoice:
    "Execute the trade discreetly — the client is too important to lose and you have no way to verify if the information is real.",
  tip: "Acting on material non-public information (MNPI) is insider trading under SEBI regulations, regardless of whether the information proves accurate. The obligation to refuse and report exists the moment the tip is received. Client revenue is never a defence.",
});

// ── Strategy ── (1 of 2)
const id_bank_str1 = "industry_banking_str1";
SCENARIOS[id_bank_str1] = createMiniScenario({
  id: id_bank_str1,
  title: "Core Banking System Outage",
  category: "Operational Risk",
  mode: "Strategy",
  icon: "🏦",
  difficulty: 5,
  duration: "12 min",
  color: "#7C3AED",
  triggerWarnings: ["Workplace pressure"],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "Your bank's core banking system goes offline at 10 AM on a Monday — peak transaction time. ATMs are down, NEFT/RTGS transfers are failing, and customers are flooding branches. You are the operations head on duty.",
  backgroundMood: "radial-gradient(circle at center, #EDE9FE, #C4B5FD)",
  prompt:
    "You have four concurrent decisions: authorize branch staff to use manual override ledgers, communicate a holding message to customers, escalate to the RBI as a major operational incident, and contact the IT vendor. You cannot do all four simultaneously — what is your prioritization?",
  saferChoice:
    "Activate manual override ledgers immediately to restore basic service, then issue a customer holding message. Escalate to RBI and contact the IT vendor in parallel — both are mandatory and time-bound.",
  assertiveChoice:
    "Contact the IT vendor first to establish recovery time, issue a customer message based on that ETA, then authorize manual overrides and escalate to RBI.",
  riskyChoice:
    "Focus all effort on IT vendor recovery first — manual overrides and communications can wait until you have a better picture.",
  tip: "RBI requires notification of major operational incidents within defined timeframes — delay is itself a compliance breach. Customer communication reduces branch crowding and reputational damage. Manual overrides protect revenue continuity. These steps are complementary, not sequential choices.",
});

// ── Strategy ── (2 of 2)
const id_bank_str2 = "industry_banking_str2";
SCENARIOS[id_bank_str2] = createMiniScenario({
  id: id_bank_str2,
  title: "Loan Restructuring Pressure",
  category: "Credit Risk",
  mode: "Strategy",
  icon: "📊",
  difficulty: 4,
  duration: "11 min",
  color: "#6D28D9",
  triggerWarnings: [],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "A regional head pushes your credit team to restructure 12 NPA (Non-Performing Asset) loans as 'standard' by changing repayment schedule classifications before the quarter-end audit. He argues it will 'give borrowers more time' and 'avoid a bad headline'. You are the credit risk manager.",
  backgroundMood: "radial-gradient(circle at center, #F5F3FF, #DDD6FE)",
  prompt:
    "The regional head says: 'It's not misclassification — it's proactive restructuring. The auditors won't flag it if the paperwork is clean.'",
  saferChoice:
    "Refuse. Report the instruction to the Chief Risk Officer and the internal audit function with full documentation. Proper restructuring requires RBI-compliant classification, not reclassification of existing NPAs to avoid disclosure.",
  assertiveChoice:
    "Decline to reclassify. Offer to prepare a legitimate RBI-compliant restructuring proposal for genuinely viable borrowers, and document the regional head's instruction in writing.",
  riskyChoice:
    "Process the restructuring with clean paperwork as the regional head suggests — technically he has more seniority and the intention is to help borrowers.",
  tip: "Misclassifying NPAs to manipulate provisioning is fraudulent financial reporting under RBI prudential norms and can attract criminal liability. Seniority does not authorize regulatory fraud. The obligation to escalate to internal audit and the CRO is absolute.",
});

// ── Story ── (1 of 2)
const id_bank_sto1 = "industry_banking_sto1";
SCENARIOS[id_bank_sto1] = createMiniScenario({
  id: id_bank_sto1,
  title: "The Friendly Auditor",
  category: "Audit Integrity",
  mode: "Story",
  icon: "🔎",
  difficulty: 4,
  duration: "10 min",
  color: "#7C3AED",
  triggerWarnings: ["Ethical conflict"],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "An external auditor reviewing your branch has been friendly all week. On his last day he asks you — casually, over coffee — if you could 'show him a workaround' for a flagged control gap so he can close the finding without escalating it to head office.",
  backgroundMood: "radial-gradient(circle at center, #EDE9FE, #C4B5FD)",
  prompt:
    "He frames it as: 'Look, the gap is minor and fixing it will take months. This way the branch avoids a formal observation and I close my file cleanly. Everyone wins.'",
  saferChoice:
    "Decline. Explain that helping obscure an audit finding is a serious breach for both of us, and that I need to report this conversation to my branch manager and compliance team.",
  assertiveChoice:
    "Refuse clearly and end the conversation. Report the auditor's request in writing to the internal audit function and the firm's engagement partner.",
  riskyChoice:
    "Show him the workaround — the gap is minor and the informal resolution benefits everyone.",
  tip: "Helping an auditor close findings through workarounds is audit obstruction and a regulatory breach, regardless of the materiality of the original finding. The auditor's request is itself reportable. 'Minor gaps' that are concealed create bigger liabilities than the gap itself.",
});

// ── Story ── (2 of 2)
const id_bank_sto2 = "industry_banking_sto2";
SCENARIOS[id_bank_sto2] = createMiniScenario({
  id: id_bank_sto2,
  title: "Account Access After Bereavement",
  category: "Customer Protection",
  mode: "Story",
  icon: "🤝",
  difficulty: 3,
  duration: "9 min",
  color: "#6D28D9",
  triggerWarnings: ["Bereavement", "Emotional distress"],
  tags: ["industry-BANKING_FINANCE"],
  context:
    "A grieving widow comes to your branch saying her husband passed away yesterday. She needs access to his account immediately to pay for the funeral and does not have his debit card or PIN. She has his death certificate and her marriage certificate.",
  backgroundMood: "radial-gradient(circle at center, #F5F3FF, #DDD6FE)",
  prompt:
    "She is visibly distressed. A colleague suggests you 'just transfer a small amount' to help her out since the circumstances are clearly genuine.",
  saferChoice:
    "Express sincere condolences and explain the legal process clearly. Initiate the deceased account claim procedure, help her access the required forms, and connect her with your branch's bereavement liaison officer for expedited handling.",
  assertiveChoice:
    "Follow the legal process, but personally walk her through the fastest compliant path — including same-day form submission and escalation to the branch manager for priority processing.",
  riskyChoice:
    "Transfer a small amount as your colleague suggests — the documentation is legitimate and she genuinely needs the funds.",
  tip: "Account access after death is governed by succession law regardless of the emotional context. An unauthorized transfer — even with good intent — is a legal violation that exposes the bank and the employee to liability. Compassion is best expressed through an expedited compliant process, not by bypassing controls.",
});

// ═══ EDUCATION ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

// —— Simulation —— (1 of 2)
const id_edu_sim1 = "industry_education_sim1";
SCENARIOS[id_edu_sim1] = createMiniScenario({
  id: id_edu_sim1,
  title: "Lab Chemical Spill",
  category: "Campus Safety",
  mode: "Simulation",
  icon: "🧪",
  difficulty: 3,
  duration: "9 min",
  color: "#2563EB",
  triggerWarnings: ["Chemical hazard"],
  tags: ["industry-EDUCATION"],
  context:
    "During a practical lab session, a student knocks over a beaker of an unknown solvent. The smell is sharp and several students start to cough.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "You are the lab supervisor. The class is panicking and one student tries to clean the spill with paper towels.",
  saferChoice:
    "Evacuate the room immediately, activate the spill protocol, and call the lab safety officer.",
  assertiveChoice:
    "Stop the student, clear the area, and isolate ventilation while you consult the SDS for the chemical.",
  riskyChoice:
    "Let the student clean it up quickly to avoid disrupting the class.",
  tip: "Unidentified chemical spills require evacuation and formal spill response. Speed is never a substitute for safety protocol.",
});

// —— Simulation —— (2 of 2)
const id_edu_sim2 = "industry_education_sim2";
SCENARIOS[id_edu_sim2] = createMiniScenario({
  id: id_edu_sim2,
  title: "Exam Paper Leak",
  category: "Academic Integrity",
  mode: "Simulation",
  icon: "📝",
  difficulty: 4,
  duration: "10 min",
  color: "#1D4ED8",
  triggerWarnings: ["Ethical conflict"],
  tags: ["industry-EDUCATION"],
  context:
    "A student claims they received the upcoming exam paper in a class group chat. They show you screenshots.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "The exam is in 24 hours. Your head of department is traveling and unreachable.",
  saferChoice:
    "Escalate to the academic integrity committee, quarantine the exam, and prepare an alternate paper.",
  assertiveChoice:
    "Secure the evidence and inform the principal immediately while pausing exam distribution.",
  riskyChoice:
    "Proceed with the existing paper to avoid disruption and deal with it after the exam.",
  tip: "Once exam integrity is compromised, proceeding undermines fairness and trust. Evidence capture and swift escalation are mandatory.",
});

// —— Puzzle —— (1 of 2)
const id_edu_puz1 = "industry_education_puz1";
SCENARIOS[id_edu_puz1] = createMiniScenario({
  id: id_edu_puz1,
  title: "Scholarship Phishing Email",
  category: "Digital Safety",
  mode: "Puzzle",
  icon: "📧",
  difficulty: 3,
  duration: "8 min",
  color: "#1E40AF",
  triggerWarnings: [],
  tags: ["industry-EDUCATION"],
  context:
    "A student forwards you an email offering a 'guaranteed scholarship' that asks for Aadhaar and a processing fee.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "The sender domain is scholarship-help@edu-aid.org and the email urges payment within 2 hours.",
  saferChoice:
    "Advise the student not to pay, report the email to IT security, and share a campus-wide warning.",
  assertiveChoice:
    "Verify with the official scholarship office before taking any action.",
  riskyChoice:
    "Suggest the student try it because it might be legitimate and time-sensitive.",
  tip: "Scholarship scams use urgency and fake domains. Never share IDs or pay fees without official verification.",
});

// —— Puzzle —— (2 of 2)
const id_edu_puz2 = "industry_education_puz2";
SCENARIOS[id_edu_puz2] = createMiniScenario({
  id: id_edu_puz2,
  title: "Field Trip Consent Mismatch",
  category: "Student Safety",
  mode: "Puzzle",
  icon: "🚌",
  difficulty: 3,
  duration: "8 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-EDUCATION"],
  context:
    "A student arrives for a field trip but the signed consent form does not match the guardian's signature on record.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "The bus is ready to depart and the student is pleading to go.",
  saferChoice:
    "Do not allow travel until the guardian confirms consent through the official channel.",
  assertiveChoice:
    "Call the guardian immediately and document the verification before departure.",
  riskyChoice:
    "Let the student go to avoid delaying the trip for everyone.",
  tip: "Consent verification protects students and staff. A delayed bus is minor; a safeguarding breach is not.",
});

// —— Role-Play —— (1 of 2)
const id_edu_rp1 = "industry_education_rp1";
SCENARIOS[id_edu_rp1] = createMiniScenario({
  id: id_edu_rp1,
  title: "Angry Parent Meeting",
  category: "Communication",
  mode: "Role-Play",
  icon: "🗣️",
  difficulty: 3,
  duration: "8 min",
  color: "#1D4ED8",
  triggerWarnings: ["Verbal aggression"],
  tags: ["industry-EDUCATION"],
  context:
    "A parent storms into your office after school and accuses you of unfairly grading their child.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  npcInitial:
    "This is biased! My child never gets marks from you. Fix this now or I will report you.",
  prompt:
    "They are raising their voice and other students can hear.",
  saferChoice:
    "Set a boundary, move to a private space, and follow the formal grievance process.",
  assertiveChoice:
    "Acknowledge concern, state you will review the grading rubric, and schedule a formal meeting.",
  riskyChoice:
    "Argue defensively and justify the grade on the spot.",
  tip: "De-escalation plus process protects both parties. Public confrontation escalates risk.",
});

// —— Role-Play —— (2 of 2)
const id_edu_rp2 = "industry_education_rp2";
SCENARIOS[id_edu_rp2] = createMiniScenario({
  id: id_edu_rp2,
  title: "Boundary With Student Messages",
  category: "Professional Conduct",
  mode: "Role-Play",
  icon: "📱",
  difficulty: 3,
  duration: "7 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-EDUCATION"],
  context:
    "A student starts sending late-night messages on your personal number asking for assignment help.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  npcInitial:
    "Sorry to text so late, but can you quickly check my assignment? I'm stressed.",
  prompt:
    "They insist it is urgent and say other teachers respond after hours.",
  saferChoice:
    "Reply once with office-hour boundaries and redirect to official communication channels.",
  assertiveChoice:
    "Do not respond on personal channels and report the boundary issue to your department head.",
  riskyChoice:
    "Respond and keep the conversation going to be helpful.",
  tip: "Clear boundaries and official channels protect both educator and student.",
});

// —— Strategy —— (1 of 2)
const id_edu_str1 = "industry_education_str1";
SCENARIOS[id_edu_str1] = createMiniScenario({
  id: id_edu_str1,
  title: "Campus Lockdown Decision",
  category: "Crisis Response",
  mode: "Strategy",
  icon: "🛡️",
  difficulty: 4,
  duration: "11 min",
  color: "#1E40AF",
  triggerWarnings: ["Crisis scenario"],
  tags: ["industry-EDUCATION"],
  context:
    "Security reports a suspicious person near the main gate and a student posts on social media about a 'threat'.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "You must decide whether to initiate a full lockdown, partial shelter-in-place, or monitor further.",
  saferChoice:
    "Initiate a controlled lockdown, notify staff and parents, and coordinate with local authorities.",
  assertiveChoice:
    "Activate shelter-in-place for affected buildings and dispatch security to verify the report.",
  riskyChoice:
    "Wait for more information to avoid unnecessary panic.",
  tip: "When safety is uncertain, structured protective action is safer than delay. Communication prevents panic.",
});

// —— Strategy —— (2 of 2)
const id_edu_str2 = "industry_education_str2";
SCENARIOS[id_edu_str2] = createMiniScenario({
  id: id_edu_str2,
  title: "Student Data Breach",
  category: "Data Privacy",
  mode: "Strategy",
  icon: "🗄️",
  difficulty: 4,
  duration: "10 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-EDUCATION"],
  context:
    "A shared drive containing student records is mistakenly made public. You discover it after a parent reports seeing grades online.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "You need to contain the exposure, notify stakeholders, and preserve logs for investigation.",
  saferChoice:
    "Restrict access immediately, preserve logs, notify leadership and affected parents, and initiate incident response.",
  assertiveChoice:
    "Lock down the drive and alert IT to audit access while drafting a notification.",
  riskyChoice:
    "Fix the permissions quietly and avoid notifying anyone to prevent reputational damage.",
  tip: "Data exposure requires containment and transparent notification. Quiet fixes compound liability.",
});

// —— Story —— (1 of 2)
const id_edu_sto1 = "industry_education_sto1";
SCENARIOS[id_edu_sto1] = createMiniScenario({
  id: id_edu_sto1,
  title: "Plagiarism Dilemma",
  category: "Academic Integrity",
  mode: "Story",
  icon: "📚",
  difficulty: 3,
  duration: "9 min",
  color: "#1D4ED8",
  triggerWarnings: ["Ethical conflict"],
  tags: ["industry-EDUCATION"],
  context:
    "You discover that a top-performing student copied a large section of their thesis from an online source.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "The student pleads that a scholarship is on the line and asks for a second chance without formal reporting.",
  saferChoice:
    "Follow the academic integrity policy and report the case while offering support services.",
  assertiveChoice:
    "Document the evidence and escalate to the committee for a fair review.",
  riskyChoice:
    "Ignore the plagiarism because of the student's overall performance.",
  tip: "Integrity policies exist to protect fairness. Exceptions erode trust and standards.",
});

// —— Story —— (2 of 2)
const id_edu_sto2 = "industry_education_sto2";
SCENARIOS[id_edu_sto2] = createMiniScenario({
  id: id_edu_sto2,
  title: "After-Hours Tutoring Request",
  category: "Professional Conduct",
  mode: "Story",
  icon: "🕒",
  difficulty: 3,
  duration: "8 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-EDUCATION"],
  context:
    "A parent offers to pay you privately to tutor their child, but school policy requires all tutoring to be arranged through the institution.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "The parent says they will only proceed if it's private and asks you not to tell the school.",
  saferChoice:
    "Decline and direct them to the official tutoring program.",
  assertiveChoice:
    "Explain the policy and offer to help them book through the school system.",
  riskyChoice:
    "Accept the private arrangement to help the student and earn extra income.",
  tip: "Policy violations create conflicts of interest and liability. Use official channels.",
});

// ═══ RETAIL ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

// —— Simulation —— (1 of 2)
const id_retail_sim1 = "industry_retail_sim1";
SCENARIOS[id_retail_sim1] = createMiniScenario({
  id: id_retail_sim1,
  title: "Suspected Shoplifting",
  category: "Loss Prevention",
  mode: "Simulation",
  icon: "🛍️",
  difficulty: 3,
  duration: "8 min",
  color: "#2563EB",
  triggerWarnings: ["Confrontation risk"],
  tags: ["industry-RETAIL"],
  context:
    "You notice a customer repeatedly placing items in a bag without heading to checkout.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "Your colleague suggests confronting them directly near the exit.",
  saferChoice:
    "Follow store loss-prevention protocol: notify security/manager and observe without confrontation.",
  assertiveChoice:
    "Offer customer service assistance and alert the floor supervisor discreetly.",
  riskyChoice:
    "Confront the customer yourself and demand they empty the bag.",
  tip: "Direct confrontation increases risk. Use established loss-prevention procedures.",
});

// —— Simulation —— (2 of 2)
const id_retail_sim2 = "industry_retail_sim2";
SCENARIOS[id_retail_sim2] = createMiniScenario({
  id: id_retail_sim2,
  title: "Cash Drawer Shortage",
  category: "Operations",
  mode: "Simulation",
  icon: "💵",
  difficulty: 3,
  duration: "8 min",
  color: "#1D4ED8",
  triggerWarnings: [],
  tags: ["industry-RETAIL"],
  context:
    "At closing, your register is short by ₹2,000. The manager suggests you cover it to avoid a report.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "The store is busy and the manager says it happens all the time.",
  saferChoice:
    "Report the shortage per policy and request a register audit.",
  assertiveChoice:
    "Refuse to cover it personally and document the discrepancy.",
  riskyChoice:
    "Pay the shortage to avoid conflict.",
  tip: "Personal payment masks operational issues and can violate policy. Always document discrepancies.",
});

// —— Puzzle —— (1 of 2)
const id_retail_puz1 = "industry_retail_puz1";
SCENARIOS[id_retail_puz1] = createMiniScenario({
  id: id_retail_puz1,
  title: "Counterfeit Currency",
  category: "Fraud Detection",
  mode: "Puzzle",
  icon: "🧾",
  difficulty: 4,
  duration: "9 min",
  color: "#1E40AF",
  triggerWarnings: [],
  tags: ["industry-RETAIL"],
  context:
    "A customer pays with a ₹500 note that feels unusually smooth and lacks a visible watermark.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "There is a long queue, and the customer looks impatient.",
  saferChoice:
    "Politely decline the note and follow store procedure for suspected counterfeit currency.",
  assertiveChoice:
    "Call a supervisor to verify the note before completing the sale.",
  riskyChoice:
    "Accept the note to keep the line moving.",
  tip: "Counterfeit notes create financial loss and legal risk. Verification protects the store and staff.",
});

// —— Puzzle —— (2 of 2)
const id_retail_puz2 = "industry_retail_puz2";
SCENARIOS[id_retail_puz2] = createMiniScenario({
  id: id_retail_puz2,
  title: "Pickup Order Scam",
  category: "Online Orders",
  mode: "Puzzle",
  icon: "📦",
  difficulty: 3,
  duration: "8 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-RETAIL"],
  context:
    "A person claims to pick up an online order but cannot show the order confirmation email. They show a screenshot on their phone instead.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "They insist they are in a hurry and the customer service line is busy.",
  saferChoice:
    "Verify the order in the system and require official ID matching the pickup name.",
  assertiveChoice:
    "Ask them to return once they can access the confirmation email.",
  riskyChoice:
    "Hand over the order to avoid a complaint.",
  tip: "Pickup fraud exploits impatience. Identity verification is non-negotiable.",
});

// —— Role-Play —— (1 of 2)
const id_retail_rp1 = "industry_retail_rp1";
SCENARIOS[id_retail_rp1] = createMiniScenario({
  id: id_retail_rp1,
  title: "Aggressive Return",
  category: "Customer Conflict",
  mode: "Role-Play",
  icon: "🗣️",
  difficulty: 3,
  duration: "8 min",
  color: "#1D4ED8",
  triggerWarnings: ["Verbal aggression"],
  tags: ["industry-RETAIL"],
  context:
    "A customer demands a cash refund for a product returned without a receipt, which violates store policy.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  npcInitial:
    "I don't care about your policy. Give me my money or I'll post this everywhere!",
  prompt:
    "They are raising their voice and other customers are watching.",
  saferChoice:
    "Stay calm, explain policy, and offer a manager escalation or store credit as permitted.",
  assertiveChoice:
    "Set boundaries and involve a supervisor immediately if the behavior escalates.",
  riskyChoice:
    "Give the cash refund to avoid a scene.",
  tip: "Policy exceptions under pressure encourage abuse. Use de-escalation and supervisor support.",
});

// —— Role-Play —— (2 of 2)
const id_retail_rp2 = "industry_retail_rp2";
SCENARIOS[id_retail_rp2] = createMiniScenario({
  id: id_retail_rp2,
  title: "Unsafe Backroom Request",
  category: "Workplace Safety",
  mode: "Role-Play",
  icon: "📦",
  difficulty: 3,
  duration: "7 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-RETAIL"],
  context:
    "A supervisor asks you to move a heavy pallet alone in the backroom to save time.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  npcInitial:
    "Just do it quickly. We don't have anyone else right now.",
  prompt:
    "You are not trained for pallet-jack use and there is no safety spotter.",
  saferChoice:
    "Refuse and request proper equipment and assistance as per safety policy.",
  assertiveChoice:
    "Offer to handle a different task until help arrives.",
  riskyChoice:
    "Move the pallet alone to avoid conflict.",
  tip: "Manual handling injuries are common in retail. Safety policy protects you and the store.",
});

// —— Strategy —— (1 of 2)
const id_retail_str1 = "industry_retail_str1";
SCENARIOS[id_retail_str1] = createMiniScenario({
  id: id_retail_str1,
  title: "Mall Evacuation Decision",
  category: "Crisis Response",
  mode: "Strategy",
  icon: "🚨",
  difficulty: 4,
  duration: "10 min",
  color: "#1E40AF",
  triggerWarnings: ["Crisis scenario"],
  tags: ["industry-RETAIL"],
  context:
    "A fire alarm sounds in the mall. Security is unsure if it is a drill. Customers are mid-checkout.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "You must choose whether to evacuate immediately or wait for confirmation.",
  saferChoice:
    "Evacuate immediately and follow the mall safety protocol.",
  assertiveChoice:
    "Direct staff to secure cash drawers and guide customers to exits while confirming with security.",
  riskyChoice:
    "Continue operations until security confirms it is not a drill.",
  tip: "In fire alarms, immediate evacuation is the safest default. Delay increases risk.",
});

// —— Strategy —— (2 of 2)
const id_retail_str2 = "industry_retail_str2";
SCENARIOS[id_retail_str2] = createMiniScenario({
  id: id_retail_str2,
  title: "Product Recall Rush",
  category: "Compliance",
  mode: "Strategy",
  icon: "📢",
  difficulty: 4,
  duration: "10 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-RETAIL"],
  context:
    "A supplier issues an urgent recall for a product currently on your shelves. Customers are buying it today.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "You must decide how quickly to pull stock, inform customers, and notify staff.",
  saferChoice:
    "Remove all stock immediately, post signage, and inform staff and customers right away.",
  assertiveChoice:
    "Block sales in the POS system and assign staff to remove items within the hour.",
  riskyChoice:
    "Wait until end of day to avoid disrupting sales.",
  tip: "Recall response is time-critical. Immediate removal prevents harm and liability.",
});

// —— Story —— (1 of 2)
const id_retail_sto1 = "industry_retail_sto1";
SCENARIOS[id_retail_sto1] = createMiniScenario({
  id: id_retail_sto1,
  title: "Employee Discount Abuse",
  category: "Ethics & Compliance",
  mode: "Story",
  icon: "🧾",
  difficulty: 3,
  duration: "9 min",
  color: "#1D4ED8",
  triggerWarnings: ["Ethical conflict"],
  tags: ["industry-RETAIL"],
  context:
    "You notice a colleague regularly using their employee discount for friends, which is against policy.",
  backgroundMood: "radial-gradient(circle at center, #EFF6FF, #BFDBFE)",
  prompt:
    "They tell you, 'Everyone does it. It’s not a big deal.'",
  saferChoice:
    "Report the misuse to your supervisor or HR as per policy.",
  assertiveChoice:
    "Tell the colleague you are uncomfortable and will document the incident.",
  riskyChoice:
    "Ignore it to avoid conflict.",
  tip: "Discount abuse is a common fraud vector. Consistent enforcement protects the business and staff.",
});

// —— Story —— (2 of 2)
const id_retail_sto2 = "industry_retail_sto2";
SCENARIOS[id_retail_sto2] = createMiniScenario({
  id: id_retail_sto2,
  title: "After-Hours Key Request",
  category: "Physical Security",
  mode: "Story",
  icon: "🔐",
  difficulty: 3,
  duration: "8 min",
  color: "#2563EB",
  triggerWarnings: [],
  tags: ["industry-RETAIL"],
  context:
    "A coworker asks to borrow your store keys after hours because they forgot theirs at home.",
  backgroundMood: "radial-gradient(circle at center, #DBEAFE, #93C5FD)",
  prompt:
    "They promise to return the keys tomorrow and say it is urgent.",
  saferChoice:
    "Decline and follow the key access protocol (manager approval and log).",
  assertiveChoice:
    "Offer to contact the manager to authorize proper access.",
  riskyChoice:
    "Lend the keys to help them out.",
  tip: "Key control is a critical security policy. Personal favors can create liability.",
});

export default SCENARIOS;

