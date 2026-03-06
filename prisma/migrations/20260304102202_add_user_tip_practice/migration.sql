-- CreateTable
CREATE TABLE "UserTipPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "practiced" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTipPractice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTipPractice_userId_idx" ON "UserTipPractice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTipPractice_userId_tipId_key" ON "UserTipPractice"("userId", "tipId");

-- AddForeignKey
ALTER TABLE "UserTipPractice" ADD CONSTRAINT "UserTipPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
