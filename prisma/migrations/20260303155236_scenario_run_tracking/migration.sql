-- CreateEnum
CREATE TYPE "ScenarioRunStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "ScenarioRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "scenarioId" TEXT NOT NULL,
    "status" "ScenarioRunStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "initialRisk" INTEGER NOT NULL,
    "initialConfidence" INTEGER NOT NULL,
    "initialEq" INTEGER NOT NULL,
    "finalRisk" INTEGER,
    "finalConfidence" INTEGER,
    "finalEq" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,

    CONSTRAINT "ScenarioRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioChoiceEvent" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "choiceText" TEXT NOT NULL,
    "riskImpact" INTEGER NOT NULL,
    "eqImpact" INTEGER NOT NULL,
    "riskBefore" INTEGER NOT NULL,
    "riskAfter" INTEGER NOT NULL,
    "confidenceBefore" INTEGER NOT NULL,
    "confidenceAfter" INTEGER NOT NULL,
    "eqBefore" INTEGER NOT NULL,
    "eqAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioChoiceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScenarioRun_scenarioId_idx" ON "ScenarioRun"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioRun_userId_idx" ON "ScenarioRun"("userId");

-- CreateIndex
CREATE INDEX "ScenarioRun_startedAt_idx" ON "ScenarioRun"("startedAt");

-- CreateIndex
CREATE INDEX "ScenarioChoiceEvent_runId_createdAt_idx" ON "ScenarioChoiceEvent"("runId", "createdAt");

-- AddForeignKey
ALTER TABLE "ScenarioRun" ADD CONSTRAINT "ScenarioRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioChoiceEvent" ADD CONSTRAINT "ScenarioChoiceEvent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ScenarioRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
