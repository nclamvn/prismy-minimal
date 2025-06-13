-- CreateTable
CREATE TABLE "TranslationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "fileType" TEXT NOT NULL DEFAULT 'txt',
    "metadata" JSONB,
    CONSTRAINT "TranslationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TranslationJob_userId_idx" ON "TranslationJob"("userId");

-- CreateIndex
CREATE INDEX "TranslationJob_expiresAt_idx" ON "TranslationJob"("expiresAt");

-- CreateIndex
CREATE INDEX "TranslationJob_createdAt_idx" ON "TranslationJob"("createdAt");
