-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" VARCHAR(500),
ADD COLUMN     "daily_focus_goal" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "discipline_title" VARCHAR(80) NOT NULL DEFAULT 'DISCIPLINED BUILDER',
ADD COLUMN     "preferred_mission_duration" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "timezone" VARCHAR(80) NOT NULL DEFAULT 'Asia/Kathmandu';
