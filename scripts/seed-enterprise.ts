import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const { hash } = bcrypt
  const passwordHash = await hash('password123', 12)
  const email = 'admin@testorg.com'

  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ORG_ADMIN', emailVerified: new Date() },
    create: {
      email,
      name: 'Org Admin',
      passwordHash,
      role: 'ORG_ADMIN',
      emailVerified: new Date(),
    },
  })

  // 2. Create Organisation
  const org = await prisma.organisation.create({
    data: {
      name: 'Test Enterprise',
      industry: 'CORPORATE_IT',
      licenseType: 'ENTERPRISE',
      seatLimit: 100,
    },
  })

  // 3. Create Org Membership
  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    update: { orgRole: 'ORG_ADMIN' },
    create: {
      userId: user.id,
      orgId: org.id,
      orgRole: 'ORG_ADMIN',
    },
  })

  const output = {
    orgId: org.id,
    adminEmail: email,
    adminPassword: 'password123',
  }
  
  console.log(output)
  fs.writeFileSync('orgId.txt', org.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
