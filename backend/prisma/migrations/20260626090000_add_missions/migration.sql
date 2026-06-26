-- CreateEnum
CREATE TYPE "MissionDifficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('Draft', 'Ready', 'Archived');

-- CreateTable
CREATE TABLE "missions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "goal" VARCHAR(220) NOT NULL,
    "description" VARCHAR(1000),
    "duration_minutes" INTEGER NOT NULL,
    "difficulty" "MissionDifficulty" NOT NULL,
    "strict_mode" BOOLEAN NOT NULL DEFAULT true,
    "block_notifications" BOOLEAN NOT NULL DEFAULT true,
    "prevent_tab_switching" BOOLEAN NOT NULL DEFAULT true,
    "blocked_websites" JSONB NOT NULL DEFAULT '[]',
    "allowed_websites" JSONB NOT NULL DEFAULT '[]',
    "blocked_categories" JSONB NOT NULL DEFAULT '[]',
    "status" "MissionStatus" NOT NULL DEFAULT 'Ready',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_missions_user_id" ON "missions"("user_id");

-- CreateIndex
CREATE INDEX "idx_missions_user_archived" ON "missions"("user_id", "archived");

-- CreateIndex
CREATE INDEX "idx_missions_user_favorite" ON "missions"("user_id", "favorite");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
