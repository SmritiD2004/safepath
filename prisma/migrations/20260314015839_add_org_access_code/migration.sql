/*
  Warnings:

  - A unique constraint covering the columns `[accessCodeHash]` on the table `Organisation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "accessCodeActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accessCodeHash" TEXT,
ADD COLUMN     "accessCodeIssuedAt" TIMESTAMP(3),
ADD COLUMN     "accessCodeLast4" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "industry" "Industry";

-- CreateTable
CREATE TABLE "OrgInvitation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deptId" TEXT,
    "jobRole" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "OrgInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgInvitation_token_key" ON "OrgInvitation"("token");

-- CreateIndex
CREATE INDEX "OrgInvitation_email_idx" ON "OrgInvitation"("email");

-- CreateIndex
CREATE INDEX "OrgInvitation_token_idx" ON "OrgInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_accessCodeHash_key" ON "Organisation"("accessCodeHash");

-- AddForeignKey
ALTER TABLE "OrgInvitation" ADD CONSTRAINT "OrgInvitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
