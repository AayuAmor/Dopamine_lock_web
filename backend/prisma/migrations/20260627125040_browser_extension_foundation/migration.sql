-- CreateEnum
CREATE TYPE "BlockedAttemptSource" AS ENUM ('EXTENSION', 'WEB', 'SYSTEM');

-- CreateTable
CREATE TABLE "extension_statuses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "browser" VARCHAR(80),
    "extension_version" VARCHAR(40),
    "installed" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "extension_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mission_session_id" INTEGER,
    "domain" VARCHAR(255) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "page_title" VARCHAR(500),
    "reason" VARCHAR(500) NOT NULL,
    "source" "BlockedAttemptSource" NOT NULL DEFAULT 'EXTENSION',
    "attempted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "extension_statuses_user_id_key" ON "extension_statuses"("user_id");

-- CreateIndex
CREATE INDEX "idx_extension_statuses_user_id" ON "extension_statuses"("user_id");

-- CreateIndex
CREATE INDEX "idx_blocked_attempts_user_attempted_at" ON "blocked_attempts"("user_id", "attempted_at");

-- CreateIndex
CREATE INDEX "idx_blocked_attempts_user_domain" ON "blocked_attempts"("user_id", "domain");

-- CreateIndex
CREATE INDEX "idx_blocked_attempts_session_id" ON "blocked_attempts"("mission_session_id");

-- AddForeignKey
ALTER TABLE "extension_statuses" ADD CONSTRAINT "extension_statuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_attempts" ADD CONSTRAINT "blocked_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_attempts" ADD CONSTRAINT "blocked_attempts_mission_session_id_fkey" FOREIGN KEY ("mission_session_id") REFERENCES "mission_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
