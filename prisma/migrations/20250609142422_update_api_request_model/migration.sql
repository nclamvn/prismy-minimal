/*
  Warnings:

  - You are about to drop the column `userId` on the `ApiRequest` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,planId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentMethod` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Subscription_userId_status_key";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "metadata" JSONB;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApiRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "fileSize" INTEGER,
    "language" TEXT,
    "pages" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiRequest_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ApiRequest" ("apiKeyId", "createdAt", "duration", "endpoint", "fileSize", "id", "language", "method", "pages", "status", "tier") SELECT "apiKeyId", "createdAt", "duration", "endpoint", "fileSize", "id", "language", "method", "pages", "status", coalesce("tier", 'free') AS "tier" FROM "ApiRequest";
DROP TABLE "ApiRequest";
ALTER TABLE "new_ApiRequest" RENAME TO "ApiRequest";
CREATE INDEX "ApiRequest_apiKeyId_createdAt_idx" ON "ApiRequest"("apiKeyId", "createdAt");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "interval" TEXT,
    "transactionId" TEXT,
    "gatewayId" TEXT,
    "gatewayData" JSONB,
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "bankRef" TEXT,
    "bankAccount" TEXT,
    "notes" TEXT,
    "processedAt" DATETIME,
    "paidAt" DATETIME,
    "failedAt" DATETIME,
    "refundedAt" DATETIME,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "bankAccount", "bankRef", "createdAt", "currency", "failedAt", "gatewayData", "gatewayId", "id", "notes", "paidAt", "processedAt", "refundedAt", "status", "subscriptionId", "updatedAt", "userId") SELECT "amount", "bankAccount", "bankRef", "createdAt", "currency", "failedAt", "gatewayData", "gatewayId", "id", "notes", "paidAt", "processedAt", "refundedAt", "status", "subscriptionId", "updatedAt", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_paymentMethod_idx" ON "Payment"("paymentMethod");
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_planId_key" ON "Subscription"("userId", "planId");
