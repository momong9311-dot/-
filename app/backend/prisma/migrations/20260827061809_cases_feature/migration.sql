/*
  Warnings:

  - You are about to drop the column `currentState` on the `CustomerCase` table. All the data in the column will be lost.
  - You are about to drop the column `customerAlias` on the `CustomerCase` table. All the data in the column will be lost.
  - You are about to drop the column `designElements` on the `CustomerCase` table. All the data in the column will be lost.
  - You are about to drop the column `designStrategy` on the `CustomerCase` table. All the data in the column will be lost.
  - You are about to drop the column `educationPoint` on the `CustomerCase` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `CustomerCase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN "dimension" TEXT;

-- CreateTable
CREATE TABLE "CustomerCaseSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerCaseId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    CONSTRAINT "CustomerCaseSkill_customerCaseId_fkey" FOREIGN KEY ("customerCaseId") REFERENCES "CustomerCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerCaseSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designerId" TEXT NOT NULL,
    "branchId" TEXT,
    "skillId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "customerNeed" TEXT,
    "desiredImage" TEXT,
    "currentConcern" TEXT,
    "observation" TEXT,
    "diagnosis" TEXT,
    "problemDefinition" TEXT,
    "imageDirection" TEXT,
    "designGoal" TEXT,
    "dsLength" TEXT,
    "dsSilhouette" TEXT,
    "dsVolume" TEXT,
    "dsLine" TEXT,
    "dsWeight" TEXT,
    "dsTexture" TEXT,
    "dsCurl" TEXT,
    "dsParting" TEXT,
    "dsFringe" TEXT,
    "dsColor" TEXT,
    "dsReason" TEXT,
    "procedure" TEXT,
    "result" TEXT,
    "beforeRef" TEXT,
    "afterRef" TEXT,
    "designerReflection" TEXT,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerCase_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CustomerCase_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerCase_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CustomerCase" ("afterRef", "beforeRef", "createdAt", "customerNeed", "designerId", "diagnosis", "id", "imageDirection", "isSeed", "observation", "problemDefinition", "procedure", "result", "skillId") SELECT "afterRef", "beforeRef", "createdAt", "customerNeed", "designerId", "diagnosis", "id", "imageDirection", "isSeed", "observation", "problemDefinition", "procedure", "result", "skillId" FROM "CustomerCase";
DROP TABLE "CustomerCase";
ALTER TABLE "new_CustomerCase" RENAME TO "CustomerCase";
CREATE TABLE "new_Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT,
    "subjectUserId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "skillId" TEXT,
    "customerCaseId" TEXT,
    "strength" TEXT NOT NULL DEFAULT '',
    "gap" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "nextAction" TEXT NOT NULL DEFAULT '',
    "dueDate" DATETIME,
    "acknowledgedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Feedback_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_customerCaseId_fkey" FOREIGN KEY ("customerCaseId") REFERENCES "CustomerCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Feedback" ("acknowledgedAt", "authorId", "createdAt", "evaluationId", "id", "message", "nextAction", "skillId", "subjectUserId") SELECT "acknowledgedAt", "authorId", "createdAt", "evaluationId", "id", "message", "nextAction", "skillId", "subjectUserId" FROM "Feedback";
DROP TABLE "Feedback";
ALTER TABLE "new_Feedback" RENAME TO "Feedback";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCaseSkill_customerCaseId_skillId_key" ON "CustomerCaseSkill"("customerCaseId", "skillId");
