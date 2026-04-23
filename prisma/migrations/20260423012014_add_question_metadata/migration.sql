-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "isScored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "questionType" TEXT NOT NULL DEFAULT 'likert',
ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "section" TEXT NOT NULL DEFAULT '1A',
ADD COLUMN     "storageTarget" TEXT NOT NULL DEFAULT 'raw_json',
ADD COLUMN     "surveyType" TEXT NOT NULL DEFAULT 'agent_intake',
ALTER COLUMN "dimension" DROP NOT NULL;
