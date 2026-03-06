-- CreateEnum
CREATE TYPE "RolePlaySessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "RolePlaySpeaker" AS ENUM ('USER', 'NPC', 'SYSTEM');

-- CreateTable
CREATE TABLE "RolePlaySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "scenarioId" TEXT NOT NULL,
    "status" "RolePlaySessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "initialRisk" INTEGER NOT NULL DEFAULT 40,
    "initialConfidence" INTEGER NOT NULL DEFAULT 50,
    "initialEq" INTEGER NOT NULL DEFAULT 50,
    "currentRisk" INTEGER NOT NULL DEFAULT 40,
    "currentConfidence" INTEGER NOT NULL DEFAULT 50,
    "currentEq" INTEGER NOT NULL DEFAULT 50,
    "finalRisk" INTEGER,
    "finalConfidence" INTEGER,
    "finalEq" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,

    CONSTRAINT "RolePlaySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePlayMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "speaker" "RolePlaySpeaker" NOT NULL,
    "content" TEXT NOT NULL,
    "riskImpact" INTEGER NOT NULL DEFAULT 0,
    "confidenceImpact" INTEGER NOT NULL DEFAULT 0,
    "eqImpact" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePlayMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RolePlaySession_userId_idx" ON "RolePlaySession"("userId");

-- CreateIndex
CREATE INDEX "RolePlaySession_scenarioId_idx" ON "RolePlaySession"("scenarioId");

-- CreateIndex
CREATE INDEX "RolePlaySession_startedAt_idx" ON "RolePlaySession"("startedAt");

-- CreateIndex
CREATE INDEX "RolePlayMessage_sessionId_createdAt_idx" ON "RolePlayMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "RolePlaySession" ADD CONSTRAINT "RolePlaySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePlayMessage" ADD CONSTRAINT "RolePlayMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RolePlaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
