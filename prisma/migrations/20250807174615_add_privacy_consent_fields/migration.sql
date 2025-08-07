-- AlterTable
ALTER TABLE "User" ADD COLUMN     "consentTimestamp" TIMESTAMP(3),
ADD COLUMN     "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacyPolicyVersion" TEXT;
