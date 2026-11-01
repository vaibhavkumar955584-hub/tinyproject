-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TenderImageSource" AS ENUM ('SCREENSHOT', 'ORG_BADGE', 'CATEGORY_ICON');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "search_jobs" ADD COLUMN IF NOT EXISTS "streamingUrl" TEXT;

-- AlterTable
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "thumbUrl" TEXT;
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "imageSource" "TenderImageSource";
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "imageCapturedAt" TIMESTAMP(3);
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "imageWidth" INTEGER;
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "imageHeight" INTEGER;
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "portalId" TEXT;
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "alsoOn" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "relevance" INTEGER DEFAULT 50;
ALTER TABLE "tenders" ADD COLUMN IF NOT EXISTS "whyMatched" TEXT;

-- AlterTable
ALTER TABLE "requirements" ADD COLUMN IF NOT EXISTS "screenshotUrl" TEXT;
ALTER TABLE "requirements" ADD COLUMN IF NOT EXISTS "evidenceImageUrl" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "tinyfish_runs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "jobId" TEXT,
    "portal" "TenderSource" NOT NULL,
    "goal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "streamingUrl" TEXT,
    "stepsCount" INTEGER NOT NULL DEFAULT 0,
    "resultJson" JSONB,
    "errorJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tinyfish_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "portal_health" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastError" TEXT,
    "avgLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "circuitOpenUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tinyfish_runs_runId_key" ON "tinyfish_runs"("runId");
CREATE INDEX IF NOT EXISTS "tinyfish_runs_jobId_portal_idx" ON "tinyfish_runs"("jobId", "portal");
CREATE INDEX IF NOT EXISTS "tinyfish_runs_status_idx" ON "tinyfish_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "portal_health_portalId_key" ON "portal_health"("portalId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "tinyfish_runs" ADD CONSTRAINT "tinyfish_runs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "search_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
