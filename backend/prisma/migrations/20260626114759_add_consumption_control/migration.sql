-- CreateEnum
CREATE TYPE "ConsumptionLogSource" AS ENUM ('MANUAL', 'EXTENSION', 'IMPORTED');

-- CreateTable
CREATE TABLE "consumption_platforms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80) NOT NULL DEFAULT 'SHORT_FORM',
    "domain" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consumption_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_limits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform_id" INTEGER,
    "max_videos_per_day" INTEGER NOT NULL DEFAULT 40,
    "max_minutes_per_day" INTEGER NOT NULL DEFAULT 120,
    "warning_threshold" INTEGER NOT NULL DEFAULT 80,
    "strict_lock_mode" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consumption_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "videos_watched" INTEGER NOT NULL DEFAULT 0,
    "minutes_consumed" INTEGER NOT NULL DEFAULT 0,
    "source" "ConsumptionLogSource" NOT NULL DEFAULT 'MANUAL',
    "consumed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumption_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_daily_summaries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "total_videos" INTEGER NOT NULL DEFAULT 0,
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 100,
    "limit_reached" BOOLEAN NOT NULL DEFAULT false,
    "warning_reached" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consumption_daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consumption_platforms_name_key" ON "consumption_platforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "consumption_platforms_slug_key" ON "consumption_platforms"("slug");

-- CreateIndex
CREATE INDEX "idx_consumption_platforms_slug" ON "consumption_platforms"("slug");

-- CreateIndex
CREATE INDEX "idx_consumption_limits_user_id" ON "consumption_limits"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "consumption_limits_user_platform_key" ON "consumption_limits"("user_id", "platform_id");

-- CreateIndex
CREATE INDEX "idx_consumption_logs_user_consumed_at" ON "consumption_logs"("user_id", "consumed_at");

-- CreateIndex
CREATE INDEX "idx_consumption_logs_platform_id" ON "consumption_logs"("platform_id");

-- CreateIndex
CREATE INDEX "idx_consumption_daily_summaries_user_date" ON "consumption_daily_summaries"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "consumption_daily_summaries_user_date_key" ON "consumption_daily_summaries"("user_id", "date");

-- AddForeignKey
ALTER TABLE "consumption_limits" ADD CONSTRAINT "consumption_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_limits" ADD CONSTRAINT "consumption_limits_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "consumption_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "consumption_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_daily_summaries" ADD CONSTRAINT "consumption_daily_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
