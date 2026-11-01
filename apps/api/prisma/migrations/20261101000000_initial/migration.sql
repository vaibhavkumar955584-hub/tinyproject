CREATE TYPE "MsmeStatus" AS ENUM ('NONE', 'MICRO', 'SMALL', 'MEDIUM');

-- CreateEnum
CREATE TYPE "SearchStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "TenderSource" AS ENUM ('CPPP', 'GEM');

-- CreateEnum
CREATE TYPE "FetchStatus" AS ENUM ('OK', 'FETCH_FAILED', 'NEEDS_MANUAL_STEP');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('TURNOVER', 'EXPERIENCE', 'EMD', 'DOCUMENT', 'LOCATION', 'CERTIFICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "VerdictType" AS ENUM ('BID', 'RISKY', 'DONT_BID');

-- CreateEnum
CREATE TYPE "AlertChangeType" AS ENUM ('DEADLINE', 'EMD', 'CONDITION', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "telegramChatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "annualTurnoverInr" BIGINT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "msmeStatus" "MsmeStatus" NOT NULL DEFAULT 'NONE',
    "certifications" TEXT[],
    "documentsHeld" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_jobs" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "status" "SearchStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "search_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenders" (
    "id" TEXT NOT NULL,
    "source" "TenderSource" NOT NULL,
    "sourceTenderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "estimatedValueInr" BIGINT,
    "emdInr" BIGINT,
    "publishedAt" TIMESTAMP(3),
    "closingAt" TIMESTAMP(3),
    "rawText" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fetchStatus" "FetchStatus" NOT NULL DEFAULT 'OK',

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "type" "RequirementType" NOT NULL,
    "valueJson" JSONB NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceQuote" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verdicts" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "verdict" "VerdictType" NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "checklist" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verdicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_job_tenders" (
    "jobId" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,

    CONSTRAINT "search_job_tenders_pkey" PRIMARY KEY ("jobId","tenderId")
);

-- CreateTable
CREATE TABLE "watches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "intervalHours" INTEGER NOT NULL DEFAULT 6,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),

    CONSTRAINT "watches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "fieldsJson" JSONB NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "changeType" "AlertChangeType" NOT NULL,
    "beforeJson" JSONB NOT NULL,
    "afterJson" JSONB NOT NULL,
    "verdictBefore" TEXT,
    "verdictAfter" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_userId_key" ON "business_profiles"("userId");

-- CreateIndex
CREATE INDEX "search_jobs_profileId_createdAt_idx" ON "search_jobs"("profileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_url_key" ON "tenders"("url");

-- CreateIndex
CREATE INDEX "tenders_closingAt_idx" ON "tenders"("closingAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_source_sourceTenderId_key" ON "tenders"("source", "sourceTenderId");

-- CreateIndex
CREATE INDEX "requirements_tenderId_type_idx" ON "requirements"("tenderId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "verdicts_tenderId_profileId_key" ON "verdicts"("tenderId", "profileId");

-- CreateIndex
CREATE INDEX "watches_active_lastCheckedAt_idx" ON "watches"("active", "lastCheckedAt");

-- CreateIndex
CREATE UNIQUE INDEX "watches_userId_tenderId_key" ON "watches"("userId", "tenderId");

-- CreateIndex
CREATE INDEX "snapshots_tenderId_takenAt_idx" ON "snapshots"("tenderId", "takenAt");

-- CreateIndex
CREATE INDEX "alerts_userId_createdAt_idx" ON "alerts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "agent_logs_jobId_ts_idx" ON "agent_logs"("jobId", "ts");

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_jobs" ADD CONSTRAINT "search_jobs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verdicts" ADD CONSTRAINT "verdicts_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verdicts" ADD CONSTRAINT "verdicts_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_job_tenders" ADD CONSTRAINT "search_job_tenders_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "search_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_job_tenders" ADD CONSTRAINT "search_job_tenders_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watches" ADD CONSTRAINT "watches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watches" ADD CONSTRAINT "watches_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "search_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n