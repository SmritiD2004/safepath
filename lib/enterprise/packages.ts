export interface ScenarioPackage {
  id: string
  name: string
  industry: string
  description: string
  icon: string
  color: string
  scenarioIds: string[]
  complianceFramework?: string
}

export const ENTERPRISE_PACKAGES: Record<string, ScenarioPackage> = {
  'corporate-harassment': {
    id: 'corporate-harassment',
    name: 'Workplace Harassment Prevention',
    industry: 'CORPORATE_IT',
    description: 'POSH-compliant harassment awareness for IT teams.',
    icon: '💼',
    color: '#1565C0',
    scenarioIds: [
      'workplace-harassment-it',
      'ethical-decision-it',
      'conflict-resolution',
      'corporate-compliance',
      // ── New: 2 per mode (Simulation, Puzzle, Role-Play, Strategy, Story) ──
      'industry_corp_it_1',        // Simulation 1 — Server Room Tailgating
      'industry_corp_it_sim2',     // Simulation 2 — Ransomware Alert
      'industry_corp_it_puz1',     // Puzzle 1     — Phishing Inbox
      'industry_corp_it_puz2',     // Puzzle 2     — USB Drop Attack
      'industry_corp_it_rp1',      // Role-Play 1  — Vishing Call
      'industry_corp_it_rp2',      // Role-Play 2  — The Persistent Vendor
      'industry_corp_it_str1',     // Strategy 1   — Data Breach Response
      'industry_corp_it_str2',     // Strategy 2   — Shadow IT Discovery
      'industry_corp_it_sto1',     // Story 1      — The Whistleblower's Dilemma
      'industry_corp_it_sto2',     // Story 2      — The Promoted Insider
    ],
    complianceFramework: 'POSH Act 2013',
  },

  'manufacturing-safety': {
    id: 'manufacturing-safety',
    name: 'Machine Safety & Accident Prevention',
    industry: 'MANUFACTURING',
    description: 'Machine malfunction, chemical hazards, evacuation drills.',
    icon: '🏭',
    color: '#E65100',
    scenarioIds: [
      'machine-malfunction',
      'chemical-spill-response',
      'emergency-evacuation',
      'ppe-compliance',
      // ── New: 2 per mode (Simulation, Puzzle, Role-Play, Strategy, Story) ──
      'industry_manufacturing_sim1',  // Simulation 1 — Emergency Stop Override
      'industry_manufacturing_sim2',  // Simulation 2 — Fire Exit Blocked
      'industry_manufacturing_1',     // Puzzle 1     — Bypassed Safety Guard
      'industry_manufacturing_puz2',  // Puzzle 2     — Unlabelled Chemical Drum
      'industry_manufacturing_rp1',   // Role-Play 1  — Near-Miss Reporting
      'industry_manufacturing_rp2',   // Role-Play 2  — PPE Refusal
      'industry_manufacturing_str1',  // Strategy 1   — Chemical Spill Triage
      'industry_manufacturing_str2',  // Strategy 2   — Contractor Safety Induction Gap
      'industry_manufacturing_sto1',  // Story 1      — The Quota Dilemma
      'industry_manufacturing_sto2',  // Story 2      — New Worker, Unsafe Machine
    ],
    complianceFramework: 'Factories Act 1948',
  },

  'banking-fraud': {
    id: 'banking-fraud',
    name: 'Fraud Detection & Financial Compliance',
    industry: 'BANKING_FINANCE',
    description: 'Phishing, insider threats, KYC fraud, RBI compliance.',
    icon: '🏦',
    color: '#6A1B9A',
    scenarioIds: [
      'phishing-email-detection',
      'insider-threat-scenario',
      'kyc-fraud-attempt',
      'rbi-compliance-breach',
      // ── New: 2 per mode (Simulation, Puzzle, Role-Play, Strategy, Story) ──
      'industry_banking_sim1',    // Simulation 1 — Suspicious Wire Transfer
      'industry_banking_sim2',    // Simulation 2 — ATM Skimmer Report
      'industry_banking_puz1',    // Puzzle 1     — KYC Document Mismatch
      'industry_banking_puz2',    // Puzzle 2     — Structured Cash Deposits
      'industry_banking_rp1',     // Role-Play 1  — Pressured Cross-Sell
      'industry_banking_rp2',     // Role-Play 2  — Insider Trade Tip
      'industry_banking_str1',    // Strategy 1   — Core Banking System Outage
      'industry_banking_str2',    // Strategy 2   — Loan Restructuring Pressure
      'industry_banking_sto1',    // Story 1      — The Friendly Auditor
      'industry_banking_sto2',    // Story 2      — Account Access After Bereavement
    ],
    complianceFramework: 'RBI Compliance',
  },
}
