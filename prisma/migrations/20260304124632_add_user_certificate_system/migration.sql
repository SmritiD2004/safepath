-- CreateTable
CREATE TABLE "UserCertificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" TEXT NOT NULL DEFAULT 'SafePath',
    "avgConfidence" INTEGER NOT NULL,
    "avgEq" INTEGER NOT NULL,
    "avgRisk" INTEGER NOT NULL,
    "completedScenarios" INTEGER NOT NULL,
    "totalRuns" INTEGER NOT NULL,
    "readinessLevel" TEXT NOT NULL,

    CONSTRAINT "UserCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCertificate_userId_key" ON "UserCertificate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCertificate_code_key" ON "UserCertificate"("code");

-- CreateIndex
CREATE INDEX "UserCertificate_issuedAt_idx" ON "UserCertificate"("issuedAt");

-- AddForeignKey
ALTER TABLE "UserCertificate" ADD CONSTRAINT "UserCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
