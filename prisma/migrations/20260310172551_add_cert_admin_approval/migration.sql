-- AlterTable
ALTER TABLE "UserCertificate" ADD COLUMN     "adminApproved" BOOLEAN,
ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "adminReviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "UserCertificate_adminApproved_idx" ON "UserCertificate"("adminApproved");
