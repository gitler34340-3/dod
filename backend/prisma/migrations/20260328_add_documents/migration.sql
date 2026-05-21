/*
  Warnings:

  - Added the required column `documents` to the `users` table without a default value. This is not possible if the table has not been empty.

*/
-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'document',
    "status" TEXT NOT NULL DEFAULT 'active',
    "owner_id" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "documents_owner_id_idx" ON "documents"("owner_id");
