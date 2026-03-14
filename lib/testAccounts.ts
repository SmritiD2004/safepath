export function isTestEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@test.local')
}
