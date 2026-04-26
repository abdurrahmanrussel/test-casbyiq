-- AlterTable
ALTER TABLE "User" ADD COLUMN     "brokerId" TEXT;

-- CreateTable
CREATE TABLE "ScoreResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "surveyType" TEXT NOT NULL,
    "autonomyScore" DOUBLE PRECISION NOT NULL,
    "competenceScore" DOUBLE PRECISION NOT NULL,
    "relatednessScore" DOUBLE PRECISION NOT NULL,
    "gritScore" DOUBLE PRECISION NOT NULL,
    "selfRegScore" DOUBLE PRECISION NOT NULL,
    "eiScore" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoreResult_userId_key" ON "ScoreResult"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreResult" ADD CONSTRAINT "ScoreResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
