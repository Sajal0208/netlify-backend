/*
  Warnings:

  - Added the required column `repoUrl` to the `Projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Projects" ADD COLUMN     "repoUrl" VARCHAR(255) NOT NULL;
