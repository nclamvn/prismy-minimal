-- CreateTable
CREATE TABLE "Usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "tier" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Key',
    "userId" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" DATETIME,
    "lastUsedAt" DATETIME,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ApiKey" ("active", "createdAt", "expiresAt", "id", "key", "lastUsed", "name", "rateLimit", "requests", "tier", "updatedAt", "userId") SELECT "active", "createdAt", "expiresAt", "id", "key", "lastUsed", "name", "rateLimit", "requests", "tier", "updatedAt", "userId" FROM "ApiKey";
DROP TABLE "ApiKey";
ALTER TABLE "new_ApiKey" RENAME TO "ApiKey";
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Usage_userId_createdAt_idx" ON "Usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Usage_type_createdAt_idx" ON "Usage"("type", "createdAt");
