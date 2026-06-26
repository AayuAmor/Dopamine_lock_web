-- CreateEnum
CREATE TYPE "BlockRuleType" AS ENUM ('BLOCKED', 'ALLOWED');

-- CreateEnum
CREATE TYPE "BlockCategory" AS ENUM ('SOCIAL_MEDIA', 'ENTERTAINMENT', 'GAMING', 'SHOPPING', 'NEWS', 'ADULT', 'CUSTOM', 'PRODUCTIVITY', 'EDUCATION');

-- CreateEnum
CREATE TYPE "BlockRuleSource" AS ENUM ('CUSTOM', 'PRESET', 'MISSION');

-- CreateTable
CREATE TABLE "block_rules" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "type" "BlockRuleType" NOT NULL,
    "category" "BlockCategory" NOT NULL DEFAULT 'CUSTOM',
    "reason" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" "BlockRuleSource" NOT NULL DEFAULT 'CUSTOM',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "block_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_block_lists" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "category" "BlockCategory" NOT NULL,
    "websites" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "preset_block_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preset_block_lists" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "preset_block_list_id" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_preset_block_lists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "block_rules_user_domain_type_key" ON "block_rules"("user_id", "domain", "type");

-- CreateIndex
CREATE INDEX "idx_block_rules_user_id" ON "block_rules"("user_id");

-- CreateIndex
CREATE INDEX "idx_block_rules_user_active" ON "block_rules"("user_id", "active");

-- CreateIndex
CREATE INDEX "idx_block_rules_user_type" ON "block_rules"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "preset_block_lists_name_key" ON "preset_block_lists"("name");

-- CreateIndex
CREATE INDEX "idx_preset_block_lists_active" ON "preset_block_lists"("active");

-- CreateIndex
CREATE UNIQUE INDEX "user_preset_block_lists_user_preset_key" ON "user_preset_block_lists"("user_id", "preset_block_list_id");

-- CreateIndex
CREATE INDEX "idx_user_preset_block_lists_user_enabled" ON "user_preset_block_lists"("user_id", "enabled");

-- AddForeignKey
ALTER TABLE "block_rules" ADD CONSTRAINT "block_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preset_block_lists" ADD CONSTRAINT "user_preset_block_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preset_block_lists" ADD CONSTRAINT "user_preset_block_lists_preset_block_list_id_fkey" FOREIGN KEY ("preset_block_list_id") REFERENCES "preset_block_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
