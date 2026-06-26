-- CreateEnum
CREATE TYPE "DisciplineScoreEventSource" AS ENUM ('MISSION_COMPLETION', 'MISSION_ABANDONED', 'FOCUS_DURATION', 'STREAK_BONUS', 'BLOCK_RESISTANCE', 'HEALTHY_CONSUMPTION', 'MANUAL_RECALCULATION');

-- CreateTable
CREATE TABLE "discipline_scores" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "current_rank" VARCHAR(20) NOT NULL DEFAULT 'D',
    "next_rank" VARCHAR(20),
    "progress_to_next_rank" INTEGER NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discipline_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_score_events" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mission_session_id" INTEGER,
    "source" "DisciplineScoreEventSource" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discipline_score_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_score_snapshots" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "rank" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discipline_score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discipline_scores_user_id_key" ON "discipline_scores"("user_id");

-- CreateIndex
CREATE INDEX "idx_discipline_scores_user_id" ON "discipline_scores"("user_id");

-- CreateIndex
CREATE INDEX "idx_discipline_score_events_user_id" ON "discipline_score_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_discipline_score_events_user_created_at" ON "discipline_score_events"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "discipline_score_events_source_session_key" ON "discipline_score_events"("source", "mission_session_id");

-- CreateIndex
CREATE INDEX "idx_discipline_score_snapshots_user_date" ON "discipline_score_snapshots"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "discipline_score_snapshots_user_date_key" ON "discipline_score_snapshots"("user_id", "date");

-- AddForeignKey
ALTER TABLE "discipline_scores" ADD CONSTRAINT "discipline_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_score_events" ADD CONSTRAINT "discipline_score_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_score_snapshots" ADD CONSTRAINT "discipline_score_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
