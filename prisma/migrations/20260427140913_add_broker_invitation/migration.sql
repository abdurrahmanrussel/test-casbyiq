-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateTable
CREATE TABLE "BrokerInvitation" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "agentEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerInvitation_token_key" ON "BrokerInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerInvitation_brokerId_agentEmail_key" ON "BrokerInvitation"("brokerId", "agentEmail");

-- AddForeignKey
ALTER TABLE "BrokerInvitation" ADD CONSTRAINT "BrokerInvitation_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
