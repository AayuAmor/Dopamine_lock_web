-- AlterTable
ALTER TABLE "mission_sessions" ADD COLUMN     "actual_duration_minutes" INTEGER,
ADD COLUMN     "blocked_websites_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "completion_reason" VARCHAR(120),
ADD COLUMN     "focus_percentage" INTEGER,
ADD COLUMN     "interruption_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planned_duration_minutes" INTEGER;

-- CreateIndex
CREATE INDEX "idx_mission_sessions_user_ended_at" ON "mission_sessions"("user_id", "ended_at");

-- CreateIndex
CREATE INDEX "idx_mission_sessions_user_completed_at" ON "mission_sessions"("user_id", "completed_at");
