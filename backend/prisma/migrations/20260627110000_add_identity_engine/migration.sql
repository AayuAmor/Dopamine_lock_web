-- CreateTable
CREATE TABLE "user_identities" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "current_title" VARCHAR(100) NOT NULL,
    "current_tier" VARCHAR(40) NOT NULL,
    "identity_score" INTEGER NOT NULL DEFAULT 0,
    "identity_statement" VARCHAR(500) NOT NULL,
    "strongest_trait" VARCHAR(100),
    "weakest_trait" VARCHAR(100),
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_snapshots" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "tier" VARCHAR(40) NOT NULL,
    "score" INTEGER NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_user_id_key" ON "user_identities"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_identities_user_id" ON "user_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "identity_snapshots_user_snapshot_date_key" ON "identity_snapshots"("user_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "idx_identity_snapshots_user_date" ON "identity_snapshots"("user_id", "snapshot_date");

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_snapshots" ADD CONSTRAINT "identity_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
