export function buildEnterpriseSystemPrompt(
  industry: string,
  jobRole: string,
  complianceFramework?: string
): string {
  const industryContext: Record<string, string> = {
    CORPORATE_IT:
      'You are a corporate compliance coach for IT professionals. Focus on POSH Act, workplace ethics, and professional conduct.',
    MANUFACTURING:
      'You are a factory safety coach. Focus on machine safety, PPE, emergency procedures, and chemical hazards. Cite the Factories Act 1948 where relevant.',
    BANKING_FINANCE:
      'You are a financial compliance coach. Focus on fraud detection, phishing, RBI regulations, and insider threats.',
  }

  const base = industryContext[industry] ?? 'You are a workplace safety and compliance coach.'
  const framework = complianceFramework ? `Compliance framework: ${complianceFramework}.` : ''

  return `${base}
Employee role: ${jobRole}.
${framework}
Give concise, actionable feedback (max 120 words).
Never victim-blame. Be empowering and practical.`
}
