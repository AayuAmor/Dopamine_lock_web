-- CreateEnum
CREATE TYPE "MissionSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "missions" ADD COLUMN     "abandoned_session_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completed_session_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "last_started_at" TIMESTAMPTZ(6),
ADD COLUMN     "session_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "mission_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mission_id" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "paused_at" TIMESTAMPTZ(6),
    "total_paused_seconds" INTEGER NOT NULL DEFAULT 0,
    "elapsed_seconds" INTEGER NOT NULL DEFAULT 0,
    "remaining_seconds" INTEGER NOT NULL DEFAULT 0,
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "status" "MissionSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "abandoned" BOOLEAN NOT NULL DEFAULT false,
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mission_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_mission_sessions_user_id" ON "mission_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_mission_sessions_mission_id" ON "mission_sessions"("mission_id");

-- CreateIndex
CREATE INDEX "idx_mission_sessions_user_status" ON "mission_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_mission_sessions_user_started_at" ON "mission_sessions"("user_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "idx_one_unfinished_mission_session_per_user" ON "mission_sessions"("user_id") WHERE "ended_at" IS NULL AND "status" IN ('ACTIVE', 'PAUSED');

-- AddForeignKey
ALTER TABLE "mission_sessions" ADD CONSTRAINT "mission_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_sessions" ADD CONSTRAINT "mission_sessions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
