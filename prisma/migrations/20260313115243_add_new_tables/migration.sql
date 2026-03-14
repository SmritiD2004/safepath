-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('CORPORATE_IT', 'MANUFACTURING', 'HEALTHCARE', 'BANKING_FINANCE', 'RETAIL', 'EDUCATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('PER_SEAT', 'ENTERPRISE', 'TRIAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'ORG_ADMIN';

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" "Industry" NOT NULL,
    "logoUrl" TEXT,
    "licenseType" "LicenseType" NOT NULL DEFAULT 'PER_SEAT',
    "seatLimit" INTEGER NOT NULL DEFAULT 50,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "riskProfile" TEXT,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "deptId" TEXT,
    "jobRole" TEXT,
    "orgRole" "UserRole" NOT NULL DEFAULT 'USER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgScenarioPackage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgScenarioPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceReport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,
    "csvUrl" TEXT,

    CONSTRAINT "ComplianceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Department_orgId_idx" ON "Department"("orgId");

-- CreateIndex
CREATE INDEX "OrgMember_orgId_idx" ON "OrgMember"("orgId");

-- CreateIndex
CREATE INDEX "OrgMember_deptId_idx" ON "OrgMember"("deptId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMember_userId_orgId_key" ON "OrgMember"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgScenarioPackage_orgId_packageId_key" ON "OrgScenarioPackage"("orgId", "packageId");

-- CreateIndex
CREATE INDEX "ComplianceReport_orgId_generatedAt_idx" ON "ComplianceReport"("orgId", "generatedAt");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_deptId_fkey" FOREIGN KEY ("deptId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgScenarioPackage" ADD CONSTRAINT "OrgScenarioPackage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceReport" ADD CONSTRAINT "ComplianceReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
