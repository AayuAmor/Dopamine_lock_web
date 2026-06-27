-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('STUDY', 'CODING', 'FITNESS', 'READING', 'PROJECT', 'DIGITAL_DETOX', 'CONSISTENCY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "goals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" VARCHAR(1000),
    "category" "GoalCategory" NOT NULL,
    "target_value" DOUBLE PRECISION,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" VARCHAR(60),
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "priority" "GoalPriority" NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "target_date" DATE,
    "completed_at" TIMESTAMPTZ(6),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_missions" (
    "id" SERIAL NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "mission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_missions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_goals_user_id" ON "goals"("user_id");

-- CreateIndex
CREATE INDEX "idx_goals_user_status" ON "goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_goals_user_archived" ON "goals"("user_id", "archived");

-- CreateIndex
CREATE INDEX "idx_goals_user_target_date" ON "goals"("user_id", "target_date");

-- CreateIndex
CREATE UNIQUE INDEX "goal_missions_goal_mission_key" ON "goal_missions"("goal_id", "mission_id");

-- CreateIndex
CREATE INDEX "idx_goal_missions_goal_id" ON "goal_missions"("goal_id");

-- CreateIndex
CREATE INDEX "idx_goal_missions_mission_id" ON "goal_missions"("mission_id");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_missions" ADD CONSTRAINT "goal_missions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_missions" ADD CONSTRAINT "goal_missions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
