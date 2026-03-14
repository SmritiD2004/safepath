import { createHash, randomBytes } from 'crypto'

const CODE_PREFIX = 'SP'
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCodeSegment(length: number): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return out
}

export function normalizeAccessCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export function hashAccessCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function generateOrgAccessCode(): { code: string; hash: string; last4: string } {
  const body = `${randomCodeSegment(5)}${randomCodeSegment(5)}`
  const code = `${CODE_PREFIX}-${body.slice(0, 5)}-${body.slice(5)}`
  const normalized = normalizeAccessCode(code)
  return {
    code,
    hash: hashAccessCode(normalized),
    last4: normalized.slice(-4),
  }
}
