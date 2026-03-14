import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import { randomBytes, createHash } from 'crypto'

const prisma = new PrismaClient()

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

function normalizeAccessCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

function hashAccessCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

function generateOrgAccessCode(): { code: string; hash: string; last4: string } {
  const body = `${randomCodeSegment(5)}${randomCodeSegment(5)}`
  const code = `${CODE_PREFIX}-${body.slice(0, 5)}-${body.slice(5)}`
  const normalized = normalizeAccessCode(code)
  return {
    code,
    hash: hashAccessCode(normalized),
    last4: normalized.slice(-4),
  }
}

async function main() {
  const { hash } = bcrypt
  const password = 'Password123!'
  const passwordHash = await hash(password, 12)

  // Platform admin
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'platform.admin@test.local' },
    update: { role: 'ADMIN', emailVerified: new Date(), passwordHash },
    create: {
      email: 'platform.admin@test.local',
      name: 'Platform Admin',
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  // Org + org admin
  const org = await prisma.organisation.create({
    data: {
      name: 'Test Org',
      industry: 'CORPORATE_IT',
      licenseType: 'ENTERPRISE',
      seatLimit: 100,
    },
  })

  const orgAdmin = await prisma.user.upsert({
    where: { email: 'org.admin@test.local' },
    update: { role: 'ORG_ADMIN', emailVerified: new Date(), passwordHash },
    create: {
      email: 'org.admin@test.local',
      name: 'Org Admin',
      passwordHash,
      role: 'ORG_ADMIN',
      emailVerified: new Date(),
    },
  })

  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: orgAdmin.id, orgId: org.id } },
    update: { orgRole: 'ORG_ADMIN' },
    create: {
      userId: orgAdmin.id,
      orgId: org.id,
      orgRole: 'ORG_ADMIN',
    },
  })

  const access = generateOrgAccessCode()
  await prisma.organisation.update({
    where: { id: org.id },
    data: {
      accessCodeHash: access.hash,
      accessCodeLast4: access.last4,
      accessCodeIssuedAt: new Date(),
      accessCodeActive: true,
    },
  })

  // Working professional (no org)
  const proSolo = await prisma.user.upsert({
    where: { email: 'pro.solo@test.local' },
    update: { emailVerified: new Date(), passwordHash, industry: 'CORPORATE_IT' },
    create: {
      email: 'pro.solo@test.local',
      name: 'Pro Solo',
      passwordHash,
      industry: 'CORPORATE_IT',
      emailVerified: new Date(),
    },
  })

  // Working professional (org member)
  const proOrg = await prisma.user.upsert({
    where: { email: 'pro.org@test.local' },
    update: { emailVerified: new Date(), passwordHash, industry: org.industry },
    create: {
      email: 'pro.org@test.local',
      name: 'Pro Org',
      passwordHash,
      industry: org.industry,
      emailVerified: new Date(),
    },
  })

  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: proOrg.id, orgId: org.id } },
    update: {},
    create: {
      userId: proOrg.id,
      orgId: org.id,
      orgRole: 'USER',
    },
  })

  // Individual participant (women safety)
  const individual = await prisma.user.upsert({
    where: { email: 'individual.safety@test.local' },
    update: { emailVerified: new Date(), passwordHash, industry: 'CUSTOM' },
    create: {
      email: 'individual.safety@test.local',
      name: 'Individual Safety',
      passwordHash,
      industry: 'CUSTOM',
      emailVerified: new Date(),
    },
  })

  const output = {
    password,
    orgId: org.id,
    accessCode: access.code,
    accounts: {
      platformAdmin: platformAdmin.email,
      orgAdmin: orgAdmin.email,
      proSolo: proSolo.email,
      proOrg: proOrg.email,
      individual: individual.email,
    },
  }

  console.log(output)
  fs.writeFileSync('test-accounts.json', JSON.stringify(output, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
