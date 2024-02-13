/*
  Warnings:

  - Added the required column `siteName` to the `Projects` table without a default value. This is not possible if the table is not empty.
  - Made the column `deployedLink` on table `Projects` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Projects" ADD COLUMN     "siteName" VARCHAR(20) NOT NULL,
ALTER COLUMN "deployedLink" SET NOT NULL;
