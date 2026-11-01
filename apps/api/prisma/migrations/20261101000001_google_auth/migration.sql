-- Google is now the only interactive sign-in provider. Keep the legacy hash nullable
-- so existing accounts can be linked after a verified Google sign-in.
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "googleSubject" TEXT;
CREATE UNIQUE INDEX "users_googleSubject_key" ON "users"("googleSubject");
